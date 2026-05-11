import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Application } from './entities/application.entity';
import { LicenseType } from '../license-types/entities/license-type.entity';
import { User } from '../users/entities/user.entity';
import { StateMachineService } from './state-machine.service';
import { CommentsService } from '../comments/comments.service';
import { CommentKind } from '../comments/entities/comment.entity';
import { AuditService } from '../audit/audit.service';
import { EventsHelper } from '../common/helpers/events.helper';
import { ReferenceIdHelper } from '../common/helpers/reference-id.helper';
import { FilterHelper } from '../common/helpers/filter.helper';
import { UserRole } from '../common/enums/user-role.enum';
import { ApplicationStatus } from '../common/enums/application-status.enum';
import {
  ApproveDto,
  CompleteReviewDto,
  CreateApplicationDto,
  ListApplicationsDto,
  RejectDto,
  RequestInfoDto,
} from './dto/application.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    private state: StateMachineService,
    private comments: CommentsService,
    private audit: AuditService,
    private events: EventsHelper,
    private refs: ReferenceIdHelper,
    private filter: FilterHelper,
    private ds: DataSource,
  ) {}

  async create(dto: CreateApplicationDto, actor: User) {
    if (actor.role !== UserRole.APPLICANT) {
      throw new ForbiddenException('Only applicants can create applications');
    }
    const lt = await LicenseType.findOne({
      where: { id: dto.license_type_id, is_active: true },
      relations: ['department'],
    });
    if (!lt) throw new BadRequestException('License type not found or inactive');

    const a = new Application();
    a.reference_id = await this.refs.next();
    a.applicant_id = actor.id;
    a.license_type_id = lt.id;
    a.department_id = lt.department_id;
    a.applicant_name_snapshot = actor.full_name;
    a.institution_name_snapshot = actor.institution_name ?? null;
    a.email_snapshot = actor.email;
    a.phone_snapshot = actor.phone ?? null;
    a.status = ApplicationStatus.DRAFT;
    await a.save();

    await this.audit.log({
      application_id: a.id,
      actor_id: actor.id,
      action: 'APPLICATION_CREATED',
      previous_state: null,
      new_state: ApplicationStatus.DRAFT,
    });
    return a;
  }

  list(q: ListApplicationsDto, actor: User) {
    const where: Record<string, unknown> = {};
    if (q.status) where.status = q.status;
    if (q.license_type_id) where.license_type_id = q.license_type_id;

    if (actor.role === UserRole.APPLICANT || q.mine) {
      where.applicant_id = actor.id;
    } else if (actor.role === UserRole.REVIEWER || actor.role === UserRole.APPROVER) {
      if (!actor.department_id) {
        return Promise.resolve({
          items: [],
          total: 0,
          page: 1,
          pageSize: 10,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        });
      }
      where.department_id = actor.department_id;
    }

    return this.filter.paginate(Application, {
      page: q.page,
      pageSize: q.pageSize,
      where: Object.keys(where).length ? where : undefined,
      relations: ['applicant', 'license_type', 'department', 'reviewer', 'approver'],
      search: {
        term: q.search,
        columns: ['reference_id', 'applicant_name_snapshot', 'institution_name_snapshot'],
      },
    });
  }

  async getOne(id: string, actor: User) {
    const a = await Application.findOne({
      where: { id },
      relations: [
        'applicant',
        'license_type',
        'license_type.requirements',
        'department',
        'reviewer',
        'approver',
        'documents',
        'documents.uploader',
        'comments',
        'comments.author',
      ],
    });
    if (!a) throw new NotFoundException('Application not found');
    this.assertVisible(a, actor);
    return a;
  }

  submit(id: string, actor: User) {
    return this.transition(id, actor, async (a) => {
      this.state.validateTransition(a, ApplicationStatus.SUBMITTED, actor);
      const wasInfoRequired = a.status === ApplicationStatus.ADDITIONAL_INFO_REQUIRED;
      a.status = ApplicationStatus.SUBMITTED;
      a.submitted_at = new Date();
      if (wasInfoRequired) a.submission_version += 1;
      return { action: wasInfoRequired ? 'APPLICATION_RESUBMITTED' : 'APPLICATION_SUBMITTED' };
    });
  }

  startReview(id: string, actor: User) {
    return this.transition(id, actor, async (a) => {
      this.state.validateTransition(a, ApplicationStatus.UNDER_REVIEW, actor);
      a.status = ApplicationStatus.UNDER_REVIEW;
      a.reviewer_id = actor.id;
      return { action: 'REVIEW_STARTED' };
    });
  }

  requestInfo(id: string, dto: RequestInfoDto, actor: User) {
    return this.transition(id, actor, async (a, m) => {
      this.state.validateTransition(a, ApplicationStatus.ADDITIONAL_INFO_REQUIRED, actor);
      this.assertAssignedReviewer(a, actor);
      a.status = ApplicationStatus.ADDITIONAL_INFO_REQUIRED;

      await this.comments.record(
        a.id,
        actor.id,
        CommentKind.INFO_REQUEST,
        dto.comment,
        dto.attachment_key && dto.attachment_name
          ? { key: dto.attachment_key, name: dto.attachment_name }
          : undefined,
        m,
      );

      await this.events.sendEmail({
        to: a.email_snapshot,
        name: a.applicant_name_snapshot,
        subject: `Additional information requested — ${a.reference_id}`,
        message: `A reviewer has requested additional information for your application ${a.reference_id}: ${dto.comment}`,
      });

      return { action: 'ADDITIONAL_INFO_REQUESTED' };
    });
  }

  completeReview(id: string, dto: CompleteReviewDto, actor: User) {
    return this.transition(id, actor, async (a, m) => {
      this.state.validateTransition(a, ApplicationStatus.REVIEWED, actor);
      this.assertAssignedReviewer(a, actor);
      a.status = ApplicationStatus.REVIEWED;
      await this.comments.record(a.id, actor.id, CommentKind.REVIEW_NOTE, dto.comment, undefined, m);
      return { action: 'REVIEW_COMPLETED' };
    });
  }

  approve(id: string, dto: ApproveDto, actor: User) {
    return this.transition(id, actor, async (a, m) => {
      this.state.validateTransition(a, ApplicationStatus.APPROVED, actor);
      a.status = ApplicationStatus.APPROVED;
      a.approver_id = actor.id;
      a.decided_at = new Date();
      await this.comments.record(a.id, actor.id, CommentKind.APPROVAL, dto.comment, undefined, m);
      await this.events.sendEmail({
        to: a.email_snapshot,
        name: a.applicant_name_snapshot,
        subject: `Application approved — ${a.reference_id}`,
        message: `Your application ${a.reference_id} has been approved. ${dto.comment}`,
      });
      return { action: 'APPLICATION_APPROVED' };
    });
  }

  reject(id: string, dto: RejectDto, actor: User) {
    return this.transition(id, actor, async (a, m) => {
      this.state.validateTransition(a, ApplicationStatus.REJECTED, actor);
      a.status = ApplicationStatus.REJECTED;
      a.approver_id = actor.id;
      a.decided_at = new Date();
      await this.comments.record(a.id, actor.id, CommentKind.REJECTION, dto.comment, undefined, m);
      await this.events.sendEmail({
        to: a.email_snapshot,
        name: a.applicant_name_snapshot,
        subject: `Application rejected — ${a.reference_id}`,
        message: `Your application ${a.reference_id} has been rejected. Reason: ${dto.comment}`,
      });
      return { action: 'APPLICATION_REJECTED' };
    });
  }

  private async transition(
    id: string,
    actor: User,
    mutate: (a: Application, m: EntityManager) => Promise<{ action: string }>,
  ) {
    return this.ds.transaction('SERIALIZABLE', async (m) => {
      const a = await m
        .createQueryBuilder(Application, 'a')
        .setLock('pessimistic_write')
        .where('a.id = :id', { id })
        .getOne();
      if (!a) throw new NotFoundException('Application not found');

      this.assertVisible(a, actor);

      const prev = a.status;
      const { action } = await mutate(a, m);

      try {
        await m.save(Application, a);
      } catch (e) {
        if (
          e instanceof Error &&
          (e.name === 'OptimisticLockVersionMismatchError' ||
            (e as NodeJS.ErrnoException).code === '40001')
        ) {
          throw new ConflictException('Another user modified this application. Please retry.');
        }
        throw e;
      }

      await this.audit.log({
        application_id: a.id,
        actor_id: actor.id,
        action,
        previous_state: prev,
        new_state: a.status,
      });
      return a;
    });
  }

  private assertVisible(a: Application, actor: User) {
    if (actor.role === UserRole.APPLICANT && a.applicant_id !== actor.id) {
      throw new ForbiddenException('Access denied');
    }
    if (
      (actor.role === UserRole.REVIEWER || actor.role === UserRole.APPROVER) &&
      actor.department_id !== a.department_id
    ) {
      throw new ForbiddenException('This application belongs to a different department');
    }
  }

  private assertAssignedReviewer(a: Application, actor: User) {
    if (a.reviewer_id && a.reviewer_id !== actor.id) {
      throw new ForbiddenException('This application is assigned to a different reviewer');
    }
  }
}
