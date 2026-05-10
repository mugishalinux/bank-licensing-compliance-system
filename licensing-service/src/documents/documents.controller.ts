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
import { DocumentsService } from './documents.service';
import { PresignUploadDto } from './dto/document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('applications/:id/documents')
export class DocumentsController {
  constructor(private svc: DocumentsService) {}

  @Post('presign-upload')
  @Roles(UserRole.APPLICANT)
  @ResponseMessage('Upload URL issued')
  presignUpload(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PresignUploadDto,
    @CurrentUser() user: User,
  ) {
    return this.svc.presignUpload(id, dto, user);
  }

  @Post(':docId/confirm')
  @Roles(UserRole.APPLICANT)
  @ResponseMessage('Upload confirmed')
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('docId', ParseUUIDPipe) docId: string,
    @CurrentUser() user: User,
  ) {
    void id;
    return this.svc.confirm(docId, user);
  }

  @Get()
  @Roles(UserRole.APPLICANT, UserRole.REVIEWER, UserRole.APPROVER, UserRole.ADMIN)
  list(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.svc.listForApplication(id, user);
  }

  @Get(':docId/download-url')
  @Roles(UserRole.APPLICANT, UserRole.REVIEWER, UserRole.APPROVER, UserRole.ADMIN)
  downloadUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('docId', ParseUUIDPipe) docId: string,
    @CurrentUser() user: User,
  ) {
    void id;
    return this.svc.presignDownload(docId, user);
  }
}
