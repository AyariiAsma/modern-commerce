import db, { run, query, queryOne } from '../config/database.js';
import { generateInvoicePDF } from '../services/invoiceService.js';
import { calculateItemTotals, calculateOrderTotals } from '../services/financialService.js';

// Helper to get a product with its active promotions for checkout
async function getProductForCheckout(productId) {
    return await queryOne(`
        SELECT p.*,
               COALESCE((SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1), '') as image,
               COALESCE(
                   (SELECT CASE 
                            WHEN prm.discount_type = 'percentage' THEN p.price - (p.price * (prm.discount_value / 100))
                            WHEN prm.discount_type = 'fixed' THEN p.price - prm.discount_value
                            WHEN prm.discount_type = 'special_price' THEN prm.discount_value
                           END
                    FROM promotions prm
                    JOIN promotion_targets pt ON pt.promotion_id = prm.id
                    WHERE prm.status = 'active' 
                      AND (prm.start_datetime IS NULL OR prm.start_datetime <= datetime('now', 'localtime'))
                      AND (prm.end_datetime IS NULL OR prm.end_datetime >= datetime('now', 'localtime'))
                      AND ((pt.target_type = 'product' AND pt.target_id = p.id) OR (pt.target_type = 'category' AND pt.target_id = p.category_id))
                    ORDER BY prm.priority DESC
                    LIMIT 1),
                   p.discount_price
               ) as discount_price
        FROM products p
        WHERE p.id = ?
    `, [productId]);
}

// Helper to resolve and validate promo code / loyalty code
async function resolvePromoCode(code, userId) {
    if (!code) return null;
    const cleanCode = code.trim().toUpperCase();

    // 1. Check if global coupon
    if (cleanCode === 'AURASTART') {
        return {
            code: 'AURASTART',
            discount_type: 'percentage',
            discount_value: 15.0,
            is_global: true,
            min_purchase_amount: 0
        };
    }

    // 2. Check if user-specific loyalty code
    if (!userId) return null;

    // Check if fidelity program is enabled
    const settings = await queryOne('SELECT * FROM loyalty_settings ORDER BY id DESC LIMIT 1');
    if (!settings || !settings.fidelity_enabled) {
        return null; // Fidelity program is disabled
    }

    const loyaltyCode = await queryOne(
        `SELECT * FROM loyalty_codes 
         WHERE UPPER(code) = ? AND customer_id = ? AND status = 'active'`,
        [cleanCode, userId]
    );

    if (!loyaltyCode) return null;

    // Check expiry
    if (loyaltyCode.expiration_date && new Date(loyaltyCode.expiration_date) < new Date()) {
        return null;
    }

    return {
        code: loyaltyCode.code,
        discount_type: settings.discount_type,
        discount_value: settings.discount_value,
        is_global: false,
        id: loyaltyCode.id,
        min_purchase_amount: settings.min_purchase_amount || 0
    };
}

export const createOrder = async (req, res) => {
    const { address_id, address_details, save_address, items, payment_method, shipping_cost = 15.00, promo_code } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Cart items are required to place an order.' });
    }
    if (!payment_method) {
        return res.status(400).json({ message: 'Payment method is required.' });
    }

    try {
        await run('BEGIN TRANSACTION');

        let shippingAddress = {};
        if (address_id) {
            const addr = await queryOne('SELECT * FROM addresses WHERE id = ?', [address_id]);
            if (!addr) {
                await run('ROLLBACK');
                return res.status(400).json({ message: 'Selected address not found.' });
            }
            if (userId && addr.user_id !== userId) {
                await run('ROLLBACK');
                return res.status(403).json({ message: 'Unauthorized address selection.' });
            }
            shippingAddress = addr;
        } else if (address_details) {
            const { first_name, last_name, phone, address_line_1, address_line_2, city, postal_code, country, additional_information } = address_details;
            if (!first_name || !last_name || !phone || !address_line_1 || !city || !postal_code || !country) {
                await run('ROLLBACK');
                return res.status(400).json({ message: 'Complete address details are required.' });
            }
            shippingAddress = address_details;
            if (userId && save_address) {
                await run('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
                await run(
                    `INSERT INTO addresses (user_id, first_name, last_name, phone, address_line_1, address_line_2, city, postal_code, country, additional_information, is_default)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                    [userId, first_name, last_name, phone, address_line_1, address_line_2 || null, city, postal_code, country, additional_information || null]
                );
            }
        } else {
            await run('ROLLBACK');
            return res.status(400).json({ message: 'Shipping address is required.' });
        }

        const validatedItems = [];
        const GLOBAL_LOCATION_ID = 1;

        for (const item of items) {
            const product = await getProductForCheckout(item.product_id);
            if (!product) {
                await run('ROLLBACK');
                return res.status(404).json({ message: `Product with ID ${item.product_id} not found.` });
            }
            if (product.status !== 'active') {
                await run('ROLLBACK');
                return res.status(400).json({ message: `Product "${product.name}" is no longer active.` });
            }

            const stockItem = await queryOne('SELECT * FROM stock_items WHERE product_id = ? AND location_id = ?', [product.id, GLOBAL_LOCATION_ID]);
            const availableStock = stockItem ? (stockItem.real_stock - stockItem.reserved_stock) : 0;

            if (availableStock < item.quantity) {
                await run('ROLLBACK');
                return res.status(400).json({ message: `Insufficient stock for "${product.name}". Only ${availableStock} available.` });
            }

            // Calculate item totals using centralized financial calculation engine
            const itemTotals = calculateItemTotals(
                product.price, 
                product.tva_rate || 0, 
                product.discount_price, 
                item.quantity
            );

            validatedItems.push({
                product_id: product.id,
                product_name: product.name,
                product_image: product.image,
                stockItem,
                ...itemTotals
            });
        }

        // Resolve code discount
        const promoCodeObj = await resolvePromoCode(promo_code, userId);

        // Validate minimum purchase if fidelity code is applied
        if (promoCodeObj && promoCodeObj.min_purchase_amount > 0) {
            const tempTotals = calculateOrderTotals(validatedItems, shipping_cost, null);
            if (tempTotals.total_ttc < promoCodeObj.min_purchase_amount) {
                await run('ROLLBACK');
                return res.status(400).json({ 
                    message: `Fidelity code requires a minimum purchase of ${promoCodeObj.min_purchase_amount} DT.` 
                });
            }
        }

        // Calculate order totals
        const orderTotals = calculateOrderTotals(validatedItems, shipping_cost, promoCodeObj);

        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const randStr = Math.floor(1000 + Math.random() * 9000);
        const orderNumber = `ORD-${dateStr}-${randStr}`;

        // Insert order with financial snapshots
        const orderResult = await run(
            `INSERT INTO orders (
                user_id, order_number, subtotal, shipping_cost, discount, total, status, payment_status, payment_method,
                shipping_first_name, shipping_last_name, shipping_phone, shipping_address_line_1, shipping_address_line_2,
                shipping_city, shipping_postal_code, shipping_country, shipping_additional_information,
                subtotal_ht, total_discount, total_ht, total_tva, fidelity_discount, fidelity_code, total_ttc, total_paid
             ) VALUES (?, ?, ?, ?, ?, ?, 'Pending', 'Pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId, orderNumber, 
                orderTotals.subtotal_ht, // legacy subtotal mapped to HT
                orderTotals.shipping_cost,
                orderTotals.total_discount + orderTotals.fidelity_discount, // legacy discount includes both
                orderTotals.total_paid, // legacy total mapped to paid TTC
                payment_method,
                shippingAddress.first_name, shippingAddress.last_name, shippingAddress.phone, shippingAddress.address_line_1,
                shippingAddress.address_line_2 || null, shippingAddress.city, shippingAddress.postal_code, shippingAddress.country,
                shippingAddress.additional_information || null,
                orderTotals.subtotal_ht,
                orderTotals.total_discount,
                orderTotals.total_ht,
                orderTotals.total_tva,
                orderTotals.fidelity_discount,
                promoCodeObj ? promoCodeObj.code : null,
                orderTotals.total_ttc,
                orderTotals.total_paid
            ]
        );

        const orderId = orderResult.lastID;

        // Log initial status
        await run(`INSERT INTO order_status_histories (order_id, new_status, changed_by, comment) VALUES (?, 'Pending', ?, 'Order placed by customer')`, [orderId, userId]);

        // Insert items with snapshots and adjust stock
        for (const item of validatedItems) {
            await run(
                `INSERT INTO order_items (
                    order_id, product_id, product_name, quantity, unit_price, total_price,
                    unit_price_ht, tva_rate, tva_amount, unit_price_ttc, discount_amount, total_ht, total_ttc, product_image
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    orderId, item.product_id, item.product_name, item.quantity, 
                    item.unit_price_ht, // unit_price mapped to unit_price_ht
                    item.total_ht, // total_price mapped to total_ht
                    item.unit_price_ht,
                    item.tva_rate,
                    item.tva_amount,
                    item.unit_price_ttc,
                    item.discount_amount,
                    item.total_ht,
                    item.total_ttc,
                    item.product_image || null
                ]
            );

            // Reserve stock (transactional lock)
            const newReserved = item.stockItem.reserved_stock + item.quantity;
            await run(
                `UPDATE stock_items SET reserved_stock = ? WHERE id = ?`,
                [newReserved, item.stockItem.id]
            );

            // Log stock movement
            await run(`
                INSERT INTO stock_movements (product_id, location_id, quantity, movement_type, reason, reference_type, reference_id, previous_real_stock, new_real_stock, previous_reserved_stock, new_reserved_stock, user_id)
                VALUES (?, ?, ?, 'addition', 'Stock reserved for order', 'order', ?, ?, ?, ?, ?, ?)
            `, [item.product_id, GLOBAL_LOCATION_ID, item.quantity, orderId, item.stockItem.real_stock, item.stockItem.real_stock, item.stockItem.reserved_stock, newReserved, userId]);
        }

        // Consume loyalty code if applicable
        if (promoCodeObj && !promoCodeObj.is_global && userId) {
            await run(
                `UPDATE loyalty_codes 
                 SET status = 'used', used_date = CURRENT_TIMESTAMP, used_order_id = ? 
                 WHERE id = ?`,
                [orderId, promoCodeObj.id]
            );
        }

        await run('COMMIT');

        res.status(201).json({
            id: orderId,
            orderNumber,
            total: orderTotals.total_paid,
            message: 'Order created successfully.'
        });

    } catch (err) {
        await run('ROLLBACK');
        res.status(500).json({ message: 'Failed to process order.', error: err.message });
    }
};

export const previewOrder = async (req, res) => {
    const { items, shipping_cost = 15.00, promo_code } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Cart items are required for preview.' });
    }

    try {
        const validatedItems = [];
        for (const item of items) {
            const product = await getProductForCheckout(item.product_id);
            if (!product) {
                return res.status(404).json({ message: `Product with ID ${item.product_id} not found.` });
            }
            if (product.status !== 'active') {
                return res.status(400).json({ message: `Product "${product.name}" is no longer active.` });
            }

            const itemTotals = calculateItemTotals(
                product.price,
                product.tva_rate || 0,
                product.discount_price,
                item.quantity
            );

            validatedItems.push({
                product_id: product.id,
                product_name: product.name,
                product_image: product.image,
                ...itemTotals
            });
        }

        const promoCodeObj = await resolvePromoCode(promo_code, userId);

        // Validate minimum purchase if fidelity code is applied
        if (promoCodeObj && promoCodeObj.min_purchase_amount > 0) {
            const tempTotals = calculateOrderTotals(validatedItems, shipping_cost, null);
            if (tempTotals.total_ttc < promoCodeObj.min_purchase_amount) {
                return res.status(400).json({ 
                    message: `Fidelity code requires a minimum purchase of ${promoCodeObj.min_purchase_amount} DT.` 
                });
            }
        }

        const orderTotals = calculateOrderTotals(validatedItems, shipping_cost, promoCodeObj);

        res.json({
            items: validatedItems,
            totals: orderTotals,
            promo_applied: promoCodeObj ? {
                code: promoCodeObj.code,
                discount_type: promoCodeObj.discount_type,
                discount_value: promoCodeObj.discount_value
            } : null
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to preview order.', error: err.message });
    }
};

export const getOrders = async (req, res) => {
    const { status, payment_status } = req.query;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    let sql = `SELECT * FROM orders WHERE 1=1`;
    const params = [];

    if (!isAdmin) {
        sql += ` AND user_id = ?`;
        params.push(userId);
    }
    if (status) {
        sql += ` AND status = ?`;
        params.push(status);
    }
    if (payment_status) {
        sql += ` AND payment_status = ?`;
        params.push(payment_status);
    }
    sql += ` ORDER BY created_at DESC`;

    try {
        const list = await query(sql, params);
        res.json(list);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve orders list.', error: err.message });
    }
};

export const getOrderById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    try {
        const order = await queryOne('SELECT * FROM orders WHERE id = ?', [id]);
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }
        if (!isAdmin && order.user_id !== userId) {
            return res.status(403).json({ message: 'Unauthorized access to this order.' });
        }

        const items = await query(
            `SELECT oi.*, p.slug as product_slug,
                    COALESCE((SELECT image_url FROM product_images WHERE product_id = oi.product_id AND is_primary = 1 LIMIT 1), '') as image
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ?`,
            [id]
        );

        const history = await query(`SELECT * FROM order_status_histories WHERE order_id = ? ORDER BY created_at DESC`, [id]);
        
        const invoices = await query(`SELECT * FROM invoices WHERE order_id = ? ORDER BY created_at DESC`, [id]);

        order.items = items;
        order.history = history;
        order.invoices = invoices;
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve order details.', error: err.message });
    }
};

export const updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const allowedStatuses = ['Pending', 'Confirmed', 'Preparing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid order status.' });
    }

    try {
        await run('BEGIN TRANSACTION');

        const order = await queryOne('SELECT * FROM orders WHERE id = ?', [id]);
        if (!order) {
            await run('ROLLBACK');
            return res.status(404).json({ message: 'Order not found.' });
        }

        if (order.status === status) {
            await run('ROLLBACK');
            return res.status(400).json({ message: 'Order is already in this status.' });
        }

        const oldStatus = order.status;
        await run('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
        await run(`INSERT INTO order_status_histories (order_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)`, [id, oldStatus, status, userId]);

        if (status === 'Confirmed' && oldStatus !== 'Confirmed') {
            // Generate invoice
            const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const randStr = Math.floor(1000 + Math.random() * 9000);
            const invoiceNumber = `INV-${dateStr}-${randStr}`;

            const invoiceResult = await run(
                `INSERT INTO invoices (order_id, invoice_number, subtotal, discount, tax, shipping, total) VALUES (?, ?, ?, ?, 0.0, ?, ?)`,
                [id, invoiceNumber, order.subtotal, order.discount, order.shipping_cost, order.total]
            );

            const items = await query('SELECT * FROM order_items WHERE order_id = ?', [id]);
            const invoiceData = {
                order: order,
                items: items,
                invoice: { invoice_number: invoiceNumber, invoice_date: new Date(), subtotal: order.subtotal, discount: order.discount, shipping: order.shipping_cost, total: order.total }
            };

            const pdfPath = await generateInvoicePDF(invoiceData);
            await run('UPDATE invoices SET pdf_path = ?, status = ? WHERE id = ?', [pdfPath, 'generated', invoiceResult.lastID]);
        }

        // Handle stock finalization on Delivery or Cancellation
        const GLOBAL_LOCATION_ID = 1;
        const items = await query('SELECT * FROM order_items WHERE order_id = ?', [id]);

        for (const item of items) {
            const stockItem = await queryOne('SELECT * FROM stock_items WHERE product_id = ? AND location_id = ?', [item.product_id, GLOBAL_LOCATION_ID]);
            if (!stockItem) continue;

            if (status === 'Cancelled' && oldStatus !== 'Delivered') {
                // Release reserved stock
                const newReserved = Math.max(0, stockItem.reserved_stock - item.quantity);
                await run('UPDATE stock_items SET reserved_stock = ? WHERE id = ?', [newReserved, stockItem.id]);
                await run(`
                    INSERT INTO stock_movements (product_id, location_id, quantity, movement_type, reason, reference_type, reference_id, previous_real_stock, new_real_stock, previous_reserved_stock, new_reserved_stock, user_id)
                    VALUES (?, ?, ?, 'deduction', 'Stock reservation released due to cancellation', 'order', ?, ?, ?, ?, ?, ?)
                `, [item.product_id, GLOBAL_LOCATION_ID, item.quantity, id, stockItem.real_stock, stockItem.real_stock, stockItem.reserved_stock, newReserved, userId]);
            } else if (status === 'Delivered') {
                // Deduct from real stock and release reservation
                const newReal = Math.max(0, stockItem.real_stock - item.quantity);
                const newReserved = Math.max(0, stockItem.reserved_stock - item.quantity);
                await run('UPDATE stock_items SET real_stock = ?, reserved_stock = ? WHERE id = ?', [newReal, newReserved, stockItem.id]);
                await run(`
                    INSERT INTO stock_movements (product_id, location_id, quantity, movement_type, reason, reference_type, reference_id, previous_real_stock, new_real_stock, previous_reserved_stock, new_reserved_stock, user_id)
                    VALUES (?, ?, ?, 'deduction', 'Order delivered (real stock consumed)', 'order', ?, ?, ?, ?, ?, ?)
                `, [item.product_id, GLOBAL_LOCATION_ID, item.quantity, id, stockItem.real_stock, newReal, stockItem.reserved_stock, newReserved, userId]);
            }
        }

        await run('COMMIT');
        
        // === Loyalty System (runs after commit, non-critical) ===
        if (order.user_id) {
            try {
                const loyaltySettings = await queryOne('SELECT * FROM loyalty_settings ORDER BY id DESC LIMIT 1');
                if (loyaltySettings && loyaltySettings.fidelity_enabled === 1) {
                    let qualifyingStatuses = [];
                    try {
                        qualifyingStatuses = JSON.parse(loyaltySettings.qualifying_statuses || '["Delivered"]');
                    } catch(e) {}
                    
                    if (qualifyingStatuses.includes(status)) {
                        let qualifyingAmount = 0;
                        switch(loyaltySettings.amount_method) {
                            case 'total_ttc':
                                qualifyingAmount = order.total_ttc;
                                break;
                            case 'total_paid':
                            case 'total_paid_incl_shipping':
                                qualifyingAmount = order.total_paid;
                                break;
                            case 'total_paid_excl_shipping':
                                qualifyingAmount = order.total_paid - order.shipping_cost;
                                break;
                            case 'total_ht_excl_shipping':
                            default:
                                qualifyingAmount = order.total_ht;
                                break;
                        }

                        // Upsert loyalty_progress
                        await run(`
                            INSERT INTO loyalty_progress (customer_id, eligible_orders_count, qualifying_amount, last_qualifying_order, updated_at)
                            VALUES (?, 1, ?, ?, CURRENT_TIMESTAMP)
                            ON CONFLICT(customer_id) DO UPDATE SET 
                                eligible_orders_count = eligible_orders_count + 1,
                                qualifying_amount = qualifying_amount + ?,
                                last_qualifying_order = ?,
                                updated_at = CURRENT_TIMESTAMP
                        `, [order.user_id, qualifyingAmount, id, qualifyingAmount, id]);

                        const progress = await queryOne('SELECT * FROM loyalty_progress WHERE customer_id = ?', [order.user_id]);
                        
                        const targetMilestone = (progress.milestone_count || 0) + 1;
                        const targetOrders = targetMilestone * loyaltySettings.required_orders;
                        const targetAmount = targetMilestone * loyaltySettings.required_amount;

                        if (progress.eligible_orders_count >= targetOrders && progress.qualifying_amount >= targetAmount) {
                            // Milestone achieved! Generate a unique loyalty code
                            const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
                            const loyaltyCode = loyaltySettings.code_format.replace('{RANDOM}', randomPart);

                            const expirationDate = new Date();
                            expirationDate.setDate(expirationDate.getDate() + loyaltySettings.code_expiration_days);

                            const codeResult = await run(`
                                INSERT INTO loyalty_codes (
                                    customer_id, qualifying_order_id, code, status, expiration_date,
                                    qualifying_order_count, qualifying_order_amount, milestone_number
                                )
                                VALUES (?, ?, ?, 'active', ?, ?, ?, ?)
                            `, [
                                order.user_id, id, loyaltyCode, expirationDate.toISOString(),
                                progress.eligible_orders_count, progress.qualifying_amount, targetMilestone
                            ]);

                            // Update milestone count
                            await run(`UPDATE loyalty_progress SET milestone_count = ? WHERE customer_id = ?`, [targetMilestone, order.user_id]);

                            // Insert notification tracking
                            await run(`
                                INSERT INTO loyalty_notifications (customer_id, loyalty_code_id, notification_type)
                                VALUES (?, ?, 'code_generated')
                            `, [order.user_id, codeResult.lastID]);

                            console.log(`[Loyalty] Generated code ${loyaltyCode} for user ${order.user_id} (Milestone ${targetMilestone}).`);
                        }
                    }
                }
            } catch (loyaltyErr) {
                console.error('[Loyalty] Error processing loyalty:', loyaltyErr.message);
            }
        }

        res.json({ message: 'Order status updated successfully.' });
    } catch (err) {
        await run('ROLLBACK');
        res.status(500).json({ message: 'Failed to update order status.', error: err.message });
    }
};

export const updatePaymentStatus = async (req, res) => {
    const { id } = req.params;
    const { payment_status } = req.body;

    const allowedPaymentStatuses = ['Pending', 'Paid', 'Failed', 'Refunded'];
    if (!payment_status || !allowedPaymentStatuses.includes(payment_status)) {
        return res.status(400).json({ message: 'Invalid payment status.' });
    }

    try {
        const order = await queryOne('SELECT * FROM orders WHERE id = ?', [id]);
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        await run('UPDATE orders SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [payment_status, id]);
        res.json({ message: 'Order payment status updated successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update payment status.', error: err.message });
    }
};
