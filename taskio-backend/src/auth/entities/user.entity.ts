import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { Group } from '../../groups/entities/group.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ default: 'USER' })
  role!: string;

  @Column({ unique: true, nullable: true })
  username?: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToMany(() => Role)
  @JoinTable()
  roles!: Role[];

  @ManyToMany(() => Group)
  @JoinTable()
  groups!: Group[];
}
