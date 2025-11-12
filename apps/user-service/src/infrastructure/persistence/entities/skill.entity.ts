import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { SkillCategoryEntity } from './skill-category.entity';

/**
 * Skill TypeORM Entity
 * Maps to 'skills' table
 */
@Entity('skills')
export class SkillEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  slug: string;

  @Column({ type: 'uuid', nullable: true, name: 'category_id' })
  @Index()
  categoryId: string | null;

  @ManyToOne(() => SkillCategoryEntity, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category?: SkillCategoryEntity;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @Index()
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
