import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany, JoinTable, ManyToOne } from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { Group } from '../../groups/entities/group.entity';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ nullable: true, type: 'varchar' })
  hashedRefreshToken?: string | null;

  @Column({ default: 'USER' })
  role!: string;

  orgId?: number;

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

  @ManyToMany(() => Group, (group) => group.users)
  @JoinTable()
  groups!: Group[];

  @ManyToOne(() => Organization, (org) => org.users, { nullable: true })
  organization!: Organization;
}
