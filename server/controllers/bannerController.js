import { run, query, queryOne } from '../config/database.js';

export const getActiveBanners = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0]; // "2026-08-10"
        
        // Fetch active banners that fall within start_date and end_date scheduling bounds
        const activeBanners = await query(`
            SELECT * FROM banners
            WHERE status = 'active'
            AND (start_date IS NULL OR start_date <= ?)
            AND (end_date IS NULL OR end_date >= ?)
            ORDER BY sort_order ASC
        `, [today, today]);

        res.json(activeBanners);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve active banners.', error: err.message });
    }
};

export const getAllBanners = async (req, res) => {
    try {
        const list = await query('SELECT * FROM banners ORDER BY sort_order ASC, created_at DESC');
        res.json(list);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve banners.', error: err.message });
    }
};

export const createBanner = async (req, res) => {
    const { title, subtitle, description, type, media_url, thumbnail_url, button_text, button_url, status, sort_order, start_date, end_date } = req.body;

    if (!media_url) {
        return res.status(400).json({ message: 'Media URL is required.' });
    }

    try {
        const result = await run(
            `INSERT INTO banners (title, subtitle, description, type, media_url, thumbnail_url, button_text, button_url, status, sort_order, start_date, end_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title || null,
                subtitle || null,
                description || null,
                type || 'image',
                media_url,
                thumbnail_url || null,
                button_text || null,
                button_url || null,
                status || 'active',
                parseInt(sort_order, 10) || 0,
                start_date || null,
                end_date || null
            ]
        );

        res.status(201).json({
            id: result.lastID,
            message: 'Banner created successfully.'
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to create banner.', error: err.message });
    }
};

export const updateBanner = async (req, res) => {
    const { id } = req.params;
    const { title, subtitle, description, type, media_url, thumbnail_url, button_text, button_url, status, sort_order, start_date, end_date } = req.body;

    try {
        const banner = await queryOne('SELECT * FROM banners WHERE id = ?', [id]);
        if (!banner) {
            return res.status(404).json({ message: 'Banner not found.' });
        }

        await run(
            `UPDATE banners
             SET title = ?, subtitle = ?, description = ?, type = ?, media_url = ?, thumbnail_url = ?, button_text = ?, button_url = ?, status = ?, sort_order = ?, start_date = ?, end_date = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                title !== undefined ? title : banner.title,
                subtitle !== undefined ? subtitle : banner.subtitle,
                description !== undefined ? description : banner.description,
                type || banner.type,
                media_url || banner.media_url,
                thumbnail_url !== undefined ? thumbnail_url : banner.thumbnail_url,
                button_text !== undefined ? button_text : banner.button_text,
                button_url !== undefined ? button_url : banner.button_url,
                status || banner.status,
                sort_order !== undefined ? parseInt(sort_order, 10) : banner.sort_order,
                start_date !== undefined ? start_date : banner.start_date,
                end_date !== undefined ? end_date : banner.end_date,
                id
            ]
        );

        res.json({ message: 'Banner updated successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update banner.', error: err.message });
    }
};

export const deleteBanner = async (req, res) => {
    const { id } = req.params;

    try {
        const banner = await queryOne('SELECT * FROM banners WHERE id = ?', [id]);
        if (!banner) {
            return res.status(404).json({ message: 'Banner not found.' });
        }

        await run('DELETE FROM banners WHERE id = ?', [id]);
        res.json({ message: 'Banner deleted successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete banner.', error: err.message });
    }
};
