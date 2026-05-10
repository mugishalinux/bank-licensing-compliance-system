import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { Application } from '../../applications/entities/application.entity';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class DepartmentScopeGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request & { user?: User; params: { id?: string } }>();
    const user = req.user;
    if (!user) throw new ForbiddenException('Access denied');
    if (user.role === UserRole.ADMIN || user.role === UserRole.APPLICANT) return true;

    const id = req.params.id;
    if (!id) return true;

    const app = await Application.findOne({ where: { id } });
    if (!app) return true;
    if (!user.department_id || app.department_id !== user.department_id) {
      throw new ForbiddenException('This application belongs to a different department');
    }
    return true;
  }
}
