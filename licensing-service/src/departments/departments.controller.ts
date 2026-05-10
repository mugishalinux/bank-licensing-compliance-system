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
import { DepartmentsService } from './departments.service';
import {
  CreateDepartmentDto,
  ListDepartmentsDto,
  UpdateDepartmentDto,
} from './dto/department.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private svc: DepartmentsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ResponseMessage('Department created')
  create(@Body() dto: CreateDepartmentDto) {
    return this.svc.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.REVIEWER, UserRole.APPROVER, UserRole.APPLICANT)
  list(@Query() q: ListDepartmentsDto) {
    return this.svc.list(q);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.REVIEWER, UserRole.APPROVER, UserRole.APPLICANT)
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ResponseMessage('Department updated')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDepartmentDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ResponseMessage('Department deactivated')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.deactivate(id);
  }
}
