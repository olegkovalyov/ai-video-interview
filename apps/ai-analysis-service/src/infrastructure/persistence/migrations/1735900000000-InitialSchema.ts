import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1735900000000 implements MigrationInterface {
  name = 'InitialSchema1735900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "analysis_results_status_enum" AS ENUM ('pending', 'in_progress', 'completed', 'failed')
    `);

    await queryRunner.query(`
      CREATE TYPE "analysis_results_recommendation_enum" AS ENUM ('hire', 'consider', 'reject')
    `);

    await queryRunner.query(`
      CREATE TYPE "question_analyses_question_type_enum" AS ENUM ('text', 'multiple_choice', 'video', 'code')
    `);

    await queryRunner.query(`
      CREATE TABLE "analysis_results" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "invitation_id" varchar(255) NOT NULL,
        "candidate_id" varchar(255) NOT NULL,
        "template_id" varchar(255) NOT NULL,
        "template_title" varchar(500) NOT NULL,
        "company_name" varchar(255) NOT NULL,
        "status" "analysis_results_status_enum" NOT NULL DEFAULT 'pending',
        "overall_score" int,
        "summary" text,
        "strengths" jsonb NOT NULL DEFAULT '[]',
        "weaknesses" jsonb NOT NULL DEFAULT '[]',
        "recommendation" "analysis_results_recommendation_enum",
        "error_message" text,
        "model_used" varchar(100),
        "total_tokens_used" int NOT NULL DEFAULT 0,
        "processing_time_ms" int NOT NULL DEFAULT 0,
        "language" varchar(10) NOT NULL DEFAULT 'en',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "completed_at" TIMESTAMP,
        CONSTRAINT "UQ_analysis_results_invitation_id" UNIQUE ("invitation_id"),
        CONSTRAINT "PK_analysis_results" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_analysis_results_invitation_id" ON "analysis_results" ("invitation_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_analysis_results_candidate_id" ON "analysis_results" ("candidate_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_analysis_results_status" ON "analysis_results" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_analysis_results_created_at" ON "analysis_results" ("created_at")
    `);

    await queryRunner.query(`
      CREATE TABLE "question_analyses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "analysis_result_id" uuid NOT NULL,
        "question_id" varchar(255) NOT NULL,
        "question_text" text NOT NULL,
        "question_type" "question_analyses_question_type_enum" NOT NULL,
        "response_text" text NOT NULL,
        "score" int NOT NULL,
        "feedback" text NOT NULL,
        "criteria_scores" jsonb NOT NULL DEFAULT '[]',
        "is_correct" boolean,
        "tokens_used" int NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_question_analyses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_question_analyses_analysis_result" FOREIGN KEY ("analysis_result_id") 
          REFERENCES "analysis_results"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_question_analyses_analysis_result_id" ON "question_analyses" ("analysis_result_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "processed_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "event_id" varchar(255) NOT NULL,
        "service_name" varchar(100) NOT NULL DEFAULT 'ai-analysis-service',
        "processed_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_processed_events_event_service" UNIQUE ("event_id", "service_name"),
        CONSTRAINT "PK_processed_events" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_processed_events_event_id" ON "processed_events" ("event_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_processed_events_event_id"`);
    await queryRunner.query(`DROP TABLE "processed_events"`);
    await queryRunner.query(`DROP INDEX "IDX_question_analyses_analysis_result_id"`);
    await queryRunner.query(`DROP TABLE "question_analyses"`);
    await queryRunner.query(`DROP INDEX "IDX_analysis_results_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_analysis_results_status"`);
    await queryRunner.query(`DROP INDEX "IDX_analysis_results_candidate_id"`);
    await queryRunner.query(`DROP INDEX "IDX_analysis_results_invitation_id"`);
    await queryRunner.query(`DROP TABLE "analysis_results"`);
    await queryRunner.query(`DROP TYPE "question_analyses_question_type_enum"`);
    await queryRunner.query(`DROP TYPE "analysis_results_recommendation_enum"`);
    await queryRunner.query(`DROP TYPE "analysis_results_status_enum"`);
  }
}
