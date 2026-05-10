import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Comment, CommentKind } from './entities/comment.entity';
import { Application } from '../applications/entities/application.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { AddCommentDto } from './dto/comment.dto';

@Injectable()
export class CommentsService {
  async listForApplication(applicationId: string, actor: User) {
    const app = await this.assertVisible(applicationId, actor);
    return Comment.find({
      where: { application_id: app.id },
      order: { created_at: 'ASC' },
      relations: ['author'],
    });
  }

  async add(applicationId: string, dto: AddCommentDto, actor: User) {
    const app = await this.assertVisible(applicationId, actor);
    const c = new Comment();
    c.application_id = app.id;
    c.author_id = actor.id;
    c.kind = actor.role === UserRole.APPLICANT ? CommentKind.APPLICANT_REPLY : CommentKind.REVIEW_NOTE;
    c.body = dto.body;
    c.attachment_key = dto.attachment_key ?? null;
    c.attachment_name = dto.attachment_name ?? null;
    return c.save();
  }

  async record(
    applicationId: string,
    authorId: string,
    kind: CommentKind,
    body: string,
    attachment?: { key: string; name: string },
  ) {
    const c = new Comment();
    c.application_id = applicationId;
    c.author_id = authorId;
    c.kind = kind;
    c.body = body;
    c.attachment_key = attachment?.key ?? null;
    c.attachment_name = attachment?.name ?? null;
    return c.save();
  }

  private async assertVisible(applicationId: string, actor: User) {
    const app = await Application.findOne({ where: { id: applicationId } });
    if (!app) throw new NotFoundException('Application not found');

    if (actor.role === UserRole.APPLICANT && app.applicant_id !== actor.id) {
      throw new ForbiddenException('Access denied');
    }
    if (
      (actor.role === UserRole.REVIEWER || actor.role === UserRole.APPROVER) &&
      actor.department_id !== app.department_id
    ) {
      throw new ForbiddenException('This application belongs to a different department');
    }
    return app;
  }
}
