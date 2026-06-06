import express from 'express';
import auth from '../middleware/auth.js';
import role from '../middleware/role.js';
import { getSummary, getSpendingTrend, getVendorPerformance, exportReport } from '../controllers/reportController.js';

const router = express.Router();
router.use(auth);
router.get('/summary', role(['admin', 'manager']), getSummary);
router.get('/spending-trend', role(['admin', 'manager']), getSpendingTrend);
router.get('/vendor-performance', role(['admin']), getVendorPerformance);
router.get('/export', role(['admin']), exportReport);

export default router;
