import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTemplate1783422351464 implements MigrationInterface {
    name = 'CreateTemplate1783422351464'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "template" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "snapshot" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "createdById" integer, CONSTRAINT "PK_fbae2ac36bd9b5e1e793b957b7f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "template" ADD CONSTRAINT "FK_55980b6e1dfe1c22667845f3b9a" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "template" DROP CONSTRAINT "FK_55980b6e1dfe1c22667845f3b9a"`);
        await queryRunner.query(`DROP TABLE "template"`);
    }

}
