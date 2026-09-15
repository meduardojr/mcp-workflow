CREATE TABLE "agents" (
	"id" text NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"emoji" text NOT NULL,
	"capabilities" jsonb DEFAULT '[]' NOT NULL,
	"status" text NOT NULL,
	"version" text NOT NULL,
	"model" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "execution_events" (
	"id" text PRIMARY KEY,
	"run_id" text NOT NULL,
	"workflow_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"node_id" text,
	"agent_id" text,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "runs" (
	"id" text PRIMARY KEY,
	"workflow_id" text NOT NULL,
	"workflow_version" integer NOT NULL,
	"owner_id" text NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workflow_versions" (
	"id" text PRIMARY KEY,
	"workflow_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"version" integer NOT NULL,
	"definition" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" text NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"execution_mode" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"nodes" jsonb DEFAULT '[]' NOT NULL,
	"edges" jsonb DEFAULT '[]' NOT NULL,
	"schedule" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "agents_owner_id_uidx" ON "agents" ("owner_id","id");--> statement-breakpoint
CREATE INDEX "agents_owner_idx" ON "agents" ("owner_id");--> statement-breakpoint
CREATE INDEX "events_owner_run_idx" ON "execution_events" ("owner_id","run_id");--> statement-breakpoint
CREATE INDEX "runs_owner_workflow_idx" ON "runs" ("owner_id","workflow_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_versions_unique_idx" ON "workflow_versions" ("owner_id","workflow_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "workflows_owner_id_uidx" ON "workflows" ("owner_id","id");--> statement-breakpoint
CREATE INDEX "workflows_owner_idx" ON "workflows" ("owner_id");