import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, DeleteDateColumn } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../auth/entities/user.entity';
import { Section } from './section.entity';

@Entity('form')
export class Form {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: 'draft' })
  status!: string;

  @Column({ default: false })
  isPublic!: boolean;

  @Column({ default: 1 })
  version!: number;

  @Column({ type: 'jsonb', nullable: true })
  schema?: any;

  @Column({ type: 'jsonb', nullable: true })
  settings?: any;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'int' })
  organizationId!: number;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization!: Organization;

  @Column({ type: 'int', nullable: true })
  creatorId?: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'creatorId' })
  creator?: User;

  @OneToMany(() => Section, (section) => section.form, { cascade: true })
  sections!: Section[];

  @DeleteDateColumn()
  deletedAt?: Date;
}
