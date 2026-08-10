import bcrypt from 'bcryptjs';
import db, { run, query } from '../../config/database.js';

async function seed() {
    console.log('Seeding database with demo data...');

    // 1. Seed Users
    console.log('Seeding users...');
    const hashedAdminPassword = await bcrypt.hash('adminpassword', 10);
    const hashedCustomerPassword = await bcrypt.hash('password123', 10);

    const userCount = await query('SELECT count(*) as count FROM users');
    let adminUserId, customerUserId;

    if (userCount[0].count === 0) {
        const adminRes = await run(
            `INSERT INTO users (name, email, password, phone, role, status) VALUES (?, ?, ?, ?, ?, ?)`,
            ['John Doe (Admin)', 'admin@example.com', hashedAdminPassword, '+213555555555', 'admin', 'active']
        );
        adminUserId = adminRes.lastID;

        const customerRes = await run(
            `INSERT INTO users (name, email, password, phone, role, status) VALUES (?, ?, ?, ?, ?, ?)`,
            ['Alice Johnson', 'alice@example.com', hashedCustomerPassword, '+213666666666', 'customer', 'active']
        );
        customerUserId = customerRes.lastID;
        console.log('Users seeded successfully.');
    } else {
        console.log('Users already exist. Skipping.');
        const adminUser = await queryOne('SELECT id FROM users WHERE email = ?', ['admin@example.com']);
        adminUserId = adminUser?.id;
        const customerUser = await queryOne('SELECT id FROM users WHERE email = ?', ['alice@example.com']);
        customerUserId = customerUser?.id;
    }

    // 2. Seed Categories
    console.log('Seeding categories...');
    const categoriesCount = await query('SELECT count(*) as count FROM categories');
    const categoryIdMap = {};

    const demoCategories = [
        { name: 'Electronics', slug: 'electronics', description: 'Gadgets, smartphones, and computer accessories.', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=60', sort_order: 1 },
        { name: 'Clothing', slug: 'clothing', description: 'Trendy, stylish and comfortable wear.', image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400&auto=format&fit=crop&q=60', sort_order: 2 },
        { name: 'Beauty', slug: 'beauty', description: 'Cosmetics, skincare products and wellness essentials.', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&auto=format&fit=crop&q=60', sort_order: 3 },
        { name: 'Home & Kitchen', slug: 'home-kitchen', description: 'Modern kitchen appliances and home decor.', image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=400&auto=format&fit=crop&q=60', sort_order: 4 },
        { name: 'Sports', slug: 'sports', description: 'Fitness gear, sportswear, and outdoor equipment.', image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&auto=format&fit=crop&q=60', sort_order: 5 },
        { name: 'Accessories', slug: 'accessories', description: 'Bags, wallets, sunglasses and watches.', image: 'https://images.unsplash.com/photo-1627124765135-56c2d77b0d87?w=400&auto=format&fit=crop&q=60', sort_order: 6 }
    ];

    if (categoriesCount[0].count === 0) {
        for (const cat of demoCategories) {
            const res = await run(
                `INSERT INTO categories (name, slug, description, image, status, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
                [cat.name, cat.slug, cat.description, cat.image, 'active', cat.sort_order]
            );
            categoryIdMap[cat.slug] = res.lastID;
        }
        console.log('Categories seeded.');
    } else {
        console.log('Categories already exist. Mapping slugs...');
        const cats = await query('SELECT id, slug FROM categories');
        cats.forEach(c => {
            categoryIdMap[c.slug] = c.id;
        });
    }

    // Add subcategory example for future extensibility proof
    const subCategoriesCount = await query('SELECT count(*) as count FROM categories WHERE parent_id IS NOT NULL');
    if (subCategoriesCount[0].count === 0 && categoryIdMap['electronics']) {
        const parentId = categoryIdMap['electronics'];
        await run(
            `INSERT INTO categories (parent_id, name, slug, description, status, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
            [parentId, 'Phones', 'phones', 'Mobile smartphones and smart devices.', 'active', 1]
        );
        await run(
            `INSERT INTO categories (parent_id, name, slug, description, status, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
            [parentId, 'Laptops', 'laptops', 'High-performance computers and notebooks.', 'active', 2]
        );
        console.log('Subcategories seeded under Electronics.');
    }

    // 3. Seed Products
    console.log('Seeding products...');
    const productsCount = await query('SELECT count(*) as count FROM products');
    if (productsCount[0].count === 0) {
        const demoProducts = [
            {
                name: 'Pro Noise-Cancelling Headphones',
                description: 'Experience pure acoustic bliss with industry-leading Active Noise Cancellation, high fidelity wireless audio, up to 40 hours of battery life, and ultra-comfortable memory foam earcups.',
                price: 349.99,
                discount_price: 299.99,
                categorySlug: 'electronics',
                SKU: 'HEAD-NC-001',
                stock_quantity: 14,
                featured: 1,
                images: [
                    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80'
                ]
            },
            {
                name: 'Smart Fitness Watch',
                description: 'Track your heart rate, sleep cycles, steps, and sports activities dynamically in real-time. Features a vibrant AMOLED display, built-in GPS, waterproof design, and a sleek modern bezel.',
                price: 199.99,
                discount_price: 179.99,
                categorySlug: 'electronics',
                SKU: 'WATCH-FIT-002',
                stock_quantity: 25,
                featured: 1,
                images: [
                    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'
                ]
            },
            {
                name: 'Ultra-Compact Mechanical Keyboard',
                description: 'Designed for writers and gamers alike, this 65% design keyboard features hot-swappable mechanical switches, RGB customization, double-shot PBT keycaps, and durable aluminum construction.',
                price: 129.99,
                discount_price: null,
                categorySlug: 'electronics',
                SKU: 'KEY-MECH-003',
                stock_quantity: 8,
                featured: 0,
                images: [
                    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80'
                ]
            },
            {
                name: 'Classic Denim Trucker Jacket',
                description: 'A timeless layering piece handcrafted from premium indigo dyed denim. Featuring clean metal button closures, standard chest pockets, and side welt pockets. Pre-shrunk for the perfect fit.',
                price: 89.99,
                discount_price: 69.99,
                categorySlug: 'clothing',
                SKU: 'JACK-DEN-004',
                stock_quantity: 35,
                featured: 0,
                images: [
                    'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80'
                ]
            },
            {
                name: 'Premium Wool Double-Breasted Coat',
                description: 'Crafted from a heavyweight and elegant recycled wool blend, this refined coat offers superior insulation and a tailored, formal silhouette perfect for chilly seasons.',
                price: 249.99,
                discount_price: null,
                categorySlug: 'clothing',
                SKU: 'COAT-WOOL-005',
                stock_quantity: 12,
                featured: 1,
                images: [
                    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80'
                ]
            },
            {
                name: 'Minimalist Cotton Crewneck Tee',
                description: 'An everyday wardrobe essential spun from ultra-soft 100% organic cotton. Features a durable midweight feel that gets softer with each wash, a robust ribbed collar, and double-needle stitching.',
                price: 29.99,
                discount_price: 24.99,
                categorySlug: 'clothing',
                SKU: 'TEE-COT-006',
                stock_quantity: 150,
                featured: 0,
                images: [
                    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'
                ]
            },
            {
                name: 'Advanced Hydra-Restore Face Serum',
                description: 'Infused with clean multi-molecular hyaluronic acid and vitamin B5, this daily skin treatment penetrates deeply to instantly plump up moisture layers, reducing dry lines and clarifying the skin barrier.',
                price: 45.00,
                discount_price: 38.00,
                categorySlug: 'beauty',
                SKU: 'SERUM-HYD-007',
                stock_quantity: 60,
                featured: 1,
                images: [
                    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80'
                ]
            },
            {
                name: 'Organic Purifying Mud Mask',
                description: 'Formulated with mineral-rich Dead Sea mud, activated charcoal, and organic botanicals. Absorbs excess oil, clears impurities, minimizes the appearance of pores, and leaves skin revitalized and glowing.',
                price: 32.00,
                discount_price: null,
                categorySlug: 'beauty',
                SKU: 'MASK-MUD-008',
                stock_quantity: 45,
                featured: 0,
                images: [
                    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&auto=format&fit=crop&q=80'
                ]
            },
            {
                name: '15-Bar Precision Espresso Machine',
                description: 'Bring the gourmet cafe experience home. Features a powerful steam wand to frothe rich microfoam milk, auto-dosing controls, a high-pressure pump, and an build-in thermo heating system.',
                price: 599.99,
                discount_price: 489.99,
                categorySlug: 'home-kitchen',
                SKU: 'COF-ESP-009',
                stock_quantity: 5,
                featured: 1,
                images: [
                    'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80'
                ]
            },
            {
                name: 'Non-Stick Ceramic Cookware Set',
                description: 'Healthy cooking made easy. This 10-piece set includes saute pans, stockpots, and saucepans with premium ceramic finish. Free from PFOA, PFAS, lead, and cadmium. Oven safe up to 350F.',
                price: 189.99,
                discount_price: null,
                categorySlug: 'home-kitchen',
                SKU: 'POTS-CER-010',
                stock_quantity: 15,
                featured: 0,
                images: [
                    'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=80'
                ]
            },
            {
                name: 'Non-Slip High Density Yoga Mat',
                description: 'Eco-conscious design constructed from natural TPE. Featuring double-sided textured grip surfaces to prevent slipping, 6mm premium padding to support joints, and an included carry strap.',
                price: 49.99,
                discount_price: 39.99,
                categorySlug: 'sports',
                SKU: 'MAT-YOGA-011',
                stock_quantity: 40,
                featured: 0,
                images: [
                    'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&auto=format&fit=crop&q=80'
                ]
            },
            {
                name: 'Minimalist Full Grain Leather Wallet',
                description: 'Handstitched from vegetable tanned leather. Sleek design holds up to 8 cards and folded bills in the main pocket. Over time, it will develop a uniquely beautiful patina tailored to your use.',
                price: 55.00,
                discount_price: null,
                categorySlug: 'accessories',
                SKU: 'WAL-LEAT-012',
                stock_quantity: 80,
                featured: 1,
                images: [
                    'https://images.unsplash.com/photo-1627124765135-56c2d77b0d87?w=800&auto=format&fit=crop&q=80'
                ]
            }
        ];

        for (const prod of demoProducts) {
            const catId = categoryIdMap[prod.categorySlug];
            const slug = prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const res = await run(
                `INSERT INTO products (category_id, name, slug, description, price, discount_price, SKU, stock_quantity, status, featured)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [catId, prod.name, slug, prod.description, prod.price, prod.discount_price, prod.SKU, prod.stock_quantity, 'active', prod.featured]
            );
            const productId = res.lastID;

            // Insert subimages
            for (let i = 0; i < prod.images.length; i++) {
                const img = prod.images[i];
                await run(
                    `INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)`,
                    [productId, img, i === 0 ? 1 : 0]
                );
            }
        }
        console.log('Products and product images seeded.');
    } else {
        console.log('Products already exist. Skipping.');
    }

    // 4. Seed Banners
    console.log('Seeding banners...');
    const bannersCount = await query('SELECT count(*) as count FROM banners');
    if (bannersCount[0].count === 0) {
        await run(
            `INSERT INTO banners (title, subtitle, description, type, media_url, button_text, button_url, status, sort_order, start_date, end_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'Premium Collection 2026',
                'Summer Tech Showcase',
                'Uncompromised wireless noise cancellation headphones and smart wearables.',
                'image',
                'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&auto=format&fit=crop&q=60',
                'Shop Electronics',
                '/catalog?category=electronics',
                'active',
                1,
                null,
                null
            ]
        );

        await run(
            `INSERT INTO banners (title, subtitle, description, type, media_url, button_text, button_url, status, sort_order, start_date, end_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'Acoustic Brilliance',
                'Feel the Beat',
                'True immersive premium noise cancellation experience in wireless audio.',
                'video',
                'https://assets.mixkit.co/videos/preview/mixkit-headphones-lying-on-a-table-in-a-dark-room-40502-large.mp4',
                'Get Headphones',
                '/product/1',
                'active',
                2,
                null,
                null
            ]
        );

        await run(
            `INSERT INTO banners (title, subtitle, description, type, media_url, button_text, button_url, status, sort_order, start_date, end_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'Urban Style & Denim',
                'Find Your Style',
                'Recycled wool double coats and indigo dyed heavy denim apparel.',
                'image',
                'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=1400&auto=format&fit=crop&q=60',
                'Shop Clothing',
                '/catalog?category=clothing',
                'active',
                3,
                '2026-08-01',
                '2026-09-01' // active because current date is Aug 10, 2026!
            ]
        );

        await run(
            `INSERT INTO banners (title, subtitle, description, type, media_url, button_text, button_url, status, sort_order, start_date, end_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'Expired Promo Campaign',
                'Not Visible',
                'This promotional banner should not appear due to outdated timeline.',
                'image',
                'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1400&auto=format&fit=crop&q=60',
                'Shop Collection',
                '/catalog',
                'active',
                4,
                '2026-01-01',
                '2026-03-01' // expired by current date Aug 10, 2026!
            ]
        );

        console.log('Banners seeded successfully.');
    } else {
        console.log('Banners already exist. Skipping.');
    }

    // 5. Seed Customer Addresses
    console.log('Seeding customer addresses...');
    if (customerUserId) {
        const addressesCount = await query('SELECT count(*) as count FROM addresses');
        if (addressesCount[0].count === 0) {
            await run(
                `INSERT INTO addresses (user_id, first_name, last_name, phone, address_line_1, address_line_2, city, postal_code, country, additional_information, is_default)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    customerUserId,
                    'Alice',
                    'Johnson',
                    '+213666666666',
                    '123 Pine St',
                    'Apartment 4B',
                    'Algiers',
                    '16000',
                    'Algeria',
                    'Near the main metro station',
                    1
                ]
            );

            await run(
                `INSERT INTO addresses (user_id, first_name, last_name, phone, address_line_1, address_line_2, city, postal_code, country, additional_information, is_default)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    customerUserId,
                    'Alice',
                    'Johnson',
                    '+213777777777',
                    '456 Ocean Boulevard',
                    null,
                    'Oran',
                    '31000',
                    'Algeria',
                    'Office address',
                    0
                ]
            );
            console.log('Addresses seeded.');
        } else {
            console.log('Addresses already exist. Skipping.');
        }
    }

    // 6. Seed Orders
    console.log('Seeding orders...');
    const ordersCount = await query('SELECT count(*) as count FROM orders');
    if (ordersCount[0].count === 0 && customerUserId) {
        // Create an order
        const orderNum = `ORD-20260810-7789`;
        const orderRes = await run(
            `INSERT INTO orders (user_id, order_number, subtotal, shipping_cost, discount, total, status, payment_status, payment_method,
                              shipping_first_name, shipping_last_name, shipping_phone, shipping_address_line_1, shipping_address_line_2,
                              shipping_city, shipping_postal_code, shipping_country, shipping_additional_information, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                customerUserId,
                orderNum,
                409.99,
                15.00,
                0.00,
                424.99,
                'Delivered',
                'Paid',
                'Cash On Delivery',
                'Alice',
                'Johnson',
                '+213666666666',
                '123 Pine St',
                'Apartment 4B',
                'Algiers',
                '16000',
                'Algeria',
                'Near the main metro station',
                '2026-07-06T14:30:00Z'
            ]
        );
        const orderId = orderRes.lastID;

        // Insert order items
        await run(
            `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [orderId, 1, 'Pro Noise-Cancelling Headphones', 1, 299.99, 299.99]
        );

        await run(
            `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [orderId, 12, 'Minimalist Full Grain Leather Wallet', 2, 55.00, 110.00]
        );

        console.log('Orders and order items seeded successfully.');
    } else {
        console.log('Orders already exist. Skipping.');
    }

    console.log('Database seeding finished.');
    db.close();
}

async function queryOne(sql, params = []) {
    const rows = await query(sql, params);
    return rows[0] || null;
}

seed().catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
