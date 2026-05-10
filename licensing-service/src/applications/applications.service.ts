import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Application } from './entities/application.entity';
import { ApplicationDocument } from '../documents/entities/document.entity';
import { User } from '../users/entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { StateMachineService } from './state-machine.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import {
  RequestAdditionalInfoDto,
  CompleteReviewDto,
  MakeDecisionDto,
} from './dto/transition.dto';
import { ApplicationStatus } from '../common/enums/application-status.enum';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private appRepository: Repository<Application>,
    @InjectRepository(ApplicationDocument)
    private docRepository: Repository<ApplicationDocument>,
    private dataSource: DataSource,
    private stateMachine: StateMachineService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateApplicationDto, actor: User): Promise<Application> {
    const app = this.appRepository.create({
      ...dto,
      applicant_id: actor.id,
      status: ApplicationStatus.DRAFT,
    });

    const saved = await this.appRepository.save(app);

    await this.auditService.log({
      application_id: saved.id,
      actor_id: actor.id,
      action: 'APPLICATION_CREATED',
      previous_state: null,
      new_state: ApplicationStatus.DRAFT,
      metadata: { institution_name: dto.institution_name },
    });

    return saved;
  }

  async findAll(actor: User): Promise<Application[]> {
    const qb = this.appRepository
      .createQueryBuilder('app')
      .leftJoinAndSelect('app.applicant', 'applicant')
      .leftJoinAndSelect('app.reviewer', 'reviewer')
      .leftJoinAndSelect('app.approver', 'approver')
      .orderBy('app.created_at', 'DESC');

    // Applicants only see their own applications
    if (actor.role === UserRole.APPLICANT) {
      qb.where('app.applicant_id = :id', { id: actor.id });
    }

    return qb.getMany();
  }

  async findOne(id: string, actor: User): Promise<Application> {
    const app = await this.appRepository.findOne({
      where: { id },
      relations: ['applicant', 'reviewer', 'approver', 'documents', 'documents.uploader'],
    });

    if (!app) throw new NotFoundException('Application not found');

    if (actor.role === UserRole.APPLICANT && app.applicant_id !== actor.id) {
      throw new ForbiddenException('Access denied');
    }

    return app;
  }

  // SUBMIT (DRAFT → SUBMITTED or ADDITIONAL_INFO_REQUIRED → SUBMITTED)
  async submit(id: string, actor: User): Promise<Application> {
    return this.transitionWithLock(id, actor, async (app) => {
      this.stateMachine.validateTransition(app, ApplicationStatus.SUBMITTED, actor);

      const prevStatus = app.status;
      app.status = ApplicationStatus.SUBMITTED;

      // Increment submission version on resubmission
      if (prevStatus === ApplicationStatus.ADDITIONAL_INFO_REQUIRED) {
        app.submission_version += 1;
        app.additional_info_request = null;
      }

      return { app, action: 'APPLICATION_SUBMITTED', prevStatus };
    });
  }

  // START REVIEW (SUBMITTED → UNDER_REVIEW)
  async startReview(id: string, actor: User): Promise<Application> {
    return this.transitionWithLock(id, actor, async (app) => {
      this.stateMachine.validateTransition(app, ApplicationStatus.UNDER_REVIEW, actor);

      const prevStatus = app.status;
      app.status = ApplicationStatus.UNDER_REVIEW;
      app.reviewer_id = actor.id;

      return { app, action: 'REVIEW_STARTED', prevStatus };
    });
  }

  // REQUEST ADDITIONAL INFO (UNDER_REVIEW → ADDITIONAL_INFO_REQUIRED)
  async requestAdditionalInfo(
    id: string,
    dto: RequestAdditionalInfoDto,
    actor: User,
  ): Promise<Application> {
    return this.transitionWithLock(id, actor, async (app) => {
      this.stateMachine.validateTransition(
        app,
        ApplicationStatus.ADDITIONAL_INFO_REQUIRED,
        actor,
      );

      // Reviewer can only handle their own assigned application
      if (app.reviewer_id && app.reviewer_id !== actor.id) {
        throw new ForbiddenException('This application is assigned to a different reviewer');
      }

      const prevStatus = app.status;
      app.status = ApplicationStatus.ADDITIONAL_INFO_REQUIRED;
      app.additional_info_request = dto.additional_info_request;
      if (dto.reviewer_notes) app.reviewer_notes = dto.reviewer_notes;

      return {
        app,
        action: 'ADDITIONAL_INFO_REQUESTED',
        prevStatus,
        metadata: { additional_info_request: dto.additional_info_request },
      };
    });
  }

  // COMPLETE REVIEW (UNDER_REVIEW → REVIEWED)
  async completeReview(id: string, dto: CompleteReviewDto, actor: User): Promise<Application> {
    return this.transitionWithLock(id, actor, async (app) => {
      this.stateMachine.validateTransition(app, ApplicationStatus.REVIEWED, actor);

      if (app.reviewer_id && app.reviewer_id !== actor.id) {
        throw new ForbiddenException('This application is assigned to a different reviewer');
      }

      const prevStatus = app.status;
      app.status = ApplicationStatus.REVIEWED;
      if (dto.reviewer_notes) app.reviewer_notes = dto.reviewer_notes;

      return { app, action: 'REVIEW_COMPLETED', prevStatus };
    });
  }

  // APPROVE (REVIEWED → APPROVED)
  async approve(id: string, dto: MakeDecisionDto, actor: User): Promise<Application> {
    return this.transitionWithLock(id, actor, async (app) => {
      this.stateMachine.validateTransition(app, ApplicationStatus.APPROVED, actor);

      const prevStatus = app.status;
      app.status = ApplicationStatus.APPROVED;
      app.approver_id = actor.id;
      if (dto.decision_notes) app.decision_notes = dto.decision_notes;

      return {
        app,
        action: 'APPLICATION_APPROVED',
        prevStatus,
        metadata: { decision_notes: dto.decision_notes },
      };
    });
  }

  // REJECT (REVIEWED → REJECTED)
  async reject(id: string, dto: MakeDecisionDto, actor: User): Promise<Application> {
    return this.transitionWithLock(id, actor, async (app) => {
      this.stateMachine.validateTransition(app, ApplicationStatus.REJECTED, actor);

      const prevStatus = app.status;
      app.status = ApplicationStatus.REJECTED;
      app.approver_id = actor.id;
      if (dto.decision_notes) app.decision_notes = dto.decision_notes;

      return {
        app,
        action: 'APPLICATION_REJECTED',
        prevStatus,
        metadata: { decision_notes: dto.decision_notes },
      };
    });
  }

  /**
   * Wraps state transitions in a serializable transaction with optimistic locking.
   * If two users attempt to transition the same application simultaneously,
   * one will succeed and the other will receive a 409 Conflict.
   */
  private async transitionWithLock(
    id: string,
    actor: User,
    mutate: (app: Application) => Promise<{
      app: Application;
      action: string;
      prevStatus: ApplicationStatus;
      metadata?: Record<string, unknown>;
    }>,
  ): Promise<Application> {
    return this.dataSource.transaction('SERIALIZABLE', async (manager) => {
      // Pessimistic write lock — only one transaction can hold this at a time
      const app = await manager
        .createQueryBuilder(Application, 'app')
        .setLock('pessimistic_write')
        .where('app.id = :id', { id })
        .getOne();

      if (!app) throw new NotFoundException('Application not found');

      if (actor.role === UserRole.APPLICANT && app.applicant_id !== actor.id) {
        throw new ForbiddenException('Access denied');
      }

      const { app: updatedApp, action, prevStatus, metadata } = await mutate(app);

      try {
        const saved = await manager.save(Application, updatedApp);

        await this.auditService.log({
          application_id: id,
          actor_id: actor.id,
          action,
          previous_state: prevStatus,
          new_state: updatedApp.status,
          metadata,
        });

        return saved;
      } catch (err: unknown) {
        // TypeORM OptimisticLockVersionMismatchError or serialization failures
        if (
          err instanceof Error &&
          (err.name === 'OptimisticLockVersionMismatchError' ||
            (err as NodeJS.ErrnoException).code === '40001')
        ) {
          throw new ConflictException(
            'Another user modified this application simultaneously. Please refresh and try again.',
          );
        }
        throw err;
      }
    });
  }
}
