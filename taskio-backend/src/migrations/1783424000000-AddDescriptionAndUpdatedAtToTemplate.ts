import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDescriptionAndUpdatedAtToTemplate1783424000000 implements MigrationInterface {
  name = 'AddDescriptionAndUpdatedAtToTemplate1783424000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "template" ADD COLUMN IF NOT EXISTS "description" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "template" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "template" DROP COLUMN IF EXISTS "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template" DROP COLUMN IF EXISTS "description"`,
    );
  }
}
