import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Application } from '../../applications/entities/application.entity';
import { User } from '../../users/entities/user.entity';

export enum CommentKind {
  INFO_REQUEST = 'INFO_REQUEST',
  REVIEW_NOTE = 'REVIEW_NOTE',
  APPROVAL = 'APPROVAL',
  REJECTION = 'REJECTION',
  APPLICANT_REPLY = 'APPLICANT_REPLY',
}

@Entity('comments')
export class Comment extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  application_id: string;

  @ManyToOne(() => Application, (a) => a.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @Column({ type: 'varchar', length: 36 })
  author_id: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ type: 'enum', enum: CommentKind })
  kind: CommentKind;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  attachment_key: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  attachment_name: string | null;

  @CreateDateColumn()
  created_at: Date;
}
