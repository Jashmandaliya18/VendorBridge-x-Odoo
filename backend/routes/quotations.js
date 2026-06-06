import express from 'express';
import auth from '../middleware/auth.js';
import role from '../middleware/role.js';
import {
  getQuotations,
  createQuotation,
  getQuotation,
  updateQuotation,
  submitQuotation,
  selectQuotation,
  rejectQuotation,
} from '../controllers/quotationController.js';

const router = express.Router();
router.use(auth);

router.get('/', role(['officer', 'manager', 'admin', 'vendor']), getQuotations);
router.post('/', role(['vendor']), createQuotation);
router.get('/:id', role(['officer', 'manager', 'admin', 'vendor']), getQuotation);
router.put('/:id', role(['vendor']), updateQuotation);
router.patch('/:id/submit', role(['vendor']), submitQuotation);
router.patch('/:id/select', role(['officer', 'admin']), selectQuotation);
router.patch('/:id/reject', role(['officer', 'manager', 'admin']), rejectQuotation);

export default router;
