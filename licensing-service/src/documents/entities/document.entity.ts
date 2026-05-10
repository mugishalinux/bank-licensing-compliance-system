import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Application } from '../../applications/entities/application.entity';
import { User } from '../../users/entities/user.entity';

@Entity('application_documents')
export class ApplicationDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Application, (app) => app.documents)
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @Column()
  application_id: string;

  @Column({ length: 500 })
  original_name: string;

  @Column({ length: 500 })
  stored_name: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column({ length: 100 })
  mime_type: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploader_id' })
  uploader: User;

  @Column()
  uploader_id: string;

  // Links document to a specific application submission round
  @Column()
  submission_version: number;

  @CreateDateColumn()
  uploaded_at: Date;
}
