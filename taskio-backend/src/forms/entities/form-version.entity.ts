import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Form } from './form.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('form_version')
export class FormVersion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  formId!: number;

  @ManyToOne(() => Form, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'formId' })
  form!: Form;

  @Column({ type: 'int' })
  version!: number;

  @Column({ type: 'jsonb' })
  snapshot!: any;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'int', nullable: true })
  createdById?: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy?: User;
}
