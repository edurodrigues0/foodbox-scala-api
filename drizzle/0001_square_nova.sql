ALTER TABLE "restaurants" ADD COLUMN "unit_id" text;--> statement-breakpoint
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_unit_id_unitys_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."unitys"("id") ON DELETE cascade ON UPDATE no action;