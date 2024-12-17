CREATE TABLE "colaborators" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"cpf" text NOT NULL,
	"hmac_cpf" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "colaborators_cpf_unique" UNIQUE("cpf"),
	CONSTRAINT "colaborators_hmac_cpf_unique" UNIQUE("hmac_cpf")
);
