import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LicenseTypesService } from './license-types.service';
import { LicenseRequirementsService } from './license-requirements.service';
import {
  CreateLicenseTypeDto,
  ListLicenseTypesDto,
  UpdateLicenseTypeDto,
} from './dto/license-type.dto';
import { CreateLicenseRequirementDto } from './dto/license-requirement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('license-types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('license-types')
export class LicenseTypesController {
  constructor(
    private types: LicenseTypesService,
    private reqs: LicenseRequirementsService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ResponseMessage('License type created')
  create(@Body() dto: CreateLicenseTypeDto) {
    return this.types.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.REVIEWER, UserRole.APPROVER, UserRole.APPLICANT)
  list(@Query() q: ListLicenseTypesDto) {
    return this.types.list(q);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.REVIEWER, UserRole.APPROVER, UserRole.APPLICANT)
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.types.getOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ResponseMessage('License type updated')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLicenseTypeDto) {
    return this.types.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ResponseMessage('License type deactivated')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.types.deactivate(id);
  }

  @Get(':id/requirements')
  @Roles(UserRole.ADMIN, UserRole.REVIEWER, UserRole.APPROVER, UserRole.APPLICANT)
  listReqs(@Param('id', ParseUUIDPipe) id: string) {
    return this.reqs.listForType(id);
  }

  @Post(':id/requirements')
  @Roles(UserRole.ADMIN)
  @ResponseMessage('Requirement added')
  addReq(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateLicenseRequirementDto) {
    return this.reqs.addToType(id, dto);
  }
}
