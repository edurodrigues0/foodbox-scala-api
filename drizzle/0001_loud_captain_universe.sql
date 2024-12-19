CREATE TABLE "menus" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(40) NOT NULL,
	"service_date" timestamp NOT NULL,
	"description" text NOT NULL,
	"restaurant_id" text NOT NULL,
	"allergens" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"colaborator_id" text NOT NULL,
	"menu_id" text NOT NULL,
	"orderDate" timestamp NOT NULL,
	"price" numeric NOT NULL
);
--> statement-breakpoint
ALTER TABLE "menus" ADD CONSTRAINT "menus_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_colaborator_id_colaborators_id_fk" FOREIGN KEY ("colaborator_id") REFERENCES "public"."colaborators"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE no action ON UPDATE no action;