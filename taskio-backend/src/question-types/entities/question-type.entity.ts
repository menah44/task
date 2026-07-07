import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('question_types')
export class QuestionType {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  type: string; // The UI type (e.g. 'text', 'radio', 'checkbox')

  @Column({ type: 'varchar', length: 100 })
  label: string; // The UI label (e.g. 'Short Text', 'Multiple Choice')

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon: string; // Emoji or icon name (e.g. '📝', '🔘')

  @Column({ type: 'varchar', length: 50 })
  baseType: string; // The backend core type (e.g. 'TEXT', 'SINGLE_CHOICE')

  @Column({ type: 'jsonb', nullable: true, default: {} })
  configSchema: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
