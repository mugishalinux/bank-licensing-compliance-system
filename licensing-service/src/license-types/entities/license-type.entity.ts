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
} from 'typeorm';
import { Department } from '../../departments/entities/department.entity';
import { LicenseRequirement } from './license-requirement.entity';

@Entity('license_types')
export class LicenseType extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 36 })
  department_id: string;

  @ManyToOne(() => Department, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ type: 'int', default: 30 })
  processing_time_days: number;

  @Column({ default: false })
  is_paid: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  fee_amount: string | null;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => LicenseRequirement, (r) => r.license_type)
  requirements: LicenseRequirement[];
}
