CREATE TABLE "tournament_results" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "template_id" uuid NOT NULL REFERENCES "tournament_templates"("id") ON DELETE cascade,
  "matches" jsonb NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX "tournamentResults_templateId_idx" ON "tournament_results"("template_id");