import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!dbInstance) {
    const sqlite = SQLite.openDatabaseSync('shopcount.db');
    dbInstance = drizzle(sqlite, { schema });
    initTables(sqlite);
  }
  return dbInstance;
}

function initTables(sqlite: SQLite.SQLiteDatabase) {
  sqlite.execSync(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, store_id TEXT NOT NULL, sku TEXT NOT NULL, name TEXT NOT NULL,
      category_id TEXT NOT NULL, subcategory TEXT, brand TEXT, unit_type TEXT NOT NULL,
      barcode_primary TEXT, barcode_alternates TEXT,
      restricted_category INTEGER NOT NULL DEFAULT 0, restricted_type TEXT NOT NULL DEFAULT 'none',
      expected_qty REAL NOT NULL DEFAULT 0, reorder_level REAL NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1, image_url TEXT, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY, store_id TEXT NOT NULL, name TEXT NOT NULL, slug TEXT NOT NULL,
      restricted_category INTEGER NOT NULL DEFAULT 0, sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY, store_id TEXT NOT NULL, name TEXT NOT NULL, code TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS count_sessions (
      id TEXT PRIMARY KEY, store_id TEXT NOT NULL, session_name TEXT NOT NULL, count_type TEXT NOT NULL,
      status TEXT NOT NULL, created_by TEXT NOT NULL, assigned_to TEXT NOT NULL,
      category_ids TEXT NOT NULL, location_ids TEXT NOT NULL,
      started_at TEXT, submitted_at TEXT, approved_at TEXT, notes TEXT,
      sync_status TEXT NOT NULL DEFAULT 'synced', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS count_lines (
      id TEXT PRIMARY KEY, session_id TEXT NOT NULL, product_id TEXT NOT NULL, location_id TEXT NOT NULL,
      expected_qty REAL NOT NULL DEFAULT 0, counted_qty REAL, variance_qty REAL, variance_percent REAL,
      entered_by TEXT, entered_at TEXT, last_edited_by TEXT, last_edited_at TEXT,
      note TEXT, reason_code TEXT, requires_approval INTEGER NOT NULL DEFAULT 0,
      approved INTEGER NOT NULL DEFAULT 0, sync_status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY, operation TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
      payload TEXT NOT NULL, client_timestamp TEXT NOT NULL, device_id TEXT NOT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'pending'
    );
    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, action TEXT NOT NULL,
      old_value TEXT, new_value TEXT, user_id TEXT NOT NULL, timestamp TEXT NOT NULL,
      device_id TEXT, offline INTEGER NOT NULL DEFAULT 0, sync_status TEXT NOT NULL DEFAULT 'pending'
    );
    CREATE TABLE IF NOT EXISTS unresolved_scans (
      id TEXT PRIMARY KEY, session_id TEXT NOT NULL, location_id TEXT NOT NULL, barcode TEXT NOT NULL,
      scanned_at TEXT NOT NULL, scanned_by TEXT NOT NULL, sync_status TEXT NOT NULL DEFAULT 'pending'
    );
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode_primary);
    CREATE INDEX IF NOT EXISTS idx_count_lines_session ON count_lines(session_id);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
  `);
}

export { schema };
