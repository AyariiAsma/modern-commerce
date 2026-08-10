-- ============================================================
-- Migration 009: TVA System, Financial Snapshots & Fidelity Overhaul
-- ============================================================

-- 1. Add TVA rate to products (REAL default is ok)
ALTER TABLE products ADD COLUMN tva_rate REAL DEFAULT 0;

-- 2. Add full financial snapshot to order_items
ALTER TABLE order_items ADD COLUMN unit_price_ht     REAL;
ALTER TABLE order_items ADD COLUMN tva_rate          REAL DEFAULT 0;
ALTER TABLE order_items ADD COLUMN tva_amount        REAL DEFAULT 0;
ALTER TABLE order_items ADD COLUMN unit_price_ttc    REAL;
ALTER TABLE order_items ADD COLUMN discount_amount   REAL DEFAULT 0;
ALTER TABLE order_items ADD COLUMN total_ht          REAL;
ALTER TABLE order_items ADD COLUMN total_ttc         REAL;
ALTER TABLE order_items ADD COLUMN product_image     TEXT;

-- 3. Add full financial totals snapshot to orders
ALTER TABLE orders ADD COLUMN subtotal_ht        REAL DEFAULT 0;
ALTER TABLE orders ADD COLUMN total_discount     REAL DEFAULT 0;
ALTER TABLE orders ADD COLUMN total_ht           REAL DEFAULT 0;
ALTER TABLE orders ADD COLUMN total_tva          REAL DEFAULT 0;
ALTER TABLE orders ADD COLUMN fidelity_discount  REAL DEFAULT 0;
ALTER TABLE orders ADD COLUMN fidelity_code      TEXT;
ALTER TABLE orders ADD COLUMN total_ttc          REAL DEFAULT 0;
ALTER TABLE orders ADD COLUMN total_paid         REAL DEFAULT 0;

-- 4. Expand loyalty_settings with full fidelity configuration
ALTER TABLE loyalty_settings ADD COLUMN fidelity_enabled      INTEGER DEFAULT 1;
ALTER TABLE loyalty_settings ADD COLUMN required_amount       REAL DEFAULT 150.0;
ALTER TABLE loyalty_settings ADD COLUMN qualifying_statuses   TEXT;
ALTER TABLE loyalty_settings ADD COLUMN amount_method         TEXT;
ALTER TABLE loyalty_settings ADD COLUMN notify_days_before    TEXT;
ALTER TABLE loyalty_settings ADD COLUMN min_purchase_amount   REAL DEFAULT 0;

-- 5. Expand loyalty_progress with dual-condition tracking and milestones
ALTER TABLE loyalty_progress ADD COLUMN qualifying_amount      REAL DEFAULT 0;
ALTER TABLE loyalty_progress ADD COLUMN milestone_count        INTEGER DEFAULT 0;
ALTER TABLE loyalty_progress ADD COLUMN last_qualifying_order  INTEGER;
ALTER TABLE loyalty_progress ADD COLUMN updated_at             DATETIME;

-- 6. Expand loyalty_codes with richer metadata
ALTER TABLE loyalty_codes ADD COLUMN qualifying_order_count   INTEGER;
ALTER TABLE loyalty_codes ADD COLUMN qualifying_order_amount  REAL;
ALTER TABLE loyalty_codes ADD COLUMN milestone_number         INTEGER;
ALTER TABLE loyalty_codes ADD COLUMN used_order_id            INTEGER;

-- 7. Loyalty notifications tracking
CREATE TABLE IF NOT EXISTS loyalty_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    loyalty_code_id INTEGER NOT NULL,
    notification_type TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (loyalty_code_id) REFERENCES loyalty_codes(id) ON DELETE CASCADE
);

-- 8. Seed default values for new loyalty_settings columns
UPDATE loyalty_settings SET
    qualifying_statuses = '["Delivered"]',
    amount_method       = 'total_ht_excl_shipping',
    notify_days_before  = '[10,5,1]',
    fidelity_enabled    = 1
WHERE qualifying_statuses IS NULL;

-- 9. Backfill financial totals on existing orders (best effort for legacy data)
UPDATE orders SET
    subtotal_ht    = subtotal,
    total_ht       = subtotal - discount,
    total_tva      = 0,
    total_ttc      = total,
    total_paid     = total,
    total_discount = discount
WHERE subtotal_ht IS NULL OR subtotal_ht = 0;

-- 10. Backfill order_items financial snapshot (best effort)
UPDATE order_items SET
    unit_price_ht   = unit_price,
    unit_price_ttc  = unit_price,
    total_ht        = total_price,
    total_ttc       = total_price
WHERE unit_price_ht IS NULL;
