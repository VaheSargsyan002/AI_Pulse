CREATE TYPE "public"."document_status" AS ENUM('processing', 'ready', 'error');--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text,
	"type" text,
	"title" text NOT NULL,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"original_name" text NOT NULL,
	"type" text NOT NULL,
	"size" integer NOT NULL,
	"extracted_text" text DEFAULT '' NOT NULL,
	"chunks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "document_status" DEFAULT 'processing' NOT NULL,
	"error" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
