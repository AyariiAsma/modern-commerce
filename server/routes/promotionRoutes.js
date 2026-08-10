import express from 'express';
import { getPromotions, getPromotionById, createPromotion, updatePromotion, deletePromotion } from '../controllers/promotionsController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getPromotions);
router.get('/:id', getPromotionById);
router.post('/', requireAuth, requireAdmin, createPromotion);
router.put('/:id', requireAuth, requireAdmin, updatePromotion);
router.delete('/:id', requireAuth, requireAdmin, deletePromotion);

export default router;
