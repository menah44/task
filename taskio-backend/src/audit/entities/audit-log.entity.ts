import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('audit_log')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  actorId!: number;

  @Column()
  actorEmail!: string;

  @Column()
  action!: string;

  @Column()
  resourceType!: string;

  @Column({ nullable: true })
  resourceId?: string;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true, type: 'text' })
  userAgent?: string;

  @Column({ type: 'json', nullable: true })
  details?: any;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'int', nullable: true })
  organizationId!: number | null;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'organizationId' })
  organization?: Organization;
}
