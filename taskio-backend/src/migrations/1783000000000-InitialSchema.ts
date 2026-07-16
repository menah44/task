import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1783000000000 implements MigrationInterface {
  name = 'InitialSchema1783000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "organization" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "slug" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a08804baa7c5d5427067c49a31f" UNIQUE ("slug"), CONSTRAINT "PK_472c1f99a32def1b0abb219cd67" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "role" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" integer, CONSTRAINT "UQ_ba442414324b5ceea2f9e86db17" UNIQUE ("name", "organizationId"), CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "group" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "parentId" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" integer, CONSTRAINT "UQ_82075bcad8212da193f04f417fe" UNIQUE ("name", "organizationId"), CONSTRAINT "PK_256aa0fda9b1de1a73ee0b7106b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "hashedRefreshToken" character varying, "role" character varying NOT NULL DEFAULT 'USER', "username" character varying, "firstName" character varying, "lastName" character varying, "isActive" boolean NOT NULL DEFAULT true, "theme" character varying DEFAULT 'dark', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" integer, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_log" ("id" SERIAL NOT NULL, "actorId" integer NOT NULL, "actorEmail" character varying NOT NULL, "action" character varying NOT NULL, "resourceType" character varying NOT NULL, "resourceId" character varying, "ipAddress" character varying, "userAgent" text, "details" json, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" integer, CONSTRAINT "PK_07fefa57f7f5ab8fc3f52b3ed0b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "question" ("id" SERIAL NOT NULL, "type" character varying NOT NULL, "label" character varying NOT NULL, "required" boolean NOT NULL DEFAULT false, "placeholder" character varying, "options" jsonb, "sectionId" integer NOT NULL, "deletedAt" TIMESTAMP, CONSTRAINT "PK_21e5786aa0ea704ae185a79b2d5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "section" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "formId" integer NOT NULL, "deletedAt" TIMESTAMP, CONSTRAINT "PK_3c41d2d699384cc5e8eac54777d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "form" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" character varying, "status" character varying NOT NULL DEFAULT 'draft', "isPublic" boolean NOT NULL DEFAULT false, "version" integer NOT NULL DEFAULT '1', "schema" jsonb, "settings" jsonb, "boundary" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" integer NOT NULL, "creatorId" integer, "deletedAt" TIMESTAMP, CONSTRAINT "PK_8f72b95aa2f8ba82cf95dc7579e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "question_types" ("type" character varying(50) NOT NULL, "label" character varying(100) NOT NULL, "icon" character varying(50), "baseType" character varying(50) NOT NULL, "configSchema" jsonb DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_905c3b22381f22f26d94d0d4799" PRIMARY KEY ("type"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "response" ("id" SERIAL NOT NULL, "formId" integer NOT NULL, "userId" integer NOT NULL, "organizationId" integer NOT NULL, "answers" jsonb, "status" character varying NOT NULL DEFAULT 'DRAFT', "submittedAt" TIMESTAMP WITH TIME ZONE, "latitude" double precision, "longitude" double precision, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f64544baf2b4dc48ba623ce768f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_roles_role" ("userId" integer NOT NULL, "roleId" integer NOT NULL, CONSTRAINT "PK_b47cd6c84ee205ac5a713718292" PRIMARY KEY ("userId", "roleId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5f9286e6c25594c6b88c108db7" ON "user_roles_role" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4be2f7adf862634f5f803d246b" ON "user_roles_role" ("roleId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_groups_group" ("userId" integer NOT NULL, "groupId" integer NOT NULL, CONSTRAINT "PK_98d481413dbe5578ad2a45ab863" PRIMARY KEY ("userId", "groupId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_84ff6a520aee2bf2512c01cf46" ON "user_groups_group" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8abdfe8f9d78a4f5e821dbf620" ON "user_groups_group" ("groupId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "role" ADD CONSTRAINT "FK_2bcd50772082305f3bcee6b6da4" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group" ADD CONSTRAINT "FK_105c4fcefc250c0e90f3677993b" FOREIGN KEY ("parentId") REFERENCES "group"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group" ADD CONSTRAINT "FK_af805517871fac10130dcad8801" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_dfda472c0af7812401e592b6a61" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_log" ADD CONSTRAINT "FK_36279d1f26f4a280fa4fa4eb3af" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "question" ADD CONSTRAINT "FK_c0dcb2fbd1522ea83d4750de69d" FOREIGN KEY ("sectionId") REFERENCES "section"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "section" ADD CONSTRAINT "FK_324039b20aaa3b78015c756ecf5" FOREIGN KEY ("formId") REFERENCES "form"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "form" ADD CONSTRAINT "FK_fc1feb949b3237cb27f6fe58007" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "form" ADD CONSTRAINT "FK_41a05727e7e2698f596bbd2602e" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "response" ADD CONSTRAINT "FK_882048e20c34ff1b68100024ddd" FOREIGN KEY ("formId") REFERENCES "form"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "response" ADD CONSTRAINT "FK_a5386ec7299fc4d00b8735ecd42" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "response" ADD CONSTRAINT "FK_01773a54bfcc16e58930b967d58" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles_role" ADD CONSTRAINT "FK_5f9286e6c25594c6b88c108db77" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles_role" ADD CONSTRAINT "FK_4be2f7adf862634f5f803d246b8" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_groups_group" ADD CONSTRAINT "FK_84ff6a520aee2bf2512c01cf462" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_groups_group" ADD CONSTRAINT "FK_8abdfe8f9d78a4f5e821dbf6203" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_groups_group" DROP CONSTRAINT "FK_8abdfe8f9d78a4f5e821dbf6203"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_groups_group" DROP CONSTRAINT "FK_84ff6a520aee2bf2512c01cf462"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles_role" DROP CONSTRAINT "FK_4be2f7adf862634f5f803d246b8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles_role" DROP CONSTRAINT "FK_5f9286e6c25594c6b88c108db77"`,
    );
    await queryRunner.query(
      `ALTER TABLE "response" DROP CONSTRAINT "FK_01773a54bfcc16e58930b967d58"`,
    );
    await queryRunner.query(
      `ALTER TABLE "response" DROP CONSTRAINT "FK_a5386ec7299fc4d00b8735ecd42"`,
    );
    await queryRunner.query(
      `ALTER TABLE "response" DROP CONSTRAINT "FK_882048e20c34ff1b68100024ddd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "form" DROP CONSTRAINT "FK_41a05727e7e2698f596bbd2602e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "form" DROP CONSTRAINT "FK_fc1feb949b3237cb27f6fe58007"`,
    );
    await queryRunner.query(
      `ALTER TABLE "section" DROP CONSTRAINT "FK_324039b20aaa3b78015c756ecf5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "question" DROP CONSTRAINT "FK_c0dcb2fbd1522ea83d4750de69d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_log" DROP CONSTRAINT "FK_36279d1f26f4a280fa4fa4eb3af"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_dfda472c0af7812401e592b6a61"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group" DROP CONSTRAINT "FK_af805517871fac10130dcad8801"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group" DROP CONSTRAINT "FK_105c4fcefc250c0e90f3677993b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role" DROP CONSTRAINT "FK_2bcd50772082305f3bcee6b6da4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8abdfe8f9d78a4f5e821dbf620"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_84ff6a520aee2bf2512c01cf46"`,
    );
    await queryRunner.query(`DROP TABLE "user_groups_group"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4be2f7adf862634f5f803d246b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5f9286e6c25594c6b88c108db7"`,
    );
    await queryRunner.query(`DROP TABLE "user_roles_role"`);
    await queryRunner.query(`DROP TABLE "response"`);
    await queryRunner.query(`DROP TABLE "question_types"`);
    await queryRunner.query(`DROP TABLE "form"`);
    await queryRunner.query(`DROP TABLE "section"`);
    await queryRunner.query(`DROP TABLE "question"`);
    await queryRunner.query(`DROP TABLE "audit_log"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "group"`);
    await queryRunner.query(`DROP TABLE "role"`);
    await queryRunner.query(`DROP TABLE "organization"`);
  }
}
