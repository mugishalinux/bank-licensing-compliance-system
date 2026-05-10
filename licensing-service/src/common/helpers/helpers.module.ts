import { Global, Module } from '@nestjs/common';
import { EventsHelper } from './events.helper';
import { FilterHelper } from './filter.helper';
import { KafkaHelper } from './kafka.helper';
import { RedisHelper } from './redis.helper';

@Global()
@Module({
  providers: [RedisHelper, KafkaHelper, EventsHelper, FilterHelper],
  exports: [RedisHelper, KafkaHelper, EventsHelper, FilterHelper],
})
export class HelpersModule {}
