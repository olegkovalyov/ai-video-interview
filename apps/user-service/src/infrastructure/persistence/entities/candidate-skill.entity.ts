import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { UserEntity } from './user.entity';
import { SkillEntity } from './skill.entity';

/**
 * CandidateSkill TypeORM Entity
 * Maps to 'candidate_skills' table
 */
@Entity('candidate_skills')
@Index(['candidateId', 'skillId'], { unique: true })
export class CandidateSkillEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'candidate_id' })
  @Index()
  candidateId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'candidate_id' })
  candidate?: UserEntity;

  @Column({ type: 'uuid', name: 'skill_id' })
  @Index()
  skillId: string;

  @ManyToOne(() => SkillEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skill_id' })
  skill?: SkillEntity;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    name: 'proficiency_level',
    nullable: true,
  })
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null;

  @Column({ type: 'int', name: 'years_of_experience', nullable: true })
  yearsOfExperience: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
