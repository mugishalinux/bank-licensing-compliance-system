import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LicenseRequirementsService } from './license-requirements.service';
import { UpdateLicenseRequirementDto } from './dto/license-requirement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('license-requirements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('license-requirements')
export class LicenseRequirementsController {
  constructor(private svc: LicenseRequirementsService) {}

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ResponseMessage('Requirement updated')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLicenseRequirementDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ResponseMessage('Requirement removed')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(id);
  }
}
