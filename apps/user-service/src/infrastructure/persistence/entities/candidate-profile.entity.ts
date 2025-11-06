import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  Index,
} from 'typeorm';

/**
 * CandidateProfile TypeORM Entity
 * Maps to 'candidate_profiles' table in database
 */
@Entity('candidate_profiles')
export class CandidateProfileEntity {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId: string;

  @Column('text', { array: true, default: '{}' })
  @Index('idx_candidate_profiles_skills', { synchronize: false }) // GIN index created in migration
  skills: string[];

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'experience_level' })
  @Index()
  experienceLevel: 'junior' | 'mid' | 'senior' | 'lead' | null;

  @Column({ default: false, name: 'is_profile_complete' })
  @Index()
  isProfileComplete: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
