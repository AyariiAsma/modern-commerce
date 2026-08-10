import express from 'express';
import { getInvoices, getCreditNotes, issueCreditNote } from '../controllers/invoiceController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', requireAuth, requireAdmin, getInvoices);
router.get('/credit-notes', requireAuth, requireAdmin, getCreditNotes);
router.post('/credit-notes', requireAuth, requireAdmin, issueCreditNote);

export default router;
