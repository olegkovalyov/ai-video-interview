import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
} from 'typeorm';

/**
 * HRProfile TypeORM Entity
 * Maps to 'hr_profiles' table in database
 */
@Entity('hr_profiles')
export class HRProfileEntity {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'company_name' })
  companyName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  position: string | null;

  @Column({ default: false, name: 'is_profile_complete' })
  isProfileComplete: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
