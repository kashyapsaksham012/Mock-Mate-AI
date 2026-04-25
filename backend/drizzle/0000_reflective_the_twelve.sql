CREATE TABLE IF NOT EXISTS "resume_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE cascade,
	"full_name" text,
	"email" text,
	"current_role" text,
	"experience" text,
	"skills" text[],
	"primary_domain" text,
	"target_role" text,
	"file_url" text,
	"parser_source" text,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_resume_profiles_user_id" ON "resume_profiles" USING btree ("user_id");