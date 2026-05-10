import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { Application } from '../../applications/entities/application.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';
import { Department } from '../../departments/entities/department.entity';
import { InstitutionType } from '../../institution-types/entities/institution-type.entity';
import { LicenseType } from '../../license-types/entities/license-type.entity';
import { LicenseRequirement } from '../../license-types/entities/license-requirement.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { ApplicantType } from '../../common/enums/applicant-type.enum';
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
    @InjectRepository(LicenseType) private ltRepo: Repository<LicenseType>,
    @InjectRepository(LicenseRequirement) private lrRepo: Repository<LicenseRequirement>,
  ) {}

  async seed(): Promise<void> {
    await this.seedDepartments();
    await this.seedInstitutionTypes();
    await this.seedLicenseTypes();
    await this.seedUsersAndApps();
  }

  private async seedLicenseTypes() {
    if ((await this.ltRepo.count()) > 0) return;
    const bank = await this.deptRepo.findOne({ where: { code: 'BANK' } });
    const ins = await this.deptRepo.findOne({ where: { code: 'INS' } });
    if (!bank || !ins) return;

    const commercial = await this.ltRepo.save(
      this.ltRepo.create({
        name: 'Commercial Banking License',
        description: 'License to operate as a commercial bank.',
        department_id: bank.id,
        processing_time_days: 90,
        is_paid: true,
        fee_amount: '5000000.00',
      }),
    );
    const mfi = await this.ltRepo.save(
      this.ltRepo.create({
        name: 'Microfinance License',
        description: 'License to operate a microfinance institution.',
        department_id: bank.id,
        processing_time_days: 60,
        is_paid: true,
        fee_amount: '500000.00',
      }),
    );
    const insurance = await this.ltRepo.save(
      this.ltRepo.create({
        name: 'Insurance Underwriting License',
        description: 'License to underwrite insurance policies.',
        department_id: ins.id,
        processing_time_days: 120,
        is_paid: true,
        fee_amount: '2000000.00',
      }),
    );

    await this.lrRepo.save([
      this.lrRepo.create({
        license_type_id: commercial.id,
        name: 'Certificate of incorporation',
        is_mandatory: true,
        requires_attachment: true,
      }),
      this.lrRepo.create({
        license_type_id: commercial.id,
        name: 'Five-year business plan',
        is_mandatory: true,
        requires_attachment: true,
      }),
      this.lrRepo.create({
        license_type_id: commercial.id,
        name: 'Audited financial statements (last 3 years)',
        is_mandatory: true,
        requires_attachment: true,
      }),
      this.lrRepo.create({
        license_type_id: commercial.id,
        name: 'Proof of paid-up capital',
        is_mandatory: true,
        requires_attachment: true,
      }),
      this.lrRepo.create({
        license_type_id: mfi.id,
        name: 'Certificate of incorporation',
        is_mandatory: true,
        requires_attachment: true,
      }),
      this.lrRepo.create({
        license_type_id: mfi.id,
        name: 'Three-year business plan',
        is_mandatory: true,
        requires_attachment: true,
      }),
      this.lrRepo.create({
        license_type_id: insurance.id,
        name: 'Certificate of incorporation',
        is_mandatory: true,
        requires_attachment: true,
      }),
      this.lrRepo.create({
        license_type_id: insurance.id,
        name: 'Reinsurance arrangements',
        is_mandatory: true,
        requires_attachment: true,
      }),
    ]);

    this.log.log('Seeded license types and requirements');
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
    const bank = await this.deptRepo.findOne({ where: { code: 'BANK' } });
    const ins = await this.deptRepo.findOne({ where: { code: 'INS' } });

    const users = await this.userRepo.save([
      this.userRepo.create({
        email: 'admin@bnr.rw',
        password_hash: await hash('Admin@1234'),
        role: UserRole.ADMIN,
        full_name: 'System Administrator',
      }),
      this.userRepo.create({
        email: 'reviewer.banking@bnr.rw',
        password_hash: await hash('Reviewer@1234'),
        role: UserRole.REVIEWER,
        full_name: 'Alice Uwimana',
        department_id: bank?.id ?? null,
      }),
      this.userRepo.create({
        email: 'approver.banking@bnr.rw',
        password_hash: await hash('Approver@1234'),
        role: UserRole.APPROVER,
        full_name: 'Bob Nkurunziza',
        department_id: bank?.id ?? null,
      }),
      this.userRepo.create({
        email: 'reviewer.insurance@bnr.rw',
        password_hash: await hash('Reviewer@1234'),
        role: UserRole.REVIEWER,
        full_name: 'Claire Mutoni',
        department_id: ins?.id ?? null,
      }),
      this.userRepo.create({
        email: 'approver.insurance@bnr.rw',
        password_hash: await hash('Approver@1234'),
        role: UserRole.APPROVER,
        full_name: 'David Habimana',
        department_id: ins?.id ?? null,
      }),
      this.userRepo.create({
        email: 'bank1@example.rw',
        password_hash: await hash('Bank1@1234'),
        role: UserRole.APPLICANT,
        full_name: 'Eric Niyonsaba',
        applicant_type: ApplicantType.ORGANIZATION,
        institution_name: 'Kigali Commercial Bank Ltd',
      }),
      this.userRepo.create({
        email: 'jean@example.rw',
        password_hash: await hash('Jean@1234'),
        role: UserRole.APPLICANT,
        full_name: 'Jean Mukama',
        applicant_type: ApplicantType.INDIVIDUAL,
      }),
    ]);

    const reviewer = users.find((u) => u.email === 'reviewer.banking@bnr.rw')!;
    const applicant1 = users.find((u) => u.email === 'bank1@example.rw')!;

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

    this.log.log('Seeded users and one sample application');
  }
}
