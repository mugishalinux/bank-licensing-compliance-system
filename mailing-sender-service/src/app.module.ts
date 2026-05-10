import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BullModule } from "@nestjs/bull";
import { QueeingMailsService } from "./mailing/service/queueing.mails.service";
import { MailingController } from "./mailing/controller/mailing.controller";
import { MailingProcessor } from "./mailing/emails.queue.processor";

@Module({
  imports: [
    ConfigModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    BullModule.registerQueue({
      name: process.env.QUEUE_NAME,
    }),
  ],
  controllers: [MailingController],
  providers: [QueeingMailsService, MailingProcessor],
})
export class AppModule {}
