import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { RoleEntity } from './role.entity';

/**
 * User TypeORM Entity
 * Maps to 'users' table in database
 */
@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, type: 'varchar', length: 255, name: 'keycloak_id' })
  @Index()
  keycloakId: string;

  @Column({ unique: true, type: 'varchar', length: 255 })
  @Index()
  email: string;

  @Column({ nullable: true, unique: true, type: 'varchar', length: 100 })
  username: string;

  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name' })
  lastName: string;

  @Column({ nullable: true, type: 'text', name: 'avatar_url' })
  avatarUrl: string | null;

  @Column({ nullable: true, type: 'text' })
  bio: string | null;

  @Column({ nullable: true, type: 'varchar', length: 50 })
  phone: string | null;

  @Column({ type: 'varchar', length: 50, default: 'UTC' })
  timezone: string;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  language: string;

  @Column({ default: false, name: 'email_verified' })
  emailVerified: boolean;

  @Column({
    type: 'enum',
    enum: ['active', 'suspended', 'deleted'],
    default: 'active',
    name: 'status',
  })
  @Index()
  status: 'active' | 'suspended' | 'deleted';

  @Column({ nullable: true, type: 'timestamp', name: 'last_login_at' })
  lastLoginAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  // Relations
  @ManyToMany(() => RoleEntity, role => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: RoleEntity[];
}
