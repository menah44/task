import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Form } from './form.entity';
import { User } from '../../auth/entities/user.entity';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('response')
export class Response {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  formId!: number;

  @ManyToOne(() => Form, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'formId' })
  form!: Form;

  @Column({ type: 'int' })
  userId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'int' })
  organizationId!: number;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization!: Organization;

  @Column({ type: 'jsonb', nullable: true })
  answers?: any;

  @Column({ type: 'varchar', default: 'DRAFT' })
  status!: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  submittedAt?: Date | null;

  @Column({ type: 'double precision', nullable: true })
  latitude?: number | null;

  @Column({ type: 'double precision', nullable: true })
  longitude?: number | null;

  @CreateDateColumn()
  createdAt!: Date;
}
