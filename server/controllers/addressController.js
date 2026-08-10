import { run, query, queryOne } from '../config/database.js';

export const getAddresses = async (req, res) => {
    try {
        const list = await query(
            'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
            [req.user.id]
        );
        res.json(list);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve addresses.', error: err.message });
    }
};

export const createAddress = async (req, res) => {
    const { first_name, last_name, phone, address_line_1, address_line_2, city, postal_code, country, additional_information, is_default } = req.body;

    if (!first_name || !last_name || !phone || !address_line_1 || !city || !postal_code || !country) {
        return res.status(400).json({ message: 'First name, last name, phone, address line 1, city, postal code, and country are required.' });
    }

    try {
        const defaultVal = is_default ? 1 : 0;

        // If this is set to default, clear previous defaults for this user
        if (defaultVal === 1) {
            await run('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
        }

        // If it's the user's first address, make it default automatically
        const countRes = await queryOne('SELECT count(*) as count FROM addresses WHERE user_id = ?', [req.user.id]);
        const forceDefault = countRes.count === 0 ? 1 : defaultVal;

        const result = await run(
            `INSERT INTO addresses (user_id, first_name, last_name, phone, address_line_1, address_line_2, city, postal_code, country, additional_information, is_default)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                first_name,
                last_name,
                phone,
                address_line_1,
                address_line_2 || null,
                city,
                postal_code,
                country,
                additional_information || null,
                forceDefault
            ]
        );

        res.status(201).json({
            id: result.lastID,
            is_default: forceDefault,
            message: 'Address added successfully.'
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to create address.', error: err.message });
    }
};

export const updateAddress = async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, phone, address_line_1, address_line_2, city, postal_code, country, additional_information, is_default } = req.body;

    try {
        const address = await queryOne('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [id, req.user.id]);
        if (!address) {
            return res.status(404).json({ message: 'Address not found or unauthorized.' });
        }

        const defaultVal = is_default !== undefined ? (is_default ? 1 : 0) : address.is_default;

        if (defaultVal === 1 && address.is_default === 0) {
            await run('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
        }

        await run(
            `UPDATE addresses
             SET first_name = ?, last_name = ?, phone = ?, address_line_1 = ?, address_line_2 = ?, city = ?, postal_code = ?, country = ?, additional_information = ?, is_default = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND user_id = ?`,
            [
                first_name || address.first_name,
                last_name || address.last_name,
                phone || address.phone,
                address_line_1 || address.address_line_1,
                address_line_2 !== undefined ? address_line_2 : address.address_line_2,
                city || address.city,
                postal_code || address.postal_code,
                country || address.country,
                additional_information !== undefined ? additional_information : address.additional_information,
                defaultVal,
                id,
                req.user.id
            ]
        );

        res.json({ message: 'Address updated successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update address.', error: err.message });
    }
};

export const deleteAddress = async (req, res) => {
    const { id } = req.params;

    try {
        const address = await queryOne('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [id, req.user.id]);
        if (!address) {
            return res.status(404).json({ message: 'Address not found or unauthorized.' });
        }

        await run('DELETE FROM addresses WHERE id = ?', [id]);

        // If we deleted the default, make another one default
        if (address.is_default === 1) {
            const nextAddr = await queryOne('SELECT id FROM addresses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [req.user.id]);
            if (nextAddr) {
                await run('UPDATE addresses SET is_default = 1 WHERE id = ?', [nextAddr.id]);
            }
        }

        res.json({ message: 'Address deleted successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete address.', error: err.message });
    }
};

export const setDefaultAddress = async (req, res) => {
    const { id } = req.params;

    try {
        const address = await queryOne('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [id, req.user.id]);
        if (!address) {
            return res.status(404).json({ message: 'Address not found or unauthorized.' });
        }

        await run('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
        await run('UPDATE addresses SET is_default = 1 WHERE id = ?', [id]);

        res.json({ message: 'Default address set successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to set default address.', error: err.message });
    }
};
