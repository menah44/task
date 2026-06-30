import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('group')
export class Group {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;
}
