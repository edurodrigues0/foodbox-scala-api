ALTER TABLE "collaborators" RENAME TO "collaborators";--> statement-breakpoint
ALTER TABLE "collaborators" DROP CONSTRAINT "collaborators_registration_unique";--> statement-breakpoint
ALTER TABLE "collaborators" DROP CONSTRAINT "collaborators_cpf_unique";--> statement-breakpoint
ALTER TABLE "collaborators" DROP CONSTRAINT "collaborators_sector_id_sectors_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_colaborator_id_collaborators_id_fk";
--> statement-breakpoint
ALTER TABLE "collaborators" ADD CONSTRAINT "collaborators_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_colaborator_id_collaborators_id_fk" FOREIGN KEY ("colaborator_id") REFERENCES "public"."collaborators"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborators" ADD CONSTRAINT "collaborators_registration_unique" UNIQUE("registration");--> statement-breakpoint
ALTER TABLE "collaborators" ADD CONSTRAINT "collaborators_cpf_unique" UNIQUE("cpf");