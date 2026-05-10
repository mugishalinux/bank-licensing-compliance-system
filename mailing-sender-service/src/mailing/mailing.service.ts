import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EmailJob } from './mailing.dto';

@Injectable()
export class MailingService {
  private readonly log = new Logger(MailingService.name);

  constructor(@InjectQueue('mailing') private queue: Queue) {}

  async enqueue(job: EmailJob) {
    if (!job?.to) {
      this.log.warn('dropping email with no recipient');
      return;
    }
    await this.queue.add('send', job);
  }
}
