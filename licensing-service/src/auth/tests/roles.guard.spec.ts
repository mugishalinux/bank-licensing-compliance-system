import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from '../guards/roles.guard';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../../users/entities/user.entity';

function makeUser(role: UserRole): User {
  const u = new User();
  u.id = 'user-1';
  u.role = role;
  return u;
}

function makeContext(user: User | null, requiredRoles: UserRole[]): ExecutionContext {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
  };

  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, Reflector],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('allows access when no roles required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    const ctx = makeContext(makeUser(UserRole.APPLICANT), []);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows ADMIN to access ADMIN-only route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const ctx = makeContext(makeUser(UserRole.ADMIN), [UserRole.ADMIN]);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('denies APPLICANT from ADMIN-only route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const ctx = makeContext(makeUser(UserRole.APPLICANT), [UserRole.ADMIN]);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('denies REVIEWER from APPROVER-only route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.APPROVER]);
    const ctx = makeContext(makeUser(UserRole.REVIEWER), [UserRole.APPROVER]);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('allows access when user has one of multiple allowed roles', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.REVIEWER, UserRole.APPROVER]);
    const ctx = makeContext(makeUser(UserRole.REVIEWER), [
      UserRole.REVIEWER,
      UserRole.APPROVER,
    ]);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws ForbiddenException (not 404/500) when user is null', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const ctx = makeContext(null, [UserRole.ADMIN]);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('APPLICANT cannot access REVIEWER route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.REVIEWER]);
    const ctx = makeContext(makeUser(UserRole.APPLICANT), [UserRole.REVIEWER]);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('APPROVER cannot access REVIEWER route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.REVIEWER]);
    const ctx = makeContext(makeUser(UserRole.APPROVER), [UserRole.REVIEWER]);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
