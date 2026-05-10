import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import {
  ApproveDto,
  CompleteReviewDto,
  CreateApplicationDto,
  ListApplicationsDto,
  RejectDto,
  RequestInfoDto,
} from './dto/application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private svc: ApplicationsService) {}

  @Post()
  @Roles(UserRole.APPLICANT)
  @ResponseMessage('Application created')
  create(@Body() dto: CreateApplicationDto, @CurrentUser() user: User) {
    return this.svc.create(dto, user);
  }

  @Get()
  @Roles(UserRole.APPLICANT, UserRole.REVIEWER, UserRole.APPROVER, UserRole.ADMIN)
  list(@Query() q: ListApplicationsDto, @CurrentUser() user: User) {
    return this.svc.list(q, user);
  }

  @Get(':id')
  @Roles(UserRole.APPLICANT, UserRole.REVIEWER, UserRole.APPROVER, UserRole.ADMIN)
  getOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.svc.getOne(id, user);
  }

  @Patch(':id/submit')
  @Roles(UserRole.APPLICANT)
  @ResponseMessage('Application submitted')
  submit(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.svc.submit(id, user);
  }

  @Patch(':id/start-review')
  @Roles(UserRole.REVIEWER)
  @ResponseMessage('Review started')
  startReview(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.svc.startReview(id, user);
  }

  @Patch(':id/request-info')
  @Roles(UserRole.REVIEWER)
  @ResponseMessage('Additional information requested')
  requestInfo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequestInfoDto,
    @CurrentUser() user: User,
  ) {
    return this.svc.requestInfo(id, dto, user);
  }

  @Patch(':id/complete-review')
  @Roles(UserRole.REVIEWER)
  @ResponseMessage('Review completed')
  completeReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteReviewDto,
    @CurrentUser() user: User,
  ) {
    return this.svc.completeReview(id, dto, user);
  }

  @Patch(':id/approve')
  @Roles(UserRole.APPROVER)
  @ResponseMessage('Application approved')
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveDto,
    @CurrentUser() user: User,
  ) {
    return this.svc.approve(id, dto, user);
  }

  @Patch(':id/reject')
  @Roles(UserRole.APPROVER)
  @ResponseMessage('Application rejected')
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectDto,
    @CurrentUser() user: User,
  ) {
    return this.svc.reject(id, dto, user);
  }
}
