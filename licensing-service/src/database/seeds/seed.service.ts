import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { Application } from '../../applications/entities/application.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { ApplicationStatus } from '../../common/enums/application-status.enum';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Application)
    private appRepo: Repository<Application>,
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  async seed(): Promise<void> {
    const existingAdmin = await this.userRepo.findOne({
      where: { email: 'admin@bnr.rw' },
    });

    if (existingAdmin) {
      this.logger.log('Seed data already exists — skipping');
      return;
    }

    this.logger.log('Seeding database...');

    const hash = (pw: string) => bcrypt.hash(pw, 12);

    // --- Users ---
    const [admin, reviewer, approver, applicant1, applicant2] = await this.userRepo.save([
      this.userRepo.create({
        email: 'admin@bnr.rw',
        password_hash: await hash('Admin@1234'),
        role: UserRole.ADMIN,
        full_name: 'System Administrator',
      }),
      this.userRepo.create({
        email: 'reviewer@bnr.rw',
        password_hash: await hash('Reviewer@1234'),
        role: UserRole.REVIEWER,
        full_name: 'Alice Uwimana',
      }),
      this.userRepo.create({
        email: 'approver@bnr.rw',
        password_hash: await hash('Approver@1234'),
        role: UserRole.APPROVER,
        full_name: 'Bob Nkurunziza',
      }),
      this.userRepo.create({
        email: 'bank1@example.rw',
        password_hash: await hash('Bank1@1234'),
        role: UserRole.APPLICANT,
        full_name: 'Kigali Commercial Bank',
      }),
      this.userRepo.create({
        email: 'bank2@example.rw',
        password_hash: await hash('Bank2@1234'),
        role: UserRole.APPLICANT,
        full_name: 'Rwanda Savings MFI',
      }),
    ]);

    this.logger.log('Users created');

    // --- Application 1: In REVIEWED state (ready for approval decision) ---
    const app1 = await this.appRepo.save(
      this.appRepo.create({
        institution_name: 'Kigali Commercial Bank Ltd',
        institution_type: 'Commercial Bank',
        description: 'Full-service commercial bank targeting SMEs and retail customers.',
        registered_address: 'KG 7 Ave, Kigali, Rwanda',
        registration_number: 'RCA/COM/2024/001',
        status: ApplicationStatus.REVIEWED,
        applicant_id: applicant1.id,
        reviewer_id: reviewer.id,
        reviewer_notes: 'All documents are in order. Financial projections appear realistic.',
      }),
    );

    // --- Application 2: In DRAFT state ---
    const app2 = await this.appRepo.save(
      this.appRepo.create({
        institution_name: 'Rwanda Savings MFI Ltd',
        institution_type: 'Microfinance Institution',
        description: 'Microfinance institution focused on rural agricultural financing.',
        registered_address: 'KN 3 Rd, Musanze, Rwanda',
        registration_number: 'RCA/MFI/2024/042',
        status: ApplicationStatus.DRAFT,
        applicant_id: applicant2.id,
      }),
    );

    // --- Audit trail for app1 ---
    await this.auditRepo.save([
      this.auditRepo.create({
        application_id: app1.id,
        actor_id: applicant1.id,
        action: 'APPLICATION_CREATED',
        previous_state: null,
        new_state: ApplicationStatus.DRAFT,
      }),
      this.auditRepo.create({
        application_id: app1.id,
        actor_id: applicant1.id,
        action: 'APPLICATION_SUBMITTED',
        previous_state: ApplicationStatus.DRAFT,
        new_state: ApplicationStatus.SUBMITTED,
      }),
      this.auditRepo.create({
        application_id: app1.id,
        actor_id: reviewer.id,
        action: 'REVIEW_STARTED',
        previous_state: ApplicationStatus.SUBMITTED,
        new_state: ApplicationStatus.UNDER_REVIEW,
      }),
      this.auditRepo.create({
        application_id: app1.id,
        actor_id: reviewer.id,
        action: 'REVIEW_COMPLETED',
        previous_state: ApplicationStatus.UNDER_REVIEW,
        new_state: ApplicationStatus.REVIEWED,
        metadata: { reviewer_notes: 'All documents are in order.' },
      }),
    ]);

    // --- Audit trail for app2 ---
    await this.auditRepo.save([
      this.auditRepo.create({
        application_id: app2.id,
        actor_id: applicant2.id,
        action: 'APPLICATION_CREATED',
        previous_state: null,
        new_state: ApplicationStatus.DRAFT,
      }),
    ]);

    this.logger.log('Seed complete');
    this.logger.log('='.repeat(50));
    this.logger.log('Seed credentials:');
    this.logger.log('  Admin:    admin@bnr.rw     / Admin@1234');
    this.logger.log('  Reviewer: reviewer@bnr.rw  / Reviewer@1234');
    this.logger.log('  Approver: approver@bnr.rw  / Approver@1234');
    this.logger.log('  Applicant 1: bank1@example.rw / Bank1@1234');
    this.logger.log('  Applicant 2: bank2@example.rw / Bank2@1234');
    this.logger.log('='.repeat(50));
  }
}
