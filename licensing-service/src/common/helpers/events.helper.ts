import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaHelper } from './kafka.helper';

export interface EmailEvent {
  to: string;
  name: string;
  subject?: string;
  message: string;
}

@Injectable()
export class EventsHelper {
  constructor(
    private kafka: KafkaHelper,
    private cfg: ConfigService,
  ) {}

  sendEmail(payload: EmailEvent) {
    const topic = this.cfg.get<string>('SEND_EMAIL_REQUEST_TOPIC', 'send-email');
    return this.kafka.send(topic, payload);
  }

  emit(topicEnv: string, payload: unknown, fallback?: string) {
    const topic = this.cfg.get<string>(topicEnv, fallback ?? topicEnv);
    return this.kafka.send(topic, payload);
  }
}
