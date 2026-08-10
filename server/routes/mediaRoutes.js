import express from 'express';
import { uploadMedia, getMedia, deleteMedia } from '../controllers/mediaController.js';
import { requireAdmin } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/upload', requireAdmin, upload.single('file'), uploadMedia);
router.get('/', requireAdmin, getMedia);
router.delete('/:id', requireAdmin, deleteMedia);

export default router;
