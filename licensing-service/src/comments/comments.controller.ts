import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { AddCommentDto } from './dto/comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('applications/:id/comments')
export class CommentsController {
  constructor(private svc: CommentsService) {}

  @Get()
  @Roles(UserRole.APPLICANT, UserRole.REVIEWER, UserRole.APPROVER, UserRole.ADMIN)
  list(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.svc.listForApplication(id, user);
  }

  @Post()
  @Roles(UserRole.APPLICANT, UserRole.REVIEWER, UserRole.APPROVER)
  @ResponseMessage('Comment added')
  add(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddCommentDto,
    @CurrentUser() user: User,
  ) {
    return this.svc.add(id, dto, user);
  }
}
