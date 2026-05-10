import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Transport } from "@nestjs/microservices";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function bootstrap() {

  const app = await NestFactory.create(AppModule);
  const kafkaBrokerUrl = process.env.KAFKA_BROKER_URL || 'localhost:9092';

  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [kafkaBrokerUrl],
        clientId: 'notification-service',
      },
      consumer: {
        groupId: process.env.KAFKA_GROUP_ID || 'manager',
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.NODE_PORT || 6000);
}

bootstrap().catch(err => {
  console.error('Error starting application:', err);
  process.exit(1);
});