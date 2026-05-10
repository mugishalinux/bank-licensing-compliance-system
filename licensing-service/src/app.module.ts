import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule, seconds } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ApplicationsModule } from './applications/applications.module';
import { DocumentsModule } from './documents/documents.module';
import { AuditModule } from './audit/audit.module';
import { DepartmentsModule } from './departments/departments.module';
import { InstitutionTypesModule } from './institution-types/institution-types.module';
import { LicenseTypesModule } from './license-types/license-types.module';
import { SeedService } from './database/seeds/seed.service';
import { User } from './users/entities/user.entity';
import { Application } from './applications/entities/application.entity';
import { AuditLog } from './audit/entities/audit-log.entity';
import { Department } from './departments/entities/department.entity';
import { InstitutionType } from './institution-types/entities/institution-type.entity';
import { LicenseType } from './license-types/entities/license-type.entity';
import { LicenseRequirement } from './license-types/entities/license-requirement.entity';
import { HelpersModule } from './common/helpers/helpers.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{ ttl: seconds(60), limit: 100 }]),
    DatabaseModule,
    HelpersModule,
    TypeOrmModule.forFeature([
      User,
      Application,
      AuditLog,
      Department,
      InstitutionType,
      LicenseType,
      LicenseRequirement,
    ]),
    AuthModule,
    UsersModule,
    DepartmentsModule,
    InstitutionTypesModule,
    LicenseTypesModule,
    ApplicationsModule,
    DocumentsModule,
    AuditModule,
  ],
  providers: [
    SeedService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly seedService: SeedService) {}

  async onApplicationBootstrap(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      await this.seedService.seed();
    }
  }
}
