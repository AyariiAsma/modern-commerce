import express from 'express';
import { requireWarehouseOrAdmin } from '../middleware/authMiddleware.js';
import { 
    lookupProduct, 
    importStock, 
    getPendingOrders, 
    getOrderDetails, 
    exportStockForOrder 
} from '../controllers/warehouseController.js';

const router = express.Router();

router.use(requireWarehouseOrAdmin);

router.get('/product/lookup', lookupProduct);
router.post('/stock/import', importStock);
router.get('/orders/pending', getPendingOrders);
router.get('/orders/:orderId', getOrderDetails);
router.post('/stock/export/:orderId', exportStockForOrder);

export default router;
