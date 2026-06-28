import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id!: number; // ضفنا علامة تعجب هنا

  @Column({ unique: true })
  email!: string; // وهنا

  @Column()
  password!: string; // وهنا

  @Column({ default: 'USER' })
  role!: string; // وهنا
}
