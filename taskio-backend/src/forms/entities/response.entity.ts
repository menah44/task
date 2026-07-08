import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Form } from './form.entity';

@Entity('response')
export class Response {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  formId!: number;

  @ManyToOne(() => Form, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'formId' })
  form!: Form;

  @Column({ type: 'double precision', nullable: true })
  latitude?: number | null;

  @Column({ type: 'double precision', nullable: true })
  longitude?: number | null;

  @CreateDateColumn()
  createdAt!: Date;
}
