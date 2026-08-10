import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { run, queryOne } from '../config/database.js';

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'super_secret_ecom_key_2026',
        { expiresIn: '7d' }
    );
};

export const register = async (req, res) => {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    try {
        // Check if user already exists
        const existingUser = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(400).json({ message: 'Email is already registered.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await run(
            `INSERT INTO users (name, email, password, phone, role, status) VALUES (?, ?, ?, ?, 'customer', 'active')`,
            [name, email, hashedPassword, phone || null]
        );

        const newUser = { id: result.lastID, name, email, role: 'customer', status: 'active' };
        const token = generateToken(newUser);

        res.status(201).json({
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error during registration.', error: err.message });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const user = await queryOne('SELECT * FROM users WHERE email = ?', [email]);
        if (!user || user.status === 'inactive') {
            return res.status(401).json({ message: 'Invalid credentials or inactive account.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = generateToken(user);
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                avatar: user.role === 'admin' 
                    ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
                    : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error during login.', error: err.message });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await queryOne('SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ?', [req.user.id]);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json({
            ...user,
            avatar: user.role === 'admin' 
                ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
                : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error retrieving profile.', error: err.message });
    }
};

export const updateMe = async (req, res) => {
    const { name, email, phone, password } = req.body;
    try {
        const currentUser = await queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (!currentUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Email conflict check
        if (email && email !== currentUser.email) {
            const emailCheck = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
            if (emailCheck) {
                return res.status(400).json({ message: 'Email is already taken.' });
            }
        }

        let updatedPassword = currentUser.password;
        if (password && password.trim() !== '') {
            updatedPassword = await bcrypt.hash(password, 10);
        }

        await run(
            `UPDATE users SET name = ?, email = ?, phone = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [name || currentUser.name, email || currentUser.email, phone || currentUser.phone, updatedPassword, req.user.id]
        );

        res.json({
            message: 'Profile updated successfully.',
            user: {
                id: req.user.id,
                name: name || currentUser.name,
                email: email || currentUser.email,
                phone: phone || currentUser.phone,
                role: currentUser.role
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error updating profile.', error: err.message });
    }
};
