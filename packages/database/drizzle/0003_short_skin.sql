ALTER TABLE "users" ADD COLUMN "location" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "education_level" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "school" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "area_of_study" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "looking_for" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_completed_at" timestamp with time zone;