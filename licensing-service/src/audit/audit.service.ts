import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export interface CreateAuditEntry {
  application_id?: string | null;
  actor_id: string;
  action: string;
  previous_state?: string | null;
  new_state?: string | null;
  metadata?: Record<string, unknown>;
  ip_address?: string;
}

/**
 * AuditService only ever INSERTs. There are no update or delete methods.
 * The repository is typed to AuditLog so TypeORM cannot issue UPDATE/DELETE
 * without an explicit query builder call — which we never make here.
 */
@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async log(entry: CreateAuditEntry): Promise<AuditLog> {
    const record = this.auditRepository.create({
      application_id: entry.application_id ?? null,
      actor_id: entry.actor_id,
      action: entry.action,
      previous_state: entry.previous_state ?? null,
      new_state: entry.new_state ?? null,
      metadata: entry.metadata ?? null,
      ip_address: entry.ip_address ?? null,
    });

    return this.auditRepository.save(record);
  }

  async findByApplication(applicationId: string): Promise<AuditLog[]> {
    return this.auditRepository.find({
      where: { application_id: applicationId },
      order: { timestamp: 'ASC' },
      relations: ['actor'],
    });
  }

  async findAll(page = 1, limit = 50): Promise<{ data: AuditLog[]; total: number }> {
    const [data, total] = await this.auditRepository.findAndCount({
      order: { timestamp: 'DESC' },
      relations: ['actor'],
      take: limit,
      skip: (page - 1) * limit,
    });

    return { data, total };
  }
}
