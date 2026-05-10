import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { Application } from '../../applications/entities/application.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';
import { Department } from '../../departments/entities/department.entity';
import { InstitutionType } from '../../institution-types/entities/institution-type.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { ApplicationStatus } from '../../common/enums/application-status.enum';

const DEFAULT_DEPARTMENTS = [
  { code: 'BANK', name: 'Banking Supervision', description: 'Oversees commercial banks and microfinance institutions.' },
  { code: 'INS', name: 'Insurance Supervision', description: 'Oversees insurance companies and brokers.' },
  { code: 'PSP', name: 'Payment Systems', description: 'Licenses payment service providers and forex bureaus.' },
  { code: 'CAP', name: 'Capital Markets', description: 'Oversees capital markets participants.' },
];

const DEFAULT_INSTITUTION_TYPES = [
  { name: 'Commercial Bank' },
  { name: 'Microfinance Institution' },
  { name: 'SACCO' },
  { name: 'Forex Bureau' },
  { name: 'Insurance Company' },
  { name: 'Insurance Broker' },
  { name: 'Payment Service Provider' },
];

@Injectable()
export class SeedService {
  private readonly log = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Application) private appRepo: Repository<Application>,
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
    @InjectRepository(Department) private deptRepo: Repository<Department>,
    @InjectRepository(InstitutionType) private instRepo: Repository<InstitutionType>,
  ) {}

  async seed(): Promise<void> {
    await this.seedDepartments();
    await this.seedInstitutionTypes();
    await this.seedUsersAndApps();
  }

  private async seedDepartments() {
    const count = await this.deptRepo.count();
    if (count > 0) return;
    await this.deptRepo.save(DEFAULT_DEPARTMENTS.map((d) => this.deptRepo.create(d)));
    this.log.log(`Seeded ${DEFAULT_DEPARTMENTS.length} departments`);
  }

  private async seedInstitutionTypes() {
    const count = await this.instRepo.count();
    if (count > 0) return;
    await this.instRepo.save(DEFAULT_INSTITUTION_TYPES.map((t) => this.instRepo.create(t)));
    this.log.log(`Seeded ${DEFAULT_INSTITUTION_TYPES.length} institution types`);
  }

  private async seedUsersAndApps() {
    const existingAdmin = await this.userRepo.findOne({ where: { email: 'admin@bnr.rw' } });
    if (existingAdmin) return;

    const hash = (pw: string) => bcrypt.hash(pw, 12);

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
      this.auditRepo.create({
        application_id: app2.id,
        actor_id: applicant2.id,
        action: 'APPLICATION_CREATED',
        previous_state: null,
        new_state: ApplicationStatus.DRAFT,
      }),
    ]);

    this.log.log('Users + applications seeded');
  }
}
