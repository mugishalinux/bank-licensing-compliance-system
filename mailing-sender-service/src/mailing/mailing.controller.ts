import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MailingService } from './mailing.service';
import { EmailJob } from './mailing.dto';

const TOPIC = process.env.SEND_EMAIL_REQUEST_TOPIC || 'send-email';

@Controller()
export class MailingController {
  private readonly log = new Logger(MailingController.name);

  constructor(private mailing: MailingService) {}

  @MessagePattern(TOPIC)
  handle(@Payload() payload: EmailJob | { value: EmailJob }) {
    const job = (payload as { value?: EmailJob }).value ?? (payload as EmailJob);
    this.log.log(`enqueue email -> ${job.to}`);
    return this.mailing.enqueue(job);
  }
}
