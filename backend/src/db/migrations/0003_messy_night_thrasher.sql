ALTER TABLE "tournament_templates" ALTER COLUMN "is_active" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;