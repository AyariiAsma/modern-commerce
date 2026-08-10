import express from 'express';
import { getDashboardStats } from '../controllers/adminController.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', requireAdmin, getDashboardStats);

export default router;
