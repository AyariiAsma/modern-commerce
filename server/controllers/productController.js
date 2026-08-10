import { run, query, queryOne } from '../config/database.js';

export const getAllProducts = async (req, res) => {
    const { search, category, sort_by, status, featured, page = 1, limit = 20 } = req.query;

    let sql = `
        SELECT p.*, c.name as category_name, c.slug as category_slug,
               COALESCE((SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1), '') as image,
               COALESCE(si.real_stock, 0) as real_stock,
               COALESCE(si.reserved_stock, 0) as reserved_stock,
               (COALESCE(si.real_stock, 0) - COALESCE(si.reserved_stock, 0)) as stock_quantity,
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
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN stock_items si ON p.id = si.product_id AND si.location_id = 1
        WHERE 1=1
    `;
    const params = [];

    if (search) {
        sql += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.SKU LIKE ?)`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
    }

    if (category) {
        sql += ` AND c.slug = ?`;
        params.push(category);
    }

    if (status) {
        sql += ` AND p.status = ?`;
        params.push(status);
    }

    if (featured !== undefined) {
        sql += ` AND p.featured = ?`;
        params.push(parseInt(featured, 10));
    }

    // Sort order mapping
    if (sort_by === 'price_asc') {
        sql += ` ORDER BY COALESCE(
            (SELECT CASE WHEN prm.discount_type = 'percentage' THEN p.price - (p.price * (prm.discount_value / 100)) WHEN prm.discount_type = 'fixed' THEN p.price - prm.discount_value WHEN prm.discount_type = 'special_price' THEN prm.discount_value END FROM promotions prm JOIN promotion_targets pt ON pt.promotion_id = prm.id WHERE prm.status = 'active' AND (prm.start_datetime IS NULL OR prm.start_datetime <= datetime('now', 'localtime')) AND (prm.end_datetime IS NULL OR prm.end_datetime >= datetime('now', 'localtime')) AND ((pt.target_type = 'product' AND pt.target_id = p.id) OR (pt.target_type = 'category' AND pt.target_id = p.category_id)) ORDER BY prm.priority DESC LIMIT 1),
            p.discount_price, p.price) ASC`;
    } else if (sort_by === 'price_desc') {
        sql += ` ORDER BY COALESCE(
            (SELECT CASE WHEN prm.discount_type = 'percentage' THEN p.price - (p.price * (prm.discount_value / 100)) WHEN prm.discount_type = 'fixed' THEN p.price - prm.discount_value WHEN prm.discount_type = 'special_price' THEN prm.discount_value END FROM promotions prm JOIN promotion_targets pt ON pt.promotion_id = prm.id WHERE prm.status = 'active' AND (prm.start_datetime IS NULL OR prm.start_datetime <= datetime('now', 'localtime')) AND (prm.end_datetime IS NULL OR prm.end_datetime >= datetime('now', 'localtime')) AND ((pt.target_type = 'product' AND pt.target_id = p.id) OR (pt.target_type = 'category' AND pt.target_id = p.category_id)) ORDER BY prm.priority DESC LIMIT 1),
            p.discount_price, p.price) DESC`;
    } else {
        sql += ` ORDER BY p.created_at DESC`;
    }

    // Pagination
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), offset);

    try {
        const productsList = await query(sql, params);
        res.json(productsList);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve products.', error: err.message });
    }
};

export const getProductById = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await queryOne(`
            SELECT p.*, c.name as category_name, c.slug as category_slug,
                   COALESCE(si.real_stock, 0) as real_stock,
                   COALESCE(si.reserved_stock, 0) as reserved_stock,
                   (COALESCE(si.real_stock, 0) - COALESCE(si.reserved_stock, 0)) as stock_quantity,
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
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN stock_items si ON p.id = si.product_id AND si.location_id = 1
            WHERE p.id = ?
        `, [id]);

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // Fetch multiple images
        const images = await query(`
            SELECT id, image_url, is_primary FROM product_images WHERE product_id = ? ORDER BY is_primary DESC
        `, [id]);

        product.images = images.map(img => img.image_url);
        product.imagesDetail = images;
        // Backward compatibility primary image field
        product.image = images.find(img => img.is_primary === 1)?.image_url || images[0]?.image_url || '';

        res.json(product);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve product details.', error: err.message });
    }
};

export const createProduct = async (req, res) => {
    const { category_id, name, description, price, discount_price, SKU, stock_quantity, status, featured, images, tva_rate } = req.body;
    const userId = req.user?.id || null;

    if (!category_id || !name || !price || !SKU) {
        return res.status(400).json({ message: 'Category, name, price, and SKU are required fields.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    try {
        await run('BEGIN TRANSACTION');

        const duplicateSKU = await queryOne('SELECT id FROM products WHERE SKU = ?', [SKU]);
        if (duplicateSKU) {
            await run('ROLLBACK');
            return res.status(400).json({ message: 'SKU is already in use by another product.' });
        }

        // Insert product
        const result = await run(
            `INSERT INTO products (category_id, name, slug, description, price, discount_price, SKU, status, featured, tva_rate)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                category_id,
                name,
                slug,
                description || null,
                parseFloat(price),
                discount_price ? parseFloat(discount_price) : null,
                SKU,
                status || 'active',
                featured ? 1 : 0,
                parseFloat(tva_rate) || 0
            ]
        );

        const newProductId = result.lastID;

        // Save initial stock in stock_items
        const initialStock = parseInt(stock_quantity, 10) || 0;
        await run('INSERT INTO stock_items (product_id, location_id, real_stock, reserved_stock) VALUES (?, 1, ?, 0)', [newProductId, initialStock]);
        
        if (initialStock > 0) {
            await run(`
                INSERT INTO stock_movements (product_id, location_id, quantity, movement_type, reason, reference_type, previous_real_stock, new_real_stock, previous_reserved_stock, new_reserved_stock, user_id)
                VALUES (?, 1, ?, 'addition', 'Initial stock on creation', 'product_creation', 0, ?, 0, 0, ?)
            `, [newProductId, initialStock, initialStock, userId]);
        }

        if (Array.isArray(images) && images.length > 0) {
            for (let i = 0; i < images.length; i++) {
                await run(
                    `INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)`,
                    [newProductId, images[i], i === 0 ? 1 : 0]
                );
            }
        }

        await run('COMMIT');

        res.status(201).json({
            id: newProductId,
            message: 'Product created successfully.'
        });
    } catch (err) {
        await run('ROLLBACK');
        res.status(500).json({ message: 'Failed to create product.', error: err.message });
    }
};

export const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { category_id, name, description, price, discount_price, SKU, status, featured, images, tva_rate } = req.body;
    // Note: stock_quantity update from this endpoint is deprecated. Admins should use /api/stock/adjust.
    // However, if we need to support it, we could handle it. We will just ignore it here to force using Stock manager.

    try {
        const product = await queryOne('SELECT * FROM products WHERE id = ?', [id]);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        if (SKU && SKU !== product.SKU) {
            const duplicateSKU = await queryOne('SELECT id FROM products WHERE SKU = ?', [SKU]);
            if (duplicateSKU) {
                return res.status(400).json({ message: 'SKU is already in use.' });
            }
        }

        const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : product.slug;

        await run(
            `UPDATE products
             SET category_id = ?, name = ?, slug = ?, description = ?, price = ?, discount_price = ?, SKU = ?, status = ?, featured = ?, tva_rate = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                category_id !== undefined ? category_id : product.category_id,
                name || product.name,
                slug,
                description !== undefined ? description : product.description,
                price !== undefined ? parseFloat(price) : product.price,
                discount_price !== undefined ? (discount_price ? parseFloat(discount_price) : null) : product.discount_price,
                SKU || product.SKU,
                status || product.status,
                featured !== undefined ? (featured ? 1 : 0) : product.featured,
                tva_rate !== undefined ? parseFloat(tva_rate) : product.tva_rate,
                id
            ]
        );

        if (Array.isArray(images)) {
            await run('DELETE FROM product_images WHERE product_id = ?', [id]);
            for (let i = 0; i < images.length; i++) {
                await run(
                    `INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)`,
                    [id, images[i], i === 0 ? 1 : 0]
                );
            }
        }

        res.json({ message: 'Product updated successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update product.', error: err.message });
    }
};

export const deleteProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await queryOne('SELECT * FROM products WHERE id = ?', [id]);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        await run('DELETE FROM products WHERE id = ?', [id]);
        res.json({ message: 'Product and associated data deleted successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete product.', error: err.message });
    }
};
