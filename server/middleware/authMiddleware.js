import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_ecom_key_2026');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

export const requireAdmin = (req, res, next) => {
    requireAuth(req, res, () => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
        }
        next();
    });
};

export const requireWarehouseOrAdmin = (req, res, next) => {
    requireAuth(req, res, () => {
        if (req.user.role !== 'admin' && req.user.role !== 'warehouse') {
            return res.status(403).json({ message: 'Access denied. Warehouse privileges required.' });
        }
        next();
    });
};

// Optional auth context (populates req.user if token is present, but doesn't block if not)
export const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_ecom_key_2026');
            req.user = decoded;
        } catch (err) {
            // Ignore invalid token and continue as guest
        }
    }
    next();
};
