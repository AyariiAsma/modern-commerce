-- 1. Store Configuration & Locations
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    setting_group TEXT,
    description TEXT
);

CREATE TABLE IF NOT EXISTS countries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    status TEXT CHECK(status IN ('active', 'inactive')) NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT CHECK(status IN ('active', 'inactive')) NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS zone_countries (
    zone_id INTEGER,
    country_id INTEGER,
    PRIMARY KEY (zone_id, country_id),
    FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE CASCADE,
    FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE
);

-- 2. Advanced Stock Management
CREATE TABLE IF NOT EXISTS stock_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('GLOBAL', 'COUNTRY', 'ZONE')) NOT NULL DEFAULT 'GLOBAL',
    reference_id INTEGER DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    location_id INTEGER NOT NULL,
    real_stock INTEGER NOT NULL DEFAULT 0,
    reserved_stock INTEGER NOT NULL DEFAULT 0,
    UNIQUE(product_id, location_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES stock_locations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    location_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    movement_type TEXT CHECK(movement_type IN ('addition', 'deduction')) NOT NULL,
    reason TEXT,
    reference_type TEXT,
    reference_id INTEGER,
    previous_real_stock INTEGER NOT NULL,
    new_real_stock INTEGER NOT NULL,
    previous_reserved_stock INTEGER NOT NULL,
    new_reserved_stock INTEGER NOT NULL,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES stock_locations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Promotions & History
CREATE TABLE IF NOT EXISTS promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK(type IN ('promotion', 'happy_hour', 'flash_sale', 'discount')) NOT NULL,
    status TEXT CHECK(status IN ('active', 'inactive')) NOT NULL DEFAULT 'active',
    start_datetime DATETIME,
    end_datetime DATETIME,
    priority INTEGER DEFAULT 0,
    discount_type TEXT CHECK(discount_type IN ('percentage', 'fixed', 'special_price')) NOT NULL,
    discount_value REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promotion_targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    promotion_id INTEGER NOT NULL,
    target_type TEXT CHECK(target_type IN ('product', 'category')) NOT NULL,
    target_id INTEGER NOT NULL,
    UNIQUE(promotion_id, target_type, target_id),
    FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS price_histories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    original_price REAL NOT NULL,
    promotional_price REAL,
    promotion_id INTEGER,
    start_datetime DATETIME,
    end_datetime DATETIME,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. Order Lifecycle & Documents
CREATE TABLE IF NOT EXISTS order_status_histories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by INTEGER,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    invoice_number TEXT UNIQUE NOT NULL,
    invoice_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK(status IN ('generated', 'sent', 'paid', 'cancelled')) NOT NULL DEFAULT 'generated',
    subtotal REAL NOT NULL,
    discount REAL NOT NULL DEFAULT 0.0,
    tax REAL NOT NULL DEFAULT 0.0,
    shipping REAL NOT NULL,
    total REAL NOT NULL,
    pdf_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS invoice_amendments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_invoice_id INTEGER NOT NULL,
    new_invoice_id INTEGER,
    reason TEXT NOT NULL,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (original_invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (new_invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS credit_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    credit_note_number TEXT UNIQUE NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    reason TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT CHECK(status IN ('draft', 'issued', 'used', 'cancelled')) NOT NULL DEFAULT 'draft',
    pdf_path TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE RESTRICT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. Loyalty & Fidelity
CREATE TABLE IF NOT EXISTS loyalty_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    required_orders INTEGER NOT NULL DEFAULT 5,
    code_expiration_days INTEGER NOT NULL DEFAULT 30,
    code_format TEXT NOT NULL DEFAULT 'FID-{RANDOM}',
    discount_type TEXT CHECK(discount_type IN ('percentage', 'fixed')) NOT NULL DEFAULT 'percentage',
    discount_value REAL NOT NULL DEFAULT 10.0,
    usage_limit INTEGER NOT NULL DEFAULT 1,
    is_single_use INTEGER CHECK(is_single_use IN (0, 1)) NOT NULL DEFAULT 1,
    count_cancelled INTEGER CHECK(count_cancelled IN (0, 1)) NOT NULL DEFAULT 0,
    count_refunded INTEGER CHECK(count_refunded IN (0, 1)) NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loyalty_progress (
    customer_id INTEGER PRIMARY KEY,
    eligible_orders_count INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS loyalty_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    qualifying_order_id INTEGER,
    code TEXT UNIQUE NOT NULL,
    status TEXT CHECK(status IN ('active', 'used', 'expired', 'cancelled')) NOT NULL DEFAULT 'active',
    used_date DATETIME,
    expiration_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (qualifying_order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- 6. Categories modification
ALTER TABLE categories ADD COLUMN thumbnail TEXT;
ALTER TABLE categories ADD COLUMN alt_text TEXT;

-- Initial data for Stock Management
INSERT INTO stock_locations (name, type) VALUES ('Main Warehouse', 'GLOBAL');

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, setting_group, description) 
VALUES ('stock_mode', 'GLOBAL', 'stock', 'Global stock management mode (GLOBAL, COUNTRY, ZONE)');

-- Insert default loyalty settings
INSERT INTO loyalty_settings (required_orders, code_expiration_days, code_format, discount_type, discount_value) 
VALUES (5, 30, 'FID-{RANDOM}', 'percentage', 10.0);
