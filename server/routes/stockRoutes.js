import express from 'express';
import { getStockLocations, getProductStock, getStockMovements, adjustStock } from '../controllers/stockController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/locations', requireAuth, requireAdmin, getStockLocations);
router.get('/:id', requireAuth, requireAdmin, getProductStock);
router.get('/:id/movements', requireAuth, requireAdmin, getStockMovements);
router.post('/adjust', requireAuth, requireAdmin, adjustStock);

export default router;
