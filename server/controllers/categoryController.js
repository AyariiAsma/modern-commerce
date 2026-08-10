import { run, query, queryOne } from '../config/database.js';

export const getAllCategories = async (req, res) => {
    try {
        const categories = await query('SELECT * FROM categories ORDER BY sort_order ASC, name ASC');
        
        // Return a tree structure for subcategories
        const categoryMap = {};
        const roots = [];

        categories.forEach(cat => {
            categoryMap[cat.id] = { ...cat, subcategories: [] };
        });

        categories.forEach(cat => {
            const mappedCat = categoryMap[cat.id];
            if (cat.parent_id) {
                const parent = categoryMap[cat.parent_id];
                if (parent) {
                    parent.subcategories.push(mappedCat);
                } else {
                    roots.push(mappedCat); // fallback if parent is missing
                }
            } else {
                roots.push(mappedCat);
            }
        });

        res.json(roots);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve categories.', error: err.message });
    }
};

export const createCategory = async (req, res) => {
    const { name, parent_id, description, image, status, sort_order, thumbnail, alt_text } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Category name is required.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    try {
        // Verify unique slug
        const duplicate = await queryOne('SELECT id FROM categories WHERE slug = ?', [slug]);
        if (duplicate) {
            return res.status(400).json({ message: 'A category with this name already exists.' });
        }

        const result = await run(
            `INSERT INTO categories (parent_id, name, slug, description, image, thumbnail, alt_text, status, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                parent_id || null,
                name,
                slug,
                description || null,
                image || null,
                thumbnail || null,
                alt_text || null,
                status || 'active',
                parseInt(sort_order, 10) || 0
            ]
        );

        res.status(201).json({
            id: result.lastID,
            slug,
            message: 'Category created successfully.'
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to create category.', error: err.message });
    }
};

export const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, parent_id, description, image, status, sort_order, thumbnail, alt_text } = req.body;

    try {
        const category = await queryOne('SELECT * FROM categories WHERE id = ?', [id]);
        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        let slug = category.slug;
        if (name && name !== category.name) {
            slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const duplicate = await queryOne('SELECT id FROM categories WHERE slug = ? AND id != ?', [slug, id]);
            if (duplicate) {
                return res.status(400).json({ message: 'Another category with this name already exists.' });
            }
        }

        // Prevent setting a category as its own parent
        if (parent_id && parseInt(parent_id, 10) === parseInt(id, 10)) {
            return res.status(400).json({ message: 'A category cannot be its own parent.' });
        }

        await run(
            `UPDATE categories
             SET parent_id = ?, name = ?, slug = ?, description = ?, image = ?, thumbnail = ?, alt_text = ?, status = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                parent_id !== undefined ? (parent_id ? parseInt(parent_id, 10) : null) : category.parent_id,
                name || category.name,
                slug,
                description !== undefined ? description : category.description,
                image !== undefined ? image : category.image,
                thumbnail !== undefined ? thumbnail : category.thumbnail,
                alt_text !== undefined ? alt_text : category.alt_text,
                status || category.status,
                sort_order !== undefined ? parseInt(sort_order, 10) : category.sort_order,
                id
            ]
        );

        res.json({ message: 'Category updated successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update category.', error: err.message });
    }
};

export const deleteCategory = async (req, res) => {
    const { id } = req.params;

    try {
        const category = await queryOne('SELECT * FROM categories WHERE id = ?', [id]);
        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        // Check if there are active products using this category
        const productsCount = await queryOne('SELECT count(*) as count FROM products WHERE category_id = ?', [id]);
        if (productsCount.count > 0) {
            return res.status(400).json({ message: 'Cannot delete category containing active products. Re-assign products first.' });
        }

        // Set subcategories parent to null
        await run('UPDATE categories SET parent_id = NULL WHERE parent_id = ?', [id]);

        await run('DELETE FROM categories WHERE id = ?', [id]);
        res.json({ message: 'Category deleted successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete category.', error: err.message });
    }
};
