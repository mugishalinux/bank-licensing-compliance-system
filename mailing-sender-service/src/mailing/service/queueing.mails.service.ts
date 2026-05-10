import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { EmailDto } from "../dto/sms.dto";
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

@Injectable()
export class QueeingMailsService {
  private readonly logger = new Logger(QueeingMailsService.name);

  constructor(
    @InjectQueue(process.env.QUEUE_NAME) private readonly queue: Queue,
  ) { }
  async queueEmails(payload: EmailDto) {
    this.logger.warn(`SMS Request Payload: ${payload}`);
    this
    await this.queue.add(payload, {
      attempts: Number(process.env.QUEUE_RETRIES),
    });
  }
}
