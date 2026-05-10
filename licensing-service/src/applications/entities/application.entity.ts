import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Department } from '../../departments/entities/department.entity';
import { LicenseType } from '../../license-types/entities/license-type.entity';
import { ApplicationDocument } from '../../documents/entities/document.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { ApplicationStatus } from '../../common/enums/application-status.enum';

@Entity('applications')
export class Application extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 30 })
  reference_id: string;

  @Column({ type: 'varchar', length: 36 })
  applicant_id: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'applicant_id' })
  applicant: User;

  @Column({ type: 'varchar', length: 36 })
  license_type_id: string;

  @ManyToOne(() => LicenseType, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'license_type_id' })
  license_type: LicenseType;

  @Column({ type: 'varchar', length: 36 })
  department_id: string;

  @ManyToOne(() => Department, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ length: 255 })
  applicant_name_snapshot: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  institution_name_snapshot: string | null;

  @Column({ length: 255 })
  email_snapshot: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone_snapshot: string | null;

  @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.DRAFT })
  status: ApplicationStatus;

  @Column({ type: 'varchar', length: 36, nullable: true })
  reviewer_id: string | null;

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  approver_id: string | null;

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'approver_id' })
  approver: User | null;

  @Column({ type: 'int', default: 1 })
  submission_version: number;

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  submitted_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  decided_at: Date | null;

  @OneToMany(() => ApplicationDocument, (d) => d.application)
  documents: ApplicationDocument[];

  @OneToMany(() => Comment, (c) => c.application)
  comments: Comment[];
}
