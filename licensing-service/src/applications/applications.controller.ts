import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import {
  RequestAdditionalInfoDto,
  CompleteReviewDto,
  MakeDecisionDto,
} from './dto/transition.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';

@ApiTags('applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @Roles(UserRole.APPLICANT)
  @ApiOperation({ summary: 'Create a new draft application' })
  create(@Body() dto: CreateApplicationDto, @CurrentUser() user: User) {
    return this.applicationsService.create(dto, user);
  }

  @Get()
  @Roles(UserRole.APPLICANT, UserRole.REVIEWER, UserRole.APPROVER, UserRole.ADMIN)
  @ApiOperation({ summary: 'List applications (scope filtered by role)' })
  findAll(@CurrentUser() user: User) {
    return this.applicationsService.findAll(user);
  }

  @Get(':id')
  @Roles(UserRole.APPLICANT, UserRole.REVIEWER, UserRole.APPROVER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get application details' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.applicationsService.findOne(id, user);
  }

  @Patch(':id/submit')
  @Roles(UserRole.APPLICANT)
  @ApiOperation({ summary: 'Submit a draft application (or resubmit after info request)' })
  submit(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.applicationsService.submit(id, user);
  }

  @Patch(':id/start-review')
  @Roles(UserRole.REVIEWER)
  @ApiOperation({ summary: 'Assign yourself as reviewer and begin review' })
  startReview(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.applicationsService.startReview(id, user);
  }

  @Patch(':id/request-info')
  @Roles(UserRole.REVIEWER)
  @ApiOperation({ summary: 'Request additional information from the applicant' })
  requestAdditionalInfo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequestAdditionalInfoDto,
    @CurrentUser() user: User,
  ) {
    return this.applicationsService.requestAdditionalInfo(id, dto, user);
  }

  @Patch(':id/complete-review')
  @Roles(UserRole.REVIEWER)
  @ApiOperation({ summary: 'Mark review complete and forward to approver' })
  completeReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteReviewDto,
    @CurrentUser() user: User,
  ) {
    return this.applicationsService.completeReview(id, dto, user);
  }

  @Patch(':id/approve')
  @Roles(UserRole.APPROVER)
  @ApiOperation({ summary: 'Approve a reviewed application (cannot be the reviewer)' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MakeDecisionDto,
    @CurrentUser() user: User,
  ) {
    return this.applicationsService.approve(id, dto, user);
  }

  @Patch(':id/reject')
  @Roles(UserRole.APPROVER)
  @ApiOperation({ summary: 'Reject a reviewed application (cannot be the reviewer)' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MakeDecisionDto,
    @CurrentUser() user: User,
  ) {
    return this.applicationsService.reject(id, dto, user);
  }
}
