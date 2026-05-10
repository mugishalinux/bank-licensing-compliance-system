import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import { ApplicationsService } from '../applications.service';
import { StateMachineService } from '../state-machine.service';
import { Application } from '../entities/application.entity';
import { ApplicationDocument } from '../../documents/entities/document.entity';
import { User } from '../../users/entities/user.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';
import { AuditService } from '../../audit/audit.service';
import { ApplicationStatus } from '../../common/enums/application-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

/**
 * Concurrent access test — requires a live PostgreSQL connection.
 * Run with: DB_NAME=bank_licensing_test npm test -- concurrent
 *
 * This test fires two simultaneous approve/reject operations against the same
 * application and verifies that exactly one succeeds and the other either
 * raises a ConflictException or one wins cleanly.
 */
describe('Concurrent access — optimistic locking', () => {
  let module: TestingModule;
  let service: ApplicationsService;
  let appRepo: Repository<Application>;
  let userRepo: Repository<User>;
  let dataSource: DataSource;

  const DB_CONFIG = {
    type: 'postgres' as const,
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'bank_licensing_test',
    synchronize: true,
    entities: [User, Application, ApplicationDocument, AuditLog],
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        TypeOrmModule.forRoot(DB_CONFIG),
        TypeOrmModule.forFeature([User, Application, ApplicationDocument, AuditLog]),
      ],
      providers: [ApplicationsService, StateMachineService, AuditService],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
    appRepo = module.get<Repository<Application>>(getRepositoryToken(Application));
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    dataSource = module.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    // Clean slate for each test
    await dataSource.query('DELETE FROM audit_logs');
    await dataSource.query('DELETE FROM application_documents');
    await dataSource.query('DELETE FROM applications');
    await dataSource.query('DELETE FROM users');
  });

  async function createUsers() {
    const hash = await bcrypt.hash('Password123!', 10);
    const reviewer = await userRepo.save(
      userRepo.create({
        email: 'reviewer@test.rw',
        password_hash: hash,
        role: UserRole.REVIEWER,
        full_name: 'Test Reviewer',
      }),
    );
    const approver1 = await userRepo.save(
      userRepo.create({
        email: 'approver1@test.rw',
        password_hash: hash,
        role: UserRole.APPROVER,
        full_name: 'Approver One',
      }),
    );
    const approver2 = await userRepo.save(
      userRepo.create({
        email: 'approver2@test.rw',
        password_hash: hash,
        role: UserRole.APPROVER,
        full_name: 'Approver Two',
      }),
    );
    const applicant = await userRepo.save(
      userRepo.create({
        email: 'applicant@test.rw',
        password_hash: hash,
        role: UserRole.APPLICANT,
        full_name: 'Test Applicant',
      }),
    );
    return { reviewer, approver1, approver2, applicant };
  }

  it('only one of two concurrent approvals succeeds on the same application', async () => {
    const { reviewer, approver1, approver2, applicant } = await createUsers();

    // Create a REVIEWED application
    const app = await appRepo.save(
      appRepo.create({
        institution_name: 'Concurrent Bank',
        institution_type: 'Commercial Bank',
        status: ApplicationStatus.REVIEWED,
        applicant_id: applicant.id,
        reviewer_id: reviewer.id,
      }),
    );

    // Fire two concurrent approve requests
    const results = await Promise.allSettled([
      service.approve(app.id, { decision_notes: 'Approved by 1' }, approver1),
      service.approve(app.id, { decision_notes: 'Approved by 2' }, approver2),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly one should succeed
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    // Final state must be APPROVED exactly once
    const finalApp = await appRepo.findOne({ where: { id: app.id } });
    expect(finalApp!.status).toBe(ApplicationStatus.APPROVED);
  });

  it('concurrent approve + reject: exactly one wins', async () => {
    const { reviewer, approver1, approver2, applicant } = await createUsers();

    const app = await appRepo.save(
      appRepo.create({
        institution_name: 'Race Condition Bank',
        institution_type: 'MFI',
        status: ApplicationStatus.REVIEWED,
        applicant_id: applicant.id,
        reviewer_id: reviewer.id,
      }),
    );

    const results = await Promise.allSettled([
      service.approve(app.id, {}, approver1),
      service.reject(app.id, { decision_notes: 'Not sufficient' }, approver2),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    expect(fulfilled.length).toBe(1);

    const finalApp = await appRepo.findOne({ where: { id: app.id } });
    expect([ApplicationStatus.APPROVED, ApplicationStatus.REJECTED]).toContain(
      finalApp!.status,
    );
  });
});
