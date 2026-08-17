import { run, query, queryOne } from '../config/database.js';

export const getLoyaltySettings = async (req, res, next) => {
    try {
        const settings = await queryOne('SELECT * FROM loyalty_settings ORDER BY id DESC LIMIT 1');
        if (settings) {
            try {
                settings.qualifying_statuses = JSON.parse(settings.qualifying_statuses);
            } catch(e) {}
            try {
                settings.notify_days_before = JSON.parse(settings.notify_days_before);
            } catch(e) {}
        }
        res.json({ success: true, data: settings });
    } catch (err) {
        next(err);
    }
};

export const updateLoyaltySettings = async (req, res, next) => {
    const { 
        fidelity_enabled, required_orders, required_amount, qualifying_statuses, amount_method, notify_days_before, min_purchase_amount,
        code_expiration_days, code_format, discount_type, discount_value, usage_limit, is_single_use
    } = req.body;
    
    try {
        // Try to update the existing row first
        const existing = await queryOne('SELECT id FROM loyalty_settings LIMIT 1');
        if (existing) {
            await run(`
                UPDATE loyalty_settings SET
                    fidelity_enabled = ?, required_orders = ?, required_amount = ?,
                    qualifying_statuses = ?, amount_method = ?, notify_days_before = ?,
                    min_purchase_amount = ?, code_expiration_days = ?, code_format = ?,
                    discount_type = ?, discount_value = ?, usage_limit = ?, is_single_use = ?
                WHERE id = ?
            `, [
                fidelity_enabled ? 1 : 0, required_orders || 4, required_amount || 150,
                JSON.stringify(qualifying_statuses || ['Delivered']), amount_method || 'total_ht_excl_shipping',
                JSON.stringify(notify_days_before || [10, 5, 1]), min_purchase_amount || 0,
                code_expiration_days || 30, code_format || 'FID-{RANDOM}', discount_type || 'percentage',
                discount_value || 10, usage_limit || 1, is_single_use ? 1 : 0,
                existing.id
            ]);
        } else {
            await run(`
                INSERT INTO loyalty_settings (
                    fidelity_enabled, required_orders, required_amount, qualifying_statuses, amount_method, notify_days_before, min_purchase_amount,
                    code_expiration_days, code_format, discount_type, discount_value, usage_limit, is_single_use
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                fidelity_enabled ? 1 : 0, required_orders || 4, required_amount || 150,
                JSON.stringify(qualifying_statuses || ['Delivered']), amount_method || 'total_ht_excl_shipping',
                JSON.stringify(notify_days_before || [10, 5, 1]), min_purchase_amount || 0,
                code_expiration_days || 30, code_format || 'FID-{RANDOM}', discount_type || 'percentage',
                discount_value || 10, usage_limit || 1, is_single_use ? 1 : 0
            ]);
        }
        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (err) {
        next(err);
    }
};

export const getLoyaltyProgress = async (req, res, next) => {
    try {
        const data = await query(`
            SELECT lp.*, u.name as customer_name, u.email
            FROM loyalty_progress lp
            JOIN users u ON lp.customer_id = u.id
            ORDER BY lp.milestone_count DESC, lp.eligible_orders_count DESC
        `);
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
};

export const getLoyaltyCodes = async (req, res, next) => {
    try {
        const codes = await query(`
            SELECT lc.*, u.name as customer_name, u.email, o.order_number as qualifying_order_number
            FROM loyalty_codes lc
            JOIN users u ON lc.customer_id = u.id
            LEFT JOIN orders o ON lc.qualifying_order_id = o.id
            ORDER BY lc.created_at DESC
        `);
        res.json({ success: true, data: codes });
    } catch (err) {
        next(err);
    }
};

export const getCustomerLoyalty = async (req, res, next) => {
    const userId = req.user.id;
    try {
        const settings = await queryOne('SELECT * FROM loyalty_settings ORDER BY id DESC LIMIT 1');
        const progress = await queryOne('SELECT * FROM loyalty_progress WHERE customer_id = ?', [userId]);
        const codes = await query(`
            SELECT * FROM loyalty_codes WHERE customer_id = ? ORDER BY created_at DESC
        `, [userId]);

        const milestoneCount = progress?.milestone_count || 0;
        const targetMilestone = milestoneCount + 1;
        
        const requiredOrdersForNext = targetMilestone * (settings?.required_orders || 5);
        const requiredAmountForNext = targetMilestone * (settings?.required_amount || 150);
        
        const eligibleCount = progress?.eligible_orders_count || 0;
        const qualifyingAmount = progress?.qualifying_amount || 0;

        res.json({
            success: true,
            data: {
                fidelity_enabled: settings?.fidelity_enabled === 1,
                milestone_count: milestoneCount,
                eligible_orders_count: eligibleCount,
                qualifying_amount: qualifyingAmount,
                required_orders_for_next: requiredOrdersForNext,
                required_amount_for_next: requiredAmountForNext,
                orders_progress_percent: Math.min(100, Math.round((eligibleCount / requiredOrdersForNext) * 100)),
                amount_progress_percent: Math.min(100, Math.round((qualifyingAmount / requiredAmountForNext) * 100)),
                codes: codes
            }
        });
    } catch (err) {
        next(err);
    }
};

export const getCustomerLoyaltyStatus = async (req, res, next) => {
    const userId = req.user.id;
    try {
        const settings = await queryOne('SELECT * FROM loyalty_settings ORDER BY id DESC LIMIT 1');
        if (!settings || settings.fidelity_enabled !== 1) {
            return res.json({ success: true, data: { enabled: false } });
        }

        const progress = await queryOne('SELECT * FROM loyalty_progress WHERE customer_id = ?', [userId]);
        
        const milestoneCount = progress?.milestone_count || 0;
        const targetMilestone = milestoneCount + 1;
        const requiredOrdersForNext = targetMilestone * settings.required_orders;
        const requiredAmountForNext = targetMilestone * settings.required_amount;
        const eligibleCount = progress?.eligible_orders_count || 0;
        const qualifyingAmount = progress?.qualifying_amount || 0;

        // Check for available codes
        const availableCodes = await query(`
            SELECT * FROM loyalty_codes 
            WHERE customer_id = ? AND status = 'active' AND (expiration_date IS NULL OR expiration_date > CURRENT_TIMESTAMP)
            ORDER BY expiration_date ASC
        `, [userId]);

        res.json({
            success: true,
            data: {
                enabled: true,
                eligible_orders_count: eligibleCount,
                qualifying_amount: qualifyingAmount,
                required_orders_for_next: requiredOrdersForNext,
                required_amount_for_next: requiredAmountForNext,
                available_codes: availableCodes,
                discount_type: settings.discount_type,
                discount_value: settings.discount_value
            }
        });
    } catch (err) {
        next(err);
    }
};

export const cancelLoyaltyCode = async (req, res, next) => {
    try {
        await run(`UPDATE loyalty_codes SET status = 'cancelled' WHERE id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Loyalty code cancelled' });
    } catch (err) {
        next(err);
    }
};

export const validateLoyaltyCode = async (req, res, next) => {
    const { code } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!code) {
        return res.status(400).json({ message: 'Code is required.' });
    }

    const cleanCode = code.trim().toUpperCase();

    if (cleanCode === 'AURASTART') {
        return res.json({
            success: true,
            discount_type: 'percentage',
            discount_value: 15.0,
            code: 'AURASTART',
            message: 'Coupon code applied successfully! 15% discount.'
        });
    }

    try {
        const settings = await queryOne('SELECT * FROM loyalty_settings ORDER BY id DESC LIMIT 1');
        if (!settings || settings.fidelity_enabled !== 1) {
            return res.status(400).json({ message: 'Fidelity program is currently disabled.' });
        }

        const loyaltyCode = await queryOne('SELECT * FROM loyalty_codes WHERE UPPER(code) = ?', [cleanCode]);
        if (!loyaltyCode) {
            return res.status(404).json({ message: 'Invalid coupon code. Try "AURASTART"' });
        }

        if (!userId) {
            return res.status(401).json({ message: 'Please log in to use your fidelity/loyalty reward codes.' });
        }

        if (loyaltyCode.customer_id !== userId) {
            return res.status(403).json({ message: 'This coupon code does not belong to you.' });
        }

        if (loyaltyCode.status !== 'active') {
            return res.status(400).json({ message: `Coupon code is already ${loyaltyCode.status}.` });
        }

        if (loyaltyCode.expiration_date && new Date(loyaltyCode.expiration_date) < new Date()) {
            return res.status(400).json({ message: 'Coupon code has expired.' });
        }

        const discount_type = settings.discount_type;
        const discount_value = settings.discount_value;

        res.json({
            success: true,
            discount_type,
            discount_value,
            code: loyaltyCode.code,
            min_purchase_amount: settings.min_purchase_amount || 0,
            message: 'Coupon code applied successfully! ' + discount_value + (discount_type === 'percentage' ? '%' : ' DT') + ' discount.'
        });
    } catch (err) {
        next(err);
    }
};
