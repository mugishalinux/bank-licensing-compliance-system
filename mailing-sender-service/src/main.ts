import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const cfg = app.get(ConfigService);
  const log = new Logger('bootstrap');

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'mailing-sender-service',
        brokers: [cfg.get<string>('KAFKA_BROKER_URL', 'localhost:9092')],
      },
      consumer: {
        groupId: cfg.get<string>('KAFKA_GROUP_ID', 'mailing'),
      },
    },
  });

  await app.startAllMicroservices();
  const port = Number(cfg.get('NODE_PORT', 3002));
  await app.listen(port);
  log.log(`mailing-sender-service ready on :${port}`);
}

bootstrap().catch((e) => {
  console.error(e);
  process.exit(1);
});
