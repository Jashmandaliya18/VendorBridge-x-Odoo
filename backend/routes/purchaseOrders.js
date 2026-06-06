import express from 'express';
import auth from '../middleware/auth.js';
import role from '../middleware/role.js';
import {
  getPurchaseOrders,
  createPO,
  getPO,
  updatePOStatus,
  downloadPOPdf,
  sendPOEmail,
} from '../controllers/purchaseOrderController.js';

const router = express.Router();
router.use(auth);

router.get('/', role(['officer', 'admin', 'manager']), getPurchaseOrders);
router.post('/', role(['officer', 'admin']), createPO);
router.get('/:id', getPO);
router.patch('/:id/status', role(['officer', 'admin']), updatePOStatus);
router.get('/:id/pdf', role(['officer', 'admin']), downloadPOPdf);
router.post('/:id/send-email', role(['officer', 'admin']), sendPOEmail);

export default router;
