import express from 'express';
import { createOrder, previewOrder, getOrders, getOrderById, updateOrderStatus, updatePaymentStatus } from '../controllers/orderController.js';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', optionalAuth, createOrder);
router.post('/preview', optionalAuth, previewOrder);
router.get('/', requireAuth, getOrders);
router.get('/:id', requireAuth, getOrderById);
router.put('/:id/status', requireAdmin, updateOrderStatus);
router.put('/:id/payment', requireAdmin, updatePaymentStatus);

export default router;
