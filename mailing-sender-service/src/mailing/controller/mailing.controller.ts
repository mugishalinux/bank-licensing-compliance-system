import { Controller, Logger } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { EmailDto } from "../dto/sms.dto";
import { QueeingMailsService } from "../service/queueing.mails.service";
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

@Controller()
export class MailingController {
  constructor(private readonly queeingMailsService: QueeingMailsService) { }

  @MessagePattern(process.env.SEND_EMAIL_REQUEST_TOPIC)
  handleSMSRequest(@Payload() payload: any) {
    const value: EmailDto = payload.value;
    this.queeingMailsService.queueEmails(value);
  }
}
