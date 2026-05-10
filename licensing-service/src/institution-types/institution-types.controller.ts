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
import { InstitutionTypesService } from './institution-types.service';
import {
  CreateInstitutionTypeDto,
  ListInstitutionTypesDto,
  UpdateInstitutionTypeDto,
} from './dto/institution-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('institution-types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('institution-types')
export class InstitutionTypesController {
  constructor(private svc: InstitutionTypesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ResponseMessage('Institution type created')
  create(@Body() dto: CreateInstitutionTypeDto) {
    return this.svc.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.REVIEWER, UserRole.APPROVER, UserRole.APPLICANT)
  list(@Query() q: ListInstitutionTypesDto) {
    return this.svc.list(q);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.REVIEWER, UserRole.APPROVER, UserRole.APPLICANT)
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ResponseMessage('Institution type updated')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateInstitutionTypeDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ResponseMessage('Institution type deactivated')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.deactivate(id);
  }
}
