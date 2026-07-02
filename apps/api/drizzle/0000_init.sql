CREATE TYPE "public"."user_role" AS ENUM('owner', 'manager', 'staff');
CREATE TYPE "public"."unit_type" AS ENUM('each', 'pack', 'carton', 'bottle', 'can', 'pouch');
CREATE TYPE "public"."restricted_type" AS ENUM('none', 'alcohol', 'tobacco');
CREATE TYPE "public"."count_type" AS ENUM('full', 'cycle', 'spot');
CREATE TYPE "public"."session_status" AS ENUM('draft', 'in_progress', 'review', 'approved', 'posted');
CREATE TYPE "public"."sync_status" AS ENUM('synced', 'pending', 'failed');
CREATE TYPE "public"."reason_code" AS ENUM('breakage', 'theft_suspected', 'damaged', 'expired', 'receiving_mismatch', 'unknown_shrink', 'open_pack', 'missing', 'other');
CREATE TYPE "public"."audit_action" AS ENUM('login', 'session_created', 'line_counted', 'line_edited', 'reason_code_added', 'recount_requested', 'manager_approved', 'session_posted', 'sync_conflict_resolved', 'product_updated', 'user_updated');
CREATE TYPE "public"."entity_type" AS ENUM('user', 'product', 'count_session', 'count_line', 'approval', 'sync');
CREATE TYPE "public"."sync_operation" AS ENUM('create', 'update', 'delete', 'approve');

CREATE TABLE IF NOT EXISTS "stores" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "code" text NOT NULL UNIQUE,
  "address" text,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "store_id" uuid REFERENCES "stores"("id"),
  "email" text NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "name" text NOT NULL,
  "role" "user_role" DEFAULT 'staff' NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "refresh_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" text NOT NULL,
  "device_id" text,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "store_id" uuid NOT NULL REFERENCES "stores"("id"),
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "parent_id" uuid,
  "restricted_category" boolean DEFAULT false NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "locations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "store_id" uuid NOT NULL REFERENCES "stores"("id"),
  "name" text NOT NULL,
  "code" text NOT NULL,
  "description" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "products" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "store_id" uuid NOT NULL REFERENCES "stores"("id"),
  "sku" text NOT NULL,
  "name" text NOT NULL,
  "category_id" uuid NOT NULL REFERENCES "categories"("id"),
  "subcategory" text,
  "brand" text,
  "unit_type" "unit_type" DEFAULT 'each' NOT NULL,
  "barcode_primary" text,
  "restricted_category" boolean DEFAULT false NOT NULL,
  "restricted_type" "restricted_type" DEFAULT 'none' NOT NULL,
  "expected_qty" real DEFAULT 0 NOT NULL,
  "reorder_level" real DEFAULT 0 NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "image_url" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "product_barcodes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "barcode" text NOT NULL UNIQUE,
  "is_primary" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "inventory_snapshots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "store_id" uuid NOT NULL REFERENCES "stores"("id"),
  "product_id" uuid NOT NULL REFERENCES "products"("id"),
  "location_id" uuid REFERENCES "locations"("id"),
  "quantity" real DEFAULT 0 NOT NULL,
  "snapshot_at" timestamptz DEFAULT now() NOT NULL,
  "source" text DEFAULT 'manual' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "count_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "store_id" uuid NOT NULL REFERENCES "stores"("id"),
  "session_name" text NOT NULL,
  "count_type" "count_type" NOT NULL,
  "status" "session_status" DEFAULT 'draft' NOT NULL,
  "created_by" uuid NOT NULL REFERENCES "users"("id"),
  "assigned_to" jsonb DEFAULT '[]' NOT NULL,
  "category_ids" jsonb DEFAULT '[]' NOT NULL,
  "location_ids" jsonb DEFAULT '[]' NOT NULL,
  "started_at" timestamptz,
  "submitted_at" timestamptz,
  "approved_at" timestamptz,
  "notes" text,
  "sync_status" "sync_status" DEFAULT 'synced' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "count_session_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL REFERENCES "count_sessions"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "category_id" uuid REFERENCES "categories"("id"),
  "location_id" uuid REFERENCES "locations"("id"),
  "completed" boolean DEFAULT false NOT NULL,
  "completed_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "count_lines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL REFERENCES "count_sessions"("id") ON DELETE CASCADE,
  "product_id" uuid NOT NULL REFERENCES "products"("id"),
  "location_id" uuid NOT NULL REFERENCES "locations"("id"),
  "expected_qty" real DEFAULT 0 NOT NULL,
  "counted_qty" real,
  "variance_qty" real,
  "variance_percent" real,
  "entered_by" uuid REFERENCES "users"("id"),
  "entered_at" timestamptz,
  "last_edited_by" uuid REFERENCES "users"("id"),
  "last_edited_at" timestamptz,
  "note" text,
  "reason_code" "reason_code",
  "requires_approval" boolean DEFAULT false NOT NULL,
  "approved" boolean DEFAULT false NOT NULL,
  "approved_by" uuid REFERENCES "users"("id"),
  "approved_at" timestamptz,
  "sync_status" "sync_status" DEFAULT 'synced' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "approvals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid REFERENCES "count_sessions"("id"),
  "line_id" uuid REFERENCES "count_lines"("id"),
  "approved_by" uuid NOT NULL REFERENCES "users"("id"),
  "approved_at" timestamptz DEFAULT now() NOT NULL,
  "notes" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "audit_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "entity_type" "entity_type" NOT NULL,
  "entity_id" text NOT NULL,
  "action" "audit_action" NOT NULL,
  "old_value" jsonb,
  "new_value" jsonb,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "timestamp" timestamptz DEFAULT now() NOT NULL,
  "device_id" text,
  "offline" boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS "sync_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "device_id" text NOT NULL,
  "operation" "sync_operation" NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" text NOT NULL,
  "payload" jsonb NOT NULL,
  "client_timestamp" timestamptz NOT NULL,
  "server_timestamp" timestamptz DEFAULT now() NOT NULL,
  "status" "sync_status" DEFAULT 'synced' NOT NULL,
  "error_message" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "unresolved_scans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL REFERENCES "count_sessions"("id") ON DELETE CASCADE,
  "location_id" uuid NOT NULL REFERENCES "locations"("id"),
  "barcode" text NOT NULL,
  "scanned_by" uuid NOT NULL REFERENCES "users"("id"),
  "scanned_at" timestamptz DEFAULT now() NOT NULL,
  "resolved" boolean DEFAULT false NOT NULL
);

CREATE INDEX IF NOT EXISTS "users_store_idx" ON "users" ("store_id");
CREATE INDEX IF NOT EXISTS "products_sku_idx" ON "products" ("sku");
CREATE INDEX IF NOT EXISTS "products_restricted_idx" ON "products" ("restricted_category", "restricted_type");
CREATE INDEX IF NOT EXISTS "product_barcodes_barcode_idx" ON "product_barcodes" ("barcode");
CREATE INDEX IF NOT EXISTS "count_sessions_status_idx" ON "count_sessions" ("status");
CREATE INDEX IF NOT EXISTS "count_lines_session_idx" ON "count_lines" ("session_id");
CREATE INDEX IF NOT EXISTS "count_lines_requires_approval_idx" ON "count_lines" ("requires_approval");
CREATE INDEX IF NOT EXISTS "audit_events_timestamp_idx" ON "audit_events" ("timestamp");
CREATE UNIQUE INDEX IF NOT EXISTS "products_store_sku_idx" ON "products" ("store_id", "sku");
CREATE UNIQUE INDEX IF NOT EXISTS "count_lines_session_product_location_idx" ON "count_lines" ("session_id", "product_id", "location_id");
