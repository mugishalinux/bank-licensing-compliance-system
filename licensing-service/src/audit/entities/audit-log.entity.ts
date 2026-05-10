import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * Audit log is APPEND-ONLY. No UPDATE or DELETE operations are ever issued
 * against this table by application code. Enforcement: the DB role used by
 * the application is granted INSERT + SELECT only on this table (see migrations).
 * TypeORM entities have no save/update path for AuditLog — the service only
 * calls .save() via AuditRepository which maps to INSERT.
 */
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  application_id: string | null;

  @Column()
  actor_id: string;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'actor_id' })
  actor: User;

  @Column({ length: 100 })
  action: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  previous_state: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  new_state: string | null;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ip_address: string | null;

  // CreateDateColumn maps to a server-side DEFAULT now() — clients cannot supply it
  @CreateDateColumn()
  timestamp: Date;
}
