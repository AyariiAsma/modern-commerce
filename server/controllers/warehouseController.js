import { query, queryOne, run } from '../config/database.js';

export const lookupProduct = async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).json({ message: 'Barcode or Reference code is required.' });

    try {
        const product = await queryOne(
            `SELECT p.*, s.real_stock, s.reserved_stock 
             FROM products p
             LEFT JOIN stock_items s ON p.id = s.product_id
             WHERE p.barcode = ? OR p.SKU = ?`,
            [code, code]
        );

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        res.json(product);
    } catch (err) {
        console.error('Lookup error:', err);
        res.status(500).json({ message: 'Failed to lookup product.' });
    }
};

export const importStock = async (req, res) => {
    const { product_id, quantity } = req.body;
    
    if (!product_id || !quantity || quantity <= 0) {
        return res.status(400).json({ message: 'Valid product ID and quantity are required.' });
    }

    try {
        await run('BEGIN TRANSACTION');

        const stockItem = await queryOne(
            'SELECT id, real_stock, reserved_stock, location_id FROM stock_items WHERE product_id = ? LIMIT 1',
            [product_id]
        );

        if (!stockItem) {
            await run('ROLLBACK');
            return res.status(404).json({ message: 'Stock tracking not found for this product.' });
        }

        const newRealStock = stockItem.real_stock + quantity;

        await run(
            'UPDATE stock_items SET real_stock = ? WHERE id = ?',
            [newRealStock, stockItem.id]
        );

        await run(`
            INSERT INTO stock_movements (
                product_id, location_id, quantity, movement_type, reason, 
                previous_real_stock, new_real_stock, previous_reserved_stock, new_reserved_stock, user_id
            ) VALUES (?, ?, ?, 'addition', 'Product delivery', ?, ?, ?, ?, ?)
        `, [
            product_id, stockItem.location_id, quantity,
            stockItem.real_stock, newRealStock, stockItem.reserved_stock, stockItem.reserved_stock, req.user.id
        ]);

        await run('COMMIT');
        res.json({ message: 'Stock imported successfully.', newStock: newRealStock });
    } catch (err) {
        await run('ROLLBACK');
        console.error('Import stock error:', err);
        res.status(500).json({ message: 'Failed to import stock.' });
    }
};

export const getPendingOrders = async (req, res) => {
    try {
        // Find orders that are Pending or Processing
        const orders = await query(
            `SELECT * FROM orders WHERE status IN ('Pending', 'Processing') ORDER BY created_at ASC`
        );
        res.json(orders);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ message: 'Failed to fetch pending orders.' });
    }
};

export const getOrderDetails = async (req, res) => {
    const { orderId } = req.params;
    try {
        const order = await queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);
        if (!order) return res.status(404).json({ message: 'Order not found.' });

        const items = await query(`
            SELECT oi.*, p.barcode, p.SKU, s.real_stock
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            LEFT JOIN stock_items s ON p.id = s.product_id
            WHERE oi.order_id = ?
        `, [orderId]);

        res.json({ ...order, items });
    } catch (err) {
        console.error('Error fetching order details:', err);
        res.status(500).json({ message: 'Failed to fetch order details.' });
    }
};

export const exportStockForOrder = async (req, res) => {
    const { orderId } = req.params;
    const { product_id, quantity } = req.body;

    if (!product_id || !quantity || quantity <= 0) {
        return res.status(400).json({ message: 'Valid product ID and quantity are required.' });
    }

    try {
        await run('BEGIN TRANSACTION');

        const orderItem = await queryOne(
            'SELECT * FROM order_items WHERE order_id = ? AND product_id = ?',
            [orderId, product_id]
        );

        if (!orderItem) {
            await run('ROLLBACK');
            return res.status(400).json({ message: 'Product does not belong to this order.' });
        }

        const remainingToPrepare = orderItem.quantity - orderItem.prepared_quantity;
        if (quantity > remainingToPrepare) {
            await run('ROLLBACK');
            return res.status(400).json({ message: 'Cannot export more than the ordered quantity.' });
        }

        const stockItem = await queryOne(
            'SELECT id, real_stock, reserved_stock, location_id FROM stock_items WHERE product_id = ? LIMIT 1',
            [product_id]
        );

        if (!stockItem || stockItem.real_stock < quantity) {
            await run('ROLLBACK');
            return res.status(400).json({ message: 'Insufficient real stock available.' });
        }

        // Deduct from real stock AND reserved stock (since the order already reserved it)
        const newRealStock = stockItem.real_stock - quantity;
        // Avoid reserved stock going negative if it was out of sync
        const newReservedStock = Math.max(0, stockItem.reserved_stock - quantity);

        await run(
            'UPDATE stock_items SET real_stock = ?, reserved_stock = ? WHERE id = ?',
            [newRealStock, newReservedStock, stockItem.id]
        );

        const newPreparedQty = orderItem.prepared_quantity + quantity;
        await run(
            'UPDATE order_items SET prepared_quantity = ? WHERE id = ?',
            [newPreparedQty, orderItem.id]
        );

        await run(`
            INSERT INTO stock_movements (
                product_id, location_id, quantity, movement_type, reason, reference_type, reference_id,
                previous_real_stock, new_real_stock, previous_reserved_stock, new_reserved_stock, user_id
            ) VALUES (?, ?, ?, 'deduction', 'Order fulfillment', 'order', ?, ?, ?, ?, ?, ?)
        `, [
            product_id, stockItem.location_id, quantity, orderId,
            stockItem.real_stock, newRealStock, stockItem.reserved_stock, newReservedStock, req.user.id
        ]);

        // Check if all items in the order are fully prepared
        const allItems = await query('SELECT quantity, prepared_quantity FROM order_items WHERE order_id = ?', [orderId]);
        const isFullyPrepared = allItems.every(i => i.prepared_quantity >= i.quantity);

        if (isFullyPrepared) {
            await run('UPDATE orders SET status = ? WHERE id = ?', ['Shipped', orderId]);
            await run(`INSERT INTO order_status_histories (order_id, new_status, changed_by, comment) VALUES (?, 'Shipped', ?, 'Order fully packed and ready')`, [orderId, req.user.id]);
        } else {
            // Ensure status is Processing if we just started
            await run('UPDATE orders SET status = ? WHERE id = ? AND status = ?', ['Processing', orderId, 'Pending']);
        }

        await run('COMMIT');
        res.json({ message: 'Stock exported successfully.', newPreparedQty, isFullyPrepared });
    } catch (err) {
        await run('ROLLBACK');
        console.error('Export stock error:', err);
        res.status(500).json({ message: 'Failed to export stock for order.' });
    }
};
