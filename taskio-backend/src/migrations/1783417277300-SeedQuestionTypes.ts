import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedQuestionTypes1783417277300 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "question_types" (
              "type" character varying(50) NOT NULL,
              "label" character varying(100) NOT NULL,
              "icon" character varying(50),
              "baseType" character varying(50) NOT NULL,
              "configSchema" jsonb DEFAULT '{}',
              "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
              "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
              CONSTRAINT "PK_question_types_type" PRIMARY KEY ("type")
            )
        `);
      
        const questionTypes = [
            { type: 'text', label: 'Short Text', icon: '📝', baseType: 'TEXT', configSchema: '{}' },
            { type: 'textarea', label: 'Long Text', icon: '📄', baseType: 'TEXT', configSchema: '{}' },
            { type: 'radio', label: 'Multiple Choice', icon: '🔘', baseType: 'SINGLE_CHOICE', configSchema: '{}' },
            { type: 'checkbox', label: 'Checkboxes', icon: '☑️', baseType: 'MULTI_CHOICE', configSchema: '{}' },
            { type: 'select', label: 'Dropdown', icon: '🔽', baseType: 'SINGLE_CHOICE', configSchema: '{}' },
            { type: 'date', label: 'Date', icon: '📅', baseType: 'DATE', configSchema: '{}' },
            { type: 'number', label: 'Number', icon: '🔢', baseType: 'NUMBER', configSchema: '{}' },
            { type: 'email', label: 'Email', icon: '📧', baseType: 'EMAIL', configSchema: '{}' },
            { type: 'file', label: 'File Upload', icon: '📎', baseType: 'FILE_UPLOAD', configSchema: '{}' }
        ];
      
        for (const qt of questionTypes) {
            await queryRunner.query(
              `INSERT INTO "question_types" ("type", "label", "icon", "baseType", "configSchema", "createdAt", "updatedAt") 
               VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
               ON CONFLICT ("type") DO NOTHING`,
              [qt.type, qt.label, qt.icon, qt.baseType, qt.configSchema],
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DELETE FROM "question_types" WHERE "type" IN ('text', 'textarea', 'radio', 'checkbox', 'select', 'date', 'number', 'email', 'file')`,
        );
        await queryRunner.query(`DROP TABLE IF EXISTS "question_types"`);
    }

}
