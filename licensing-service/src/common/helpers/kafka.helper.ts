import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaHelper implements OnModuleInit, OnModuleDestroy {
  private kafka!: Kafka;
  private producer!: Producer;
  private appName!: string;
  private connected = false;
  private readonly log = new Logger(KafkaHelper.name);

  constructor(private cfg: ConfigService) {}

  async onModuleInit() {
    this.appName = this.cfg.get<string>('APPLICATION_NAME', 'bnr-licensing');
    this.kafka = new Kafka({
      clientId: this.cfg.get<string>('KAFKA_CLIENT_ID', 'licensing-service'),
      brokers: [this.cfg.get<string>('KAFKA_BROKER_URL', 'localhost:9092')],
      retry: { retries: 3, initialRetryTime: 300 },
    });
    this.producer = this.kafka.producer();
    try {
      await this.producer.connect();
      this.connected = true;
      this.log.log('kafka producer connected');
    } catch (e) {
      this.log.error(`kafka connect failed: ${(e as Error).message}`);
    }
  }

  async onModuleDestroy() {
    if (this.connected) await this.producer.disconnect();
  }

  async send(topic: string, payload: unknown, headers?: Record<string, string>) {
    if (!this.connected) {
      this.log.warn(`kafka not connected; dropping message to ${topic}`);
      return false;
    }
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            value: JSON.stringify(payload),
            headers: { appName: this.appName, ...headers },
          },
        ],
      });
      return true;
    } catch (e) {
      this.log.error(`kafka send to ${topic} failed: ${(e as Error).message}`);
      return false;
    }
  }
}
