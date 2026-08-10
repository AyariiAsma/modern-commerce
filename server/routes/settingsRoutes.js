import express from 'express';
import { getSettings, updateSettings, getLoyaltySettings, updateLoyaltySettings } from '../controllers/settingsController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getSettings);
router.put('/', requireAuth, requireAdmin, updateSettings);

router.get('/loyalty', requireAuth, requireAdmin, getLoyaltySettings);
router.put('/loyalty', requireAuth, requireAdmin, updateLoyaltySettings);

export default router;
