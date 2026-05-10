import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LicenseType } from './entities/license-type.entity';
import { LicenseRequirement } from './entities/license-requirement.entity';
import { LicenseTypesService } from './license-types.service';
import { LicenseRequirementsService } from './license-requirements.service';
import { LicenseTypesController } from './license-types.controller';
import { LicenseRequirementsController } from './license-requirements.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LicenseType, LicenseRequirement])],
  providers: [LicenseTypesService, LicenseRequirementsService],
  controllers: [LicenseTypesController, LicenseRequirementsController],
  exports: [LicenseTypesService, LicenseRequirementsService],
})
export class LicenseTypesModule {}
