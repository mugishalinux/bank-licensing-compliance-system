import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  VersionColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ApplicationDocument } from '../../documents/entities/document.entity';
import { ApplicationStatus } from '../../common/enums/application-status.enum';

@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 500 })
  institution_name: string;

  @Column({ length: 100 })
  institution_type: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  registered_address: string;

  @Column({ nullable: true })
  registration_number: string;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.DRAFT,
  })
  status: ApplicationStatus;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'applicant_id' })
  applicant: User;

  @Column()
  applicant_id: string;

  // Set when status moves to UNDER_REVIEW — enforces reviewer/approver separation
  @Column({ type: 'varchar', nullable: true })
  reviewer_id: string | null;

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User | null;

  @Column({ type: 'varchar', nullable: true })
  approver_id: string | null;

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'approver_id' })
  approver: User | null;

  @Column({ type: 'text', nullable: true })
  reviewer_notes: string | null;

  @Column({ type: 'text', nullable: true })
  additional_info_request: string | null;

  @Column({ type: 'text', nullable: true })
  decision_notes: string | null;

  // Tracks the submission round — incremented on each resubmission
  @Column({ default: 1 })
  submission_version: number;

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => ApplicationDocument, (doc) => doc.application)
  documents: ApplicationDocument[];
}
