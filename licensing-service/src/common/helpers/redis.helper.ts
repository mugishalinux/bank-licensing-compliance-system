import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisHelper implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;
  private prefix!: string;
  private readonly log = new Logger(RedisHelper.name);

  constructor(private cfg: ConfigService) {}

  onModuleInit() {
    this.prefix = this.cfg.get<string>('APPLICATION_NAME', 'bnr-licensing');
    const password = this.cfg.get<string>('REDIS_PASSWORD');
    this.client = new Redis({
      host: this.cfg.get<string>('REDIS_HOST', 'localhost'),
      port: Number(this.cfg.get('REDIS_PORT', 6379)),
      password: password || undefined,
      lazyConnect: false,
      maxRetriesPerRequest: 3,
    });
    this.client.on('error', (e) => this.log.error(`redis: ${e.message}`));
    this.client.on('connect', () => this.log.log('redis connected'));
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  private k(key: string) {
    return `${this.prefix}:${key}`;
  }

  async set(key: string, value: unknown, ttlSeconds = 300) {
    await this.client.set(this.k(key), JSON.stringify(value), 'EX', ttlSeconds);
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const raw = await this.client.get(this.k(key));
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async del(key: string) {
    return this.client.del(this.k(key));
  }

  async exists(key: string) {
    return (await this.client.exists(this.k(key))) === 1;
  }

  async incr(key: string, ttlSeconds?: number) {
    const v = await this.client.incr(this.k(key));
    if (v === 1 && ttlSeconds) await this.client.expire(this.k(key), ttlSeconds);
    return v;
  }
}
