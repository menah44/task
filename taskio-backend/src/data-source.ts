import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './auth/entities/user.entity';
import { Role } from './roles/entities/role.entity';
import { Group } from './groups/entities/group.entity';
import { AuditLog } from './audit/entities/audit-log.entity';
import { Form } from './forms/entities/form.entity';
import { Section } from './forms/entities/section.entity';
import { Question } from './forms/entities/question.entity';
import { Template } from './forms/entities/template.entity';
import { FormVersion } from './forms/entities/form-version.entity';
import { Organization } from './organizations/entities/organization.entity';
import { QuestionType } from './question-types/entities/question-type.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'taskio_db',
  entities: [User, Role, Group, AuditLog, Organization, Form, Section, Question, QuestionType, FormVersion, Template],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  synchronize: true,
});
