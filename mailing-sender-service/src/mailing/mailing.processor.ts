import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { createTransport, Transporter } from 'nodemailer';
import { EmailJob } from './mailing.dto';
import { renderEmail } from './template';

@Processor('mailing')
export class MailingProcessor extends WorkerHost {
  private readonly log = new Logger(MailingProcessor.name);
  private transporter: Transporter;
  private from: string;

  constructor(cfg: ConfigService) {
    super();
    this.from = cfg.get<string>('SMTP_FROM', 'BNR Licensing Portal <noreply@bnr.rw>');
    this.transporter = createTransport({
      host: cfg.get<string>('SMTP_HOST', 'localhost'),
      port: Number(cfg.get('SMTP_PORT', 1025)),
      secure: cfg.get<string>('SMTP_SECURE') === 'true',
      auth: cfg.get<string>('SMTP_USER')
        ? {
            user: cfg.get<string>('SMTP_USER')!,
            pass: cfg.get<string>('SMTP_PASSWORD'),
          }
        : undefined,
    });
  }

  async process(job: Job<EmailJob>) {
    const { to, name, subject, message } = job.data;
    const html = renderEmail(name, message, subject);
    const info = await this.transporter.sendMail({
      from: this.from,
      to,
      subject: subject ?? 'BNR Licensing Portal',
      html,
      text: `Hello ${name},\n\n${message}`,
    });
    this.log.log(`sent to ${to} (${info.messageId})`);
  }
}
