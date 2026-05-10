import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { MailingController } from './mailing/mailing.controller';
import { MailingService } from './mailing/mailing.service';
import { MailingProcessor } from './mailing/mailing.processor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        connection: {
          host: cfg.get<string>('REDIS_HOST', 'localhost'),
          port: Number(cfg.get('REDIS_PORT', 6379)),
          password: cfg.get<string>('REDIS_PASSWORD') || undefined,
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'mailing',
      defaultJobOptions: {
        attempts: Number(process.env.QUEUE_RETRIES ?? 3),
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    }),
  ],
  controllers: [MailingController],
  providers: [MailingService, MailingProcessor],
})
export class AppModule {}
