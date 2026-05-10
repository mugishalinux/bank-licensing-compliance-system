import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstitutionType } from './entities/institution-type.entity';
import { InstitutionTypesService } from './institution-types.service';
import { InstitutionTypesController } from './institution-types.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InstitutionType])],
  providers: [InstitutionTypesService],
  controllers: [InstitutionTypesController],
  exports: [InstitutionTypesService],
})
export class InstitutionTypesModule {}
