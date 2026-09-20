CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"website_url" text,
	"logo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"title" varchar(500) NOT NULL,
	"slug" varchar(500) NOT NULL,
	"summary" text,
	"description" text,
	"application_url" text NOT NULL,
	"source_url" text NOT NULL,
	"application_deadline" timestamp with time zone,
	"work_mode" varchar(20),
	"work_authorization" varchar(50),
	"external_id" varchar(255),
	"source_type" varchar(20),
	"source_name" varchar(255),
	"posted_at" timestamp with time zone,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_verified_at" timestamp with time zone,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "opportunities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "opportunity_compensation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"compensation_type" varchar(30),
	"is_paid" boolean,
	"min_amount" numeric(12, 2),
	"max_amount" numeric(12, 2),
	"currency" char(3) DEFAULT 'USD',
	"period" varchar(20),
	"raw_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "opportunity_compensation_opportunity_id_unique" UNIQUE("opportunity_id")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" "smallserial" PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name"),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city" varchar(150),
	"state_region" varchar(150),
	"country" varchar(100) NOT NULL,
	"country_code" char(2),
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6)
);
--> statement-breakpoint
CREATE TABLE "fields" (
	"id" "smallserial" PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(150) NOT NULL,
	CONSTRAINT "fields_name_unique" UNIQUE("name"),
	CONSTRAINT "fields_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "education_levels" (
	"id" "smallserial" PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"sort_order" smallint,
	CONSTRAINT "education_levels_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "opportunity_categories" (
	"opportunity_id" uuid NOT NULL,
	"category_id" smallint NOT NULL,
	CONSTRAINT "opportunity_categories_opportunity_id_category_id_pk" PRIMARY KEY("opportunity_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "opportunity_locations" (
	"opportunity_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	CONSTRAINT "opportunity_locations_opportunity_id_location_id_pk" PRIMARY KEY("opportunity_id","location_id")
);
--> statement-breakpoint
CREATE TABLE "opportunity_fields" (
	"opportunity_id" uuid NOT NULL,
	"field_id" smallint NOT NULL,
	CONSTRAINT "opportunity_fields_opportunity_id_field_id_pk" PRIMARY KEY("opportunity_id","field_id")
);
--> statement-breakpoint
CREATE TABLE "opportunity_education_levels" (
	"opportunity_id" uuid NOT NULL,
	"education_level_id" smallint NOT NULL,
	CONSTRAINT "opportunity_education_levels_opportunity_id_education_level_id_pk" PRIMARY KEY("opportunity_id","education_level_id")
);
--> statement-breakpoint
CREATE TABLE "saved_opportunities" (
	"user_id" uuid NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_opportunities_user_id_opportunity_id_pk" PRIMARY KEY("user_id","opportunity_id")
);
--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_compensation" ADD CONSTRAINT "opportunity_compensation_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_categories" ADD CONSTRAINT "opportunity_categories_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_categories" ADD CONSTRAINT "opportunity_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_locations" ADD CONSTRAINT "opportunity_locations_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_locations" ADD CONSTRAINT "opportunity_locations_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_fields" ADD CONSTRAINT "opportunity_fields_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_fields" ADD CONSTRAINT "opportunity_fields_field_id_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."fields"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_education_levels" ADD CONSTRAINT "opportunity_education_levels_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_education_levels" ADD CONSTRAINT "opportunity_education_levels_education_level_id_education_levels_id_fk" FOREIGN KEY ("education_level_id") REFERENCES "public"."education_levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_opportunities" ADD CONSTRAINT "saved_opportunities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_opportunities" ADD CONSTRAINT "saved_opportunities_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "opportunities_source_name_external_id_unique" ON "opportunities" USING btree ("source_name","external_id") WHERE "opportunities"."source_name" IS NOT NULL AND "opportunities"."external_id" IS NOT NULL;