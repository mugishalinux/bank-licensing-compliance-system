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
import { LicenseType } from './license-type.entity';

@Entity('license_requirements')
export class LicenseRequirement extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  license_type_id: string;

  @ManyToOne(() => LicenseType, (lt) => lt.requirements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'license_type_id' })
  license_type: LicenseType;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ default: true })
  is_mandatory: boolean;

  @Column({ default: false })
  requires_attachment: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
