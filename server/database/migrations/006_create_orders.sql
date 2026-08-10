CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    order_number TEXT UNIQUE NOT NULL,
    subtotal REAL NOT NULL,
    shipping_cost REAL NOT NULL,
    discount REAL NOT NULL DEFAULT 0.0,
    total REAL NOT NULL,
    status TEXT CHECK(status IN ('Pending', 'Confirmed', 'Preparing', 'Shipped', 'Delivered', 'Cancelled')) NOT NULL DEFAULT 'Pending',
    payment_status TEXT CHECK(payment_status IN ('Pending', 'Paid', 'Failed', 'Refunded')) NOT NULL DEFAULT 'Pending',
    payment_method TEXT NOT NULL,
    shipping_first_name TEXT NOT NULL,
    shipping_last_name TEXT NOT NULL,
    shipping_phone TEXT NOT NULL,
    shipping_address_line_1 TEXT NOT NULL,
    shipping_address_line_2 TEXT,
    shipping_city TEXT NOT NULL,
    shipping_postal_code TEXT NOT NULL,
    shipping_country TEXT NOT NULL,
    shipping_additional_information TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);
