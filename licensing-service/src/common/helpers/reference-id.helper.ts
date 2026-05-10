import { Injectable } from '@nestjs/common';
import { RedisHelper } from './redis.helper';

@Injectable()
export class ReferenceIdHelper {
  constructor(private redis: RedisHelper) {}

  async next(prefix = 'BNR'): Promise<string> {
    const year = new Date().getFullYear();
    const seq = await this.redis.incr(`refseq:${prefix}:${year}`);
    return `${prefix}-${year}-${String(seq).padStart(6, '0')}`;
  }
}
