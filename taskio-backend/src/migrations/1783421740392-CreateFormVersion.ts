import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFormVersion1783421740392 implements MigrationInterface {
  name = 'CreateFormVersion1783421740392';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "form_version" ("id" SERIAL NOT NULL, "formId" integer NOT NULL, "version" integer NOT NULL, "snapshot" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "createdById" integer, CONSTRAINT "PK_5992da09af1567a95aec97bcf9f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_version" ADD CONSTRAINT "FK_44608345423f87e3010ab1ee240" FOREIGN KEY ("formId") REFERENCES "form"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_version" ADD CONSTRAINT "FK_cedd6eefab647fdd855b1da7826" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "form_version" DROP CONSTRAINT "FK_cedd6eefab647fdd855b1da7826"`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_version" DROP CONSTRAINT "FK_44608345423f87e3010ab1ee240"`,
    );
    await queryRunner.query(`DROP TABLE "form_version"`);
  }
}
