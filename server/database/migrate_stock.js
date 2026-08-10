import db, { run, query } from '../config/database.js';

async function migrateStock() {
    try {
        console.log('Migrating stock...');
        const products = await query('SELECT id, stock_quantity FROM products');
        for (const product of products) {
            await run('INSERT OR IGNORE INTO stock_items (product_id, location_id, real_stock, reserved_stock) VALUES (?, 1, ?, 0)', [product.id, product.stock_quantity]);
            
            // Log initial movement
            await run(`
                INSERT INTO stock_movements (product_id, location_id, quantity, movement_type, reason, previous_real_stock, new_real_stock, previous_reserved_stock, new_reserved_stock)
                VALUES (?, 1, ?, 'addition', 'Initial Migration', 0, ?, 0, 0)
            `, [product.id, product.stock_quantity, product.stock_quantity]);
        }
        console.log('Stock migration completed.');
        db.close();
    } catch (err) {
        console.error('Migration error:', err);
    }
}
migrateStock();
