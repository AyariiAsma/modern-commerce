import { query, run, queryOne } from '../config/database.js';

export const getStockLocations = async (req, res, next) => {
    try {
        const locations = await query('SELECT * FROM stock_locations ORDER BY id ASC');
        res.json({ success: true, data: locations });
    } catch (err) {
        next(err);
    }
};

export const getProductStock = async (req, res, next) => {
    try {
        const { id } = req.params; // product id
        const stockItems = await query(`
            SELECT s.*, l.name as location_name, l.type as location_type 
            FROM stock_items s 
            JOIN stock_locations l ON s.location_id = l.id 
            WHERE s.product_id = ?
        `, [id]);
        res.json({ success: true, data: stockItems });
    } catch (err) {
        next(err);
    }
};

export const getStockMovements = async (req, res, next) => {
    try {
        const { id } = req.params; // product id
        const limit = parseInt(req.query.limit) || 20;
        const movements = await query(`
            SELECT m.*, l.name as location_name, u.name as user_name
            FROM stock_movements m
            JOIN stock_locations l ON m.location_id = l.id
            LEFT JOIN users u ON m.user_id = u.id
            WHERE m.product_id = ?
            ORDER BY m.created_at DESC
            LIMIT ?
        `, [id, limit]);
        res.json({ success: true, data: movements });
    } catch (err) {
        next(err);
    }
};

// Add or remove stock manually
export const adjustStock = async (req, res, next) => {
    const { product_id, location_id, quantity, movement_type, reason } = req.body;
    const user_id = req.user?.id || null;

    if (!['addition', 'deduction'].includes(movement_type)) {
        return res.status(400).json({ message: 'Invalid movement type.' });
    }
    if (quantity <= 0) {
        return res.status(400).json({ message: 'Quantity must be positive.' });
    }

    try {
        const stockItem = await queryOne('SELECT * FROM stock_items WHERE product_id = ? AND location_id = ?', [product_id, location_id]);
        
        let previous_real_stock = 0;
        let new_real_stock = 0;
        let reserved_stock = 0;

        if (stockItem) {
            previous_real_stock = stockItem.real_stock;
            reserved_stock = stockItem.reserved_stock;
            new_real_stock = movement_type === 'addition' ? previous_real_stock + quantity : previous_real_stock - quantity;
            
            if (new_real_stock < reserved_stock) {
                 return res.status(400).json({ message: `Cannot deduct stock below reserved stock level (${reserved_stock}).` });
            }

            await run('UPDATE stock_items SET real_stock = ? WHERE id = ?', [new_real_stock, stockItem.id]);
        } else {
            if (movement_type === 'deduction') {
                return res.status(400).json({ message: 'Cannot deduct stock. Item not found in location.' });
            }
            new_real_stock = quantity;
            await run('INSERT INTO stock_items (product_id, location_id, real_stock, reserved_stock) VALUES (?, ?, ?, 0)', [product_id, location_id, new_real_stock]);
        }

        // Record movement
        await run(`
            INSERT INTO stock_movements (product_id, location_id, quantity, movement_type, reason, reference_type, previous_real_stock, new_real_stock, previous_reserved_stock, new_reserved_stock, user_id)
            VALUES (?, ?, ?, ?, ?, 'manual_adjustment', ?, ?, ?, ?, ?)
        `, [product_id, location_id, quantity, movement_type, reason || 'Manual adjustment', previous_real_stock, new_real_stock, reserved_stock, reserved_stock, user_id]);

        res.json({ success: true, message: 'Stock adjusted successfully.', new_real_stock });
    } catch (err) {
        next(err);
    }
};
