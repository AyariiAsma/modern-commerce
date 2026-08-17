import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Route imports
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import promotionRoutes from './routes/promotionRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import loyaltyRoutes from './routes/loyaltyRoutes.js';
import warehouseRoutes from './routes/warehouseRoutes.js';
import { mountDbBrowser } from './utils/dbBrowser.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());

// Serve static uploaded files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/warehouse', warehouseRoutes);

// Root path fallback
app.get('/', (req, res) => {
    res.json({ message: 'E-Commerce REST API is running successfully.' });
});

// Health check endpoint for UptimeRobot / Cron jobs
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// DB Browser (dev only)
mountDbBrowser(app);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'An unexpected error occurred on the server.',
        error: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
});

app.listen(PORT, () => {
    console.log(`Express server running on port ${PORT}`);
});
