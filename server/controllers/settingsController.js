import { query, run, queryOne } from '../config/database.js';

export const getSettings = async (req, res, next) => {
    try {
        const settings = await query('SELECT * FROM settings');
        const settingsMap = {};
        settings.forEach(s => {
            if (!settingsMap[s.setting_group]) {
                settingsMap[s.setting_group] = {};
            }
            settingsMap[s.setting_group][s.setting_key] = s.setting_value;
        });
        res.json({ success: true, settings: settingsMap });
    } catch (err) {
        next(err);
    }
};

export const updateSettings = async (req, res, next) => {
    const { settings } = req.body; // Expecting array of { key, value }
    try {
        if (!Array.isArray(settings)) {
            return res.status(400).json({ message: 'Invalid settings format. Expected an array.' });
        }

        for (const s of settings) {
            // Upsert setting
            const existing = await queryOne('SELECT id FROM settings WHERE setting_key = ?', [s.key]);
            if (existing) {
                await run('UPDATE settings SET setting_value = ? WHERE setting_key = ?', [s.value, s.key]);
            } else {
                await run('INSERT INTO settings (setting_key, setting_value, setting_group) VALUES (?, ?, ?)', [s.key, s.value, s.group || 'general']);
            }
        }
        res.json({ success: true, message: 'Settings updated successfully.' });
    } catch (err) {
        next(err);
    }
};

export const getLoyaltySettings = async (req, res, next) => {
    try {
        const loyaltySettings = await queryOne('SELECT * FROM loyalty_settings ORDER BY id DESC LIMIT 1');
        res.json({ success: true, data: loyaltySettings || {} });
    } catch (err) {
        next(err);
    }
};

export const updateLoyaltySettings = async (req, res, next) => {
    const { required_orders, code_expiration_days, code_format, discount_type, discount_value, usage_limit, is_single_use, count_cancelled, count_refunded } = req.body;
    try {
        const existing = await queryOne('SELECT id FROM loyalty_settings ORDER BY id DESC LIMIT 1');
        if (existing) {
            await run(`
                UPDATE loyalty_settings 
                SET required_orders = ?, code_expiration_days = ?, code_format = ?, discount_type = ?, discount_value = ?, usage_limit = ?, is_single_use = ?, count_cancelled = ?, count_refunded = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [required_orders, code_expiration_days, code_format, discount_type, discount_value, usage_limit, is_single_use, count_cancelled, count_refunded, existing.id]);
        } else {
            await run(`
                INSERT INTO loyalty_settings (required_orders, code_expiration_days, code_format, discount_type, discount_value, usage_limit, is_single_use, count_cancelled, count_refunded)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [required_orders, code_expiration_days, code_format, discount_type, discount_value, usage_limit, is_single_use, count_cancelled, count_refunded]);
        }
        res.json({ success: true, message: 'Loyalty settings updated successfully.' });
    } catch (err) {
        next(err);
    }
};
