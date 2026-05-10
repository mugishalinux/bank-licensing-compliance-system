import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import {
  ApplicationStatus,
  VALID_TRANSITIONS,
  TERMINAL_STATES,
} from '../common/enums/application-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { Application } from './entities/application.entity';
import { User } from '../users/entities/user.entity';

/**
 * State machine for the bank license application workflow.
 *
 * Transition rules by actor:
 *   APPLICANT  : DRAFT → SUBMITTED, ADDITIONAL_INFO_REQUIRED → SUBMITTED
 *   REVIEWER   : SUBMITTED → UNDER_REVIEW, UNDER_REVIEW → ADDITIONAL_INFO_REQUIRED | REVIEWED
 *   APPROVER   : REVIEWED → APPROVED | REJECTED (must NOT be the reviewer)
 *   ADMIN      : read-only on applications
 */

const ROLE_ALLOWED_TRANSITIONS: Record<
  UserRole,
  Partial<Record<ApplicationStatus, ApplicationStatus[]>>
> = {
  [UserRole.APPLICANT]: {
    [ApplicationStatus.DRAFT]: [ApplicationStatus.SUBMITTED],
    [ApplicationStatus.ADDITIONAL_INFO_REQUIRED]: [ApplicationStatus.SUBMITTED],
  },
  [UserRole.REVIEWER]: {
    [ApplicationStatus.SUBMITTED]: [ApplicationStatus.UNDER_REVIEW],
    [ApplicationStatus.UNDER_REVIEW]: [
      ApplicationStatus.ADDITIONAL_INFO_REQUIRED,
      ApplicationStatus.REVIEWED,
    ],
  },
  [UserRole.APPROVER]: {
    [ApplicationStatus.REVIEWED]: [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED],
  },
  [UserRole.ADMIN]: {},
};

@Injectable()
export class StateMachineService {
  /**
   * Validates and authorises a state transition.
   * Throws descriptive exceptions on any violation — callers do not need
   * to add extra checks, they can trust that reaching the return value
   * means the transition is legal.
   */
  validateTransition(
    application: Application,
    targetStatus: ApplicationStatus,
    actor: User,
  ): void {
    // Guard: terminal states can never transition
    if (TERMINAL_STATES.includes(application.status)) {
      throw new BadRequestException(
        `Application is in a terminal state (${application.status}) and cannot be modified`,
      );
    }

    // Guard: transition must be globally valid
    const globallyAllowed = VALID_TRANSITIONS[application.status];
    if (!globallyAllowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Invalid transition: ${application.status} → ${targetStatus}`,
      );
    }

    // Guard: role must be permitted to trigger this transition
    const roleAllowed = ROLE_ALLOWED_TRANSITIONS[actor.role]?.[application.status] ?? [];
    if (!roleAllowed.includes(targetStatus)) {
      throw new ForbiddenException(
        `Your role (${actor.role}) is not permitted to move an application from ${application.status} to ${targetStatus}`,
      );
    }

    // Hard rule: the person who reviewed cannot make the final approval decision
    if (
      targetStatus === ApplicationStatus.APPROVED ||
      targetStatus === ApplicationStatus.REJECTED
    ) {
      if (application.reviewer_id && application.reviewer_id === actor.id) {
        throw new ForbiddenException(
          'The reviewer of an application cannot also be its approver. ' +
            'This separation of duties is enforced by the system.',
        );
      }
    }

    // Guard: APPLICANT can only act on their own applications
    if (actor.role === UserRole.APPLICANT && application.applicant_id !== actor.id) {
      throw new ForbiddenException('You can only act on your own applications');
    }
  }

  isTransitionValid(from: ApplicationStatus, to: ApplicationStatus): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
  }

  getAvailableTransitions(status: ApplicationStatus, role: UserRole): ApplicationStatus[] {
    return ROLE_ALLOWED_TRANSITIONS[role]?.[status] ?? [];
  }
}
