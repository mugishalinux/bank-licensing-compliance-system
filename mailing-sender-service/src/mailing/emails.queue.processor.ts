import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import * as nodemailer from "nodemailer";
import * as dotenv from "dotenv";
import { EmailDto } from "./dto/sms.dto";
import { emailTemplate } from "src/constanst/email.templates";
import { Logger } from "@nestjs/common";
dotenv.config();
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

@Processor(process.env.QUEUE_NAME)
export class MailingProcessor {
  private readonly logger = new Logger(MailingProcessor.name);

  private readonly transporter;
  constructor() {
    {
      this.transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.SMTPUSERNANE,
          pass: process.env.SMTPEMAIL,
        },
      });
    }
  }
  @Process()
  async sendSMS(job: Job) {
    try {
      const data: EmailDto = job.data;
      const emailHtml = emailTemplate(`${data.names}`, data.message);
      const info = await this.transporter.sendMail({
        from: process.env.SMTPUSERNANE,
        to: data.email,
        subject: "Attendance Management Notification",
        html: emailHtml,
        text: `Hello ${data.names}, \n\n${data.message}`,
      });
      this.logger.log(`Email sent: ${info.response}`);
    } catch (e) {
      console.log(e);
      this.logger.error(`email fail: ${e}`);
    }
  }
}
