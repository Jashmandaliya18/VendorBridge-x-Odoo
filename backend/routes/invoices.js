import express from 'express';
import auth from '../middleware/auth.js';
import role from '../middleware/role.js';
import {
  getInvoices,
  createInvoice,
  getInvoice,
  downloadInvoicePdf,
  sendInvoiceEmail,
  markInvoicePaid,
} from '../controllers/invoiceController.js';

const router = express.Router();
router.use(auth);

router.get('/', role(['officer', 'admin', 'manager', 'vendor']), getInvoices);
router.post('/', role(['officer', 'admin', 'vendor']), createInvoice);
router.get('/:id', getInvoice);
router.get('/:id/pdf', role(['officer', 'admin', 'manager', 'vendor']), downloadInvoicePdf);
router.post('/:id/send-email', role(['officer', 'admin']), sendInvoiceEmail);
router.patch('/:id/mark-paid', role(['officer', 'admin']), markInvoicePaid);

export default router;
