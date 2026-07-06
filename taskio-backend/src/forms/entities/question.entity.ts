import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, DeleteDateColumn } from 'typeorm';
import { Section } from './section.entity';

@Entity('question')
export class Question {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  type!: string;

  @Column()
  label!: string;

  @Column({ default: false })
  required!: boolean;

  @Column({ nullable: true })
  placeholder?: string;

  @Column({ type: 'jsonb', nullable: true })
  options?: string[];

  @Column({ type: 'int' })
  sectionId!: number;

  @ManyToOne(() => Section, (section) => section.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sectionId' })
  section!: Section;

  @DeleteDateColumn()
  deletedAt?: Date;
}
