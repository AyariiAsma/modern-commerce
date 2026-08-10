import express from 'express';
import { getActiveBanners, getAllBanners, createBanner, updateBanner, deleteBanner } from '../controllers/bannerController.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getActiveBanners);
router.get('/all', requireAdmin, getAllBanners);
router.post('/', requireAdmin, createBanner);
router.put('/:id', requireAdmin, updateBanner);
router.delete('/:id', requireAdmin, deleteBanner);

export default router;
