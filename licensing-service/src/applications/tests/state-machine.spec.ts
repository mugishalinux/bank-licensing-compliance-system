import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { StateMachineService } from '../state-machine.service';
import { ApplicationStatus } from '../../common/enums/application-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { Application } from '../entities/application.entity';
import { User } from '../../users/entities/user.entity';

function makeUser(role: UserRole, id = 'user-1'): User {
  const u = new User();
  u.id = id;
  u.role = role;
  u.email = `${role.toLowerCase()}@test.rw`;
  u.full_name = `Test ${role}`;
  u.is_active = true;
  return u;
}

function makeApp(
  status: ApplicationStatus,
  applicantId = 'applicant-1',
  reviewerId: string | null = null,
): Application {
  const app = new Application();
  app.id = 'app-1';
  app.status = status;
  app.applicant_id = applicantId;
  app.reviewer_id = reviewerId;
  app.submission_version = 1;
  app.version = 1;
  return app;
}

describe('StateMachineService', () => {
  let service: StateMachineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StateMachineService],
    }).compile();

    service = module.get<StateMachineService>(StateMachineService);
  });

  // ─── Valid transitions ───────────────────────────────────────────────────────

  describe('valid transitions', () => {
    it('APPLICANT can submit a DRAFT application', () => {
      const applicant = makeUser(UserRole.APPLICANT, 'applicant-1');
      const app = makeApp(ApplicationStatus.DRAFT, 'applicant-1');

      expect(() =>
        service.validateTransition(app, ApplicationStatus.SUBMITTED, applicant),
      ).not.toThrow();
    });

    it('APPLICANT can resubmit after ADDITIONAL_INFO_REQUIRED', () => {
      const applicant = makeUser(UserRole.APPLICANT, 'applicant-1');
      const app = makeApp(ApplicationStatus.ADDITIONAL_INFO_REQUIRED, 'applicant-1');

      expect(() =>
        service.validateTransition(app, ApplicationStatus.SUBMITTED, applicant),
      ).not.toThrow();
    });

    it('REVIEWER can start review on a SUBMITTED application', () => {
      const reviewer = makeUser(UserRole.REVIEWER, 'reviewer-1');
      const app = makeApp(ApplicationStatus.SUBMITTED);

      expect(() =>
        service.validateTransition(app, ApplicationStatus.UNDER_REVIEW, reviewer),
      ).not.toThrow();
    });

    it('REVIEWER can request additional info on UNDER_REVIEW application', () => {
      const reviewer = makeUser(UserRole.REVIEWER, 'reviewer-1');
      const app = makeApp(ApplicationStatus.UNDER_REVIEW, 'applicant-1', 'reviewer-1');

      expect(() =>
        service.validateTransition(
          app,
          ApplicationStatus.ADDITIONAL_INFO_REQUIRED,
          reviewer,
        ),
      ).not.toThrow();
    });

    it('REVIEWER can mark application as REVIEWED', () => {
      const reviewer = makeUser(UserRole.REVIEWER, 'reviewer-1');
      const app = makeApp(ApplicationStatus.UNDER_REVIEW, 'applicant-1', 'reviewer-1');

      expect(() =>
        service.validateTransition(app, ApplicationStatus.REVIEWED, reviewer),
      ).not.toThrow();
    });

    it('APPROVER can APPROVE a REVIEWED application (different from reviewer)', () => {
      const approver = makeUser(UserRole.APPROVER, 'approver-1');
      const app = makeApp(ApplicationStatus.REVIEWED, 'applicant-1', 'reviewer-1');

      expect(() =>
        service.validateTransition(app, ApplicationStatus.APPROVED, approver),
      ).not.toThrow();
    });

    it('APPROVER can REJECT a REVIEWED application (different from reviewer)', () => {
      const approver = makeUser(UserRole.APPROVER, 'approver-1');
      const app = makeApp(ApplicationStatus.REVIEWED, 'applicant-1', 'reviewer-1');

      expect(() =>
        service.validateTransition(app, ApplicationStatus.REJECTED, approver),
      ).not.toThrow();
    });
  });

  // ─── Invalid transitions ─────────────────────────────────────────────────────

  describe('invalid transitions', () => {
    it('rejects DRAFT → UNDER_REVIEW (must go through SUBMITTED)', () => {
      const reviewer = makeUser(UserRole.REVIEWER);
      const app = makeApp(ApplicationStatus.DRAFT);

      expect(() =>
        service.validateTransition(app, ApplicationStatus.UNDER_REVIEW, reviewer),
      ).toThrow(BadRequestException);
    });

    it('rejects SUBMITTED → APPROVED (skipping review steps)', () => {
      const approver = makeUser(UserRole.APPROVER);
      const app = makeApp(ApplicationStatus.SUBMITTED);

      expect(() =>
        service.validateTransition(app, ApplicationStatus.APPROVED, approver),
      ).toThrow(BadRequestException);
    });

    it('rejects transition from terminal state APPROVED', () => {
      const admin = makeUser(UserRole.ADMIN);
      const app = makeApp(ApplicationStatus.APPROVED);

      expect(() =>
        service.validateTransition(app, ApplicationStatus.REVIEWED, admin),
      ).toThrow(BadRequestException);
    });

    it('rejects transition from terminal state REJECTED', () => {
      const admin = makeUser(UserRole.ADMIN);
      const app = makeApp(ApplicationStatus.REJECTED);

      expect(() =>
        service.validateTransition(app, ApplicationStatus.SUBMITTED, admin),
      ).toThrow(BadRequestException);
    });

    it('rejects REVIEWED → UNDER_REVIEW (backwards transition)', () => {
      const reviewer = makeUser(UserRole.REVIEWER);
      const app = makeApp(ApplicationStatus.REVIEWED);

      expect(() =>
        service.validateTransition(app, ApplicationStatus.UNDER_REVIEW, reviewer),
      ).toThrow(BadRequestException);
    });
  });

  // ─── Role-based enforcement ──────────────────────────────────────────────────

  describe('role-based enforcement', () => {
    it('APPLICANT cannot start a review', () => {
      const applicant = makeUser(UserRole.APPLICANT, 'applicant-1');
      const app = makeApp(ApplicationStatus.SUBMITTED, 'applicant-1');

      expect(() =>
        service.validateTransition(app, ApplicationStatus.UNDER_REVIEW, applicant),
      ).toThrow(ForbiddenException);
    });

    it('REVIEWER cannot approve an application', () => {
      const reviewer = makeUser(UserRole.REVIEWER, 'reviewer-1');
      const app = makeApp(ApplicationStatus.REVIEWED, 'applicant-1', 'different-reviewer');

      expect(() =>
        service.validateTransition(app, ApplicationStatus.APPROVED, reviewer),
      ).toThrow(ForbiddenException);
    });

    it('APPROVER cannot submit an application', () => {
      const approver = makeUser(UserRole.APPROVER);
      const app = makeApp(ApplicationStatus.DRAFT);

      expect(() =>
        service.validateTransition(app, ApplicationStatus.SUBMITTED, approver),
      ).toThrow(ForbiddenException);
    });

    it('ADMIN cannot transition any application', () => {
      const admin = makeUser(UserRole.ADMIN);
      const app = makeApp(ApplicationStatus.DRAFT);

      expect(() =>
        service.validateTransition(app, ApplicationStatus.SUBMITTED, admin),
      ).toThrow(ForbiddenException);
    });
  });

  // ─── HARD RULE: reviewer ≠ approver ─────────────────────────────────────────

  describe('reviewer/approver separation (non-negotiable)', () => {
    it('throws ForbiddenException if the reviewer tries to approve', () => {
      const reviewerApprover = makeUser(UserRole.APPROVER, 'user-who-reviewed');
      const app = makeApp(ApplicationStatus.REVIEWED, 'applicant-1', 'user-who-reviewed');

      expect(() =>
        service.validateTransition(app, ApplicationStatus.APPROVED, reviewerApprover),
      ).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException if the reviewer tries to reject', () => {
      const reviewerApprover = makeUser(UserRole.APPROVER, 'user-who-reviewed');
      const app = makeApp(ApplicationStatus.REVIEWED, 'applicant-1', 'user-who-reviewed');

      expect(() =>
        service.validateTransition(app, ApplicationStatus.REJECTED, reviewerApprover),
      ).toThrow(ForbiddenException);
    });

    it('allows approval by a DIFFERENT approver (happy path)', () => {
      const approver = makeUser(UserRole.APPROVER, 'approver-99');
      const app = makeApp(ApplicationStatus.REVIEWED, 'applicant-1', 'reviewer-55');

      expect(() =>
        service.validateTransition(app, ApplicationStatus.APPROVED, approver),
      ).not.toThrow();
    });
  });

  // ─── Applicant scope ─────────────────────────────────────────────────────────

  describe('applicant scope', () => {
    it("APPLICANT cannot act on another applicant's application", () => {
      const otherApplicant = makeUser(UserRole.APPLICANT, 'applicant-OTHER');
      const app = makeApp(ApplicationStatus.DRAFT, 'applicant-OWNER');

      expect(() =>
        service.validateTransition(app, ApplicationStatus.SUBMITTED, otherApplicant),
      ).toThrow(ForbiddenException);
    });
  });

  // ─── Helper methods ──────────────────────────────────────────────────────────

  describe('getAvailableTransitions', () => {
    it('returns correct transitions for APPLICANT in DRAFT', () => {
      const transitions = service.getAvailableTransitions(
        ApplicationStatus.DRAFT,
        UserRole.APPLICANT,
      );
      expect(transitions).toEqual([ApplicationStatus.SUBMITTED]);
    });

    it('returns empty array for ADMIN', () => {
      const transitions = service.getAvailableTransitions(
        ApplicationStatus.SUBMITTED,
        UserRole.ADMIN,
      );
      expect(transitions).toEqual([]);
    });

    it('returns empty array for terminal APPROVED state', () => {
      const transitions = service.getAvailableTransitions(
        ApplicationStatus.APPROVED,
        UserRole.APPROVER,
      );
      expect(transitions).toEqual([]);
    });
  });
});
