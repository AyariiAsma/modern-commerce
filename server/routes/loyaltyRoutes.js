import express from 'express';
import { 
    getLoyaltyProgress, getLoyaltyCodes, getCustomerLoyalty, cancelLoyaltyCode, validateLoyaltyCode,
    getLoyaltySettings, updateLoyaltySettings, getCustomerLoyaltyStatus
} from '../controllers/loyaltyController.js';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Customer routes
router.get('/me', requireAuth, getCustomerLoyalty);
router.get('/status', requireAuth, getCustomerLoyaltyStatus);
router.post('/validate', optionalAuth, validateLoyaltyCode);

// Admin routes
router.get('/settings', requireAuth, requireAdmin, getLoyaltySettings);
router.put('/settings', requireAuth, requireAdmin, updateLoyaltySettings);
router.get('/progress', requireAuth, requireAdmin, getLoyaltyProgress);
router.get('/codes', requireAuth, requireAdmin, getLoyaltyCodes);
router.put('/codes/:id/cancel', requireAuth, requireAdmin, cancelLoyaltyCode);

export default router;
