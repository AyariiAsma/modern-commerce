import { run, query, queryOne } from '../config/database.js';

export const getPromotions = async (req, res, next) => {
    try {
        const promotions = await query('SELECT * FROM promotions ORDER BY priority DESC, created_at DESC');
        for (const promo of promotions) {
            promo.targets = await query('SELECT * FROM promotion_targets WHERE promotion_id = ?', [promo.id]);
        }
        res.json({ success: true, data: promotions });
    } catch (err) {
        next(err);
    }
};

export const getPromotionById = async (req, res, next) => {
    try {
        const promo = await queryOne('SELECT * FROM promotions WHERE id = ?', [req.params.id]);
        if (!promo) return res.status(404).json({ message: 'Promotion not found' });
        
        promo.targets = await query('SELECT * FROM promotion_targets WHERE promotion_id = ?', [promo.id]);
        res.json({ success: true, data: promo });
    } catch (err) {
        next(err);
    }
};

export const createPromotion = async (req, res, next) => {
    const { name, description, type, status, start_datetime, end_datetime, priority, discount_type, discount_value, targets } = req.body;
    const userId = req.user?.id || null;

    try {
        await run('BEGIN TRANSACTION');

        const result = await run(`
            INSERT INTO promotions (name, description, type, status, start_datetime, end_datetime, priority, discount_type, discount_value)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [name, description, type, status || 'active', start_datetime, end_datetime, priority || 0, discount_type, discount_value]);
        
        const promoId = result.lastID;

        if (Array.isArray(targets)) {
            for (const target of targets) {
                await run(`INSERT INTO promotion_targets (promotion_id, target_type, target_id) VALUES (?, ?, ?)`, [promoId, target.type, target.id]);
                
                // If target is a product, log to price_histories
                if (target.type === 'product') {
                    const product = await queryOne('SELECT price FROM products WHERE id = ?', [target.id]);
                    if (product) {
                        let promoPrice = product.price;
                        if (discount_type === 'percentage') promoPrice = product.price - (product.price * (discount_value / 100));
                        else if (discount_type === 'fixed') promoPrice = product.price - discount_value;
                        else if (discount_type === 'special_price') promoPrice = discount_value;

                        await run(`
                            INSERT INTO price_histories (product_id, original_price, promotional_price, promotion_id, start_datetime, end_datetime, created_by)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        `, [target.id, product.price, promoPrice, promoId, start_datetime, end_datetime, userId]);
                    }
                }
            }
        }

        await run('COMMIT');
        res.status(201).json({ success: true, id: promoId, message: 'Promotion created successfully' });
    } catch (err) {
        await run('ROLLBACK');
        next(err);
    }
};

export const updatePromotion = async (req, res, next) => {
    const { id } = req.params;
    const { name, description, type, status, start_datetime, end_datetime, priority, discount_type, discount_value, targets } = req.body;

    try {
        await run('BEGIN TRANSACTION');
        
        await run(`
            UPDATE promotions SET name=?, description=?, type=?, status=?, start_datetime=?, end_datetime=?, priority=?, discount_type=?, discount_value=?, updated_at=CURRENT_TIMESTAMP
            WHERE id=?
        `, [name, description, type, status, start_datetime, end_datetime, priority, discount_type, discount_value, id]);

        if (Array.isArray(targets)) {
            await run('DELETE FROM promotion_targets WHERE promotion_id = ?', [id]);
            for (const target of targets) {
                await run(`INSERT INTO promotion_targets (promotion_id, target_type, target_id) VALUES (?, ?, ?)`, [id, target.type, target.id]);
            }
        }
        
        await run('COMMIT');
        res.json({ success: true, message: 'Promotion updated successfully' });
    } catch (err) {
        await run('ROLLBACK');
        next(err);
    }
};

export const deletePromotion = async (req, res, next) => {
    try {
        await run('DELETE FROM promotions WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Promotion deleted' });
    } catch (err) {
        next(err);
    }
};
