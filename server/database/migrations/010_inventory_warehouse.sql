-- 1. Rebuild Users table for WAREHOUSE role
CREATE TABLE IF NOT EXISTS new_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    role TEXT CHECK(role IN ('customer', 'admin', 'warehouse')) NOT NULL DEFAULT 'customer',
    status TEXT CHECK(status IN ('active', 'inactive')) NOT NULL DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO new_users (id, name, email, password, phone, role, status, created_at, updated_at)
SELECT id, name, email, password, phone, role, status, created_at, updated_at FROM users;

DROP TABLE users;
ALTER TABLE new_users RENAME TO users;

-- 2. Add barcode to products
ALTER TABLE products ADD COLUMN barcode TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;

-- 3. Add prepared_quantity to order_items for warehouse packing
ALTER TABLE order_items ADD COLUMN prepared_quantity INTEGER NOT NULL DEFAULT 0;
