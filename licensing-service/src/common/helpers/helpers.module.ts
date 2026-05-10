import { Global, Module } from '@nestjs/common';
import { EventsHelper } from './events.helper';
import { FilterHelper } from './filter.helper';
import { KafkaHelper } from './kafka.helper';
import { RedisHelper } from './redis.helper';
import { ReferenceIdHelper } from './reference-id.helper';
import { StorageHelper } from './storage.helper';

@Global()
@Module({
  providers: [RedisHelper, KafkaHelper, EventsHelper, FilterHelper, ReferenceIdHelper, StorageHelper],
  exports: [RedisHelper, KafkaHelper, EventsHelper, FilterHelper, ReferenceIdHelper, StorageHelper],
})
export class HelpersModule {}
