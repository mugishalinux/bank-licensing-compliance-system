import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Application } from '../../applications/entities/application.entity';
import { User } from '../../users/entities/user.entity';

export enum DocumentStatus {
  PENDING_UPLOAD = 'PENDING_UPLOAD',
  READY = 'READY',
  REJECTED = 'REJECTED',
}

@Entity('application_documents')
export class ApplicationDocument extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  application_id: string;

  @ManyToOne(() => Application, (a) => a.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @Column({ type: 'varchar', length: 36, nullable: true })
  requirement_id: string | null;

  @Column({ length: 500 })
  original_name: string;

  @Column({ length: 500, unique: true })
  object_key: string;

  @Column({ type: 'bigint' })
  size: string;

  @Column({ length: 100 })
  mime_type: string;

  @Column({ type: 'enum', enum: DocumentStatus, default: DocumentStatus.PENDING_UPLOAD })
  status: DocumentStatus;

  @Column({ type: 'varchar', length: 36 })
  uploader_id: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'uploader_id' })
  uploader: User;

  @Column({ type: 'int' })
  submission_version: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
