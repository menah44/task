import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, DeleteDateColumn } from 'typeorm';
import { Form } from './form.entity';
import { Question } from './question.entity';

@Entity('section')
export class Section {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ type: 'int' })
  formId!: number;

  @ManyToOne(() => Form, (form) => form.sections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'formId' })
  form!: Form;

  @OneToMany(() => Question, (question) => question.section, { cascade: true })
  questions!: Question[];

  @DeleteDateColumn()
  deletedAt?: Date;
}
