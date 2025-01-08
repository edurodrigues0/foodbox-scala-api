CREATE TYPE "public"."role" AS ENUM('admin', 'rh', 'supervisor', 'restaurant');--> statement-breakpoint
CREATE TABLE "colaborators" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"registration" serial NOT NULL,
	"cpf" text NOT NULL,
	"hmac_cpf" text NOT NULL,
	"sector_id" text DEFAULT '1',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "colaborators_registration_unique" UNIQUE("registration"),
	CONSTRAINT "colaborators_cpf_unique" UNIQUE("cpf"),
	CONSTRAINT "colaborators_hmac_cpf_unique" UNIQUE("hmac_cpf")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(100) NOT NULL,
	"password" varchar NOT NULL,
	"role" "role" DEFAULT 'supervisor' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"manager_id" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menus" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(40) NOT NULL,
	"service_date" timestamp NOT NULL,
	"description" text[] NOT NULL,
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
	"price" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unitys" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(24) NOT NULL,
	"unity" integer,
	"restaurant_id" text,
	CONSTRAINT "unitys_unity_unique" UNIQUE("unity")
);
--> statement-breakpoint
CREATE TABLE "sectors" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(24) NOT NULL,
	"unity_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "colaborators" ADD CONSTRAINT "colaborators_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menus" ADD CONSTRAINT "menus_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_colaborator_id_colaborators_id_fk" FOREIGN KEY ("colaborator_id") REFERENCES "public"."colaborators"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unitys" ADD CONSTRAINT "unitys_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sectors" ADD CONSTRAINT "sectors_unity_id_unitys_id_fk" FOREIGN KEY ("unity_id") REFERENCES "public"."unitys"("id") ON DELETE cascade ON UPDATE no action;