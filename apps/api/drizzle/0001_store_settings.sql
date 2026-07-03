ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "timezone" text DEFAULT 'America/New_York' NOT NULL;

CREATE TABLE IF NOT EXISTS "store_settings" (
  "store_id" uuid PRIMARY KEY REFERENCES "stores"("id") ON DELETE CASCADE,
  "variance_auto_approve_percent" real DEFAULT 10 NOT NULL,
  "variance_auto_approve_percent_restricted" real DEFAULT 5 NOT NULL,
  "variance_auto_approve_qty_restricted" real DEFAULT 2 NOT NULL,
  "default_count_type" "count_type" DEFAULT 'cycle' NOT NULL,
  "notify_restricted_variance" boolean DEFAULT true NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
