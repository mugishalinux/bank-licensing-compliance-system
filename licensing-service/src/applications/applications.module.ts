import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { StateMachineService } from './state-machine.service';
import { Application } from './entities/application.entity';
import { ApplicationDocument } from '../documents/entities/document.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application, ApplicationDocument]),
    AuditModule,
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, StateMachineService],
  exports: [ApplicationsService, StateMachineService],
})
export class ApplicationsModule {}
