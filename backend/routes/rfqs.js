import express from 'express';
import auth from '../middleware/auth.js';
import role from '../middleware/role.js';
import {
  getRFQs,
  createRFQ,
  getRFQ,
  updateRFQ,
  publishRFQ,
  closeRFQ,
  deleteRFQ,
  uploadRFQAttachment,
  addRFQVendors,
  getRFQQuotations,
} from '../controllers/rfqController.js';
import upload from '../middleware/upload.js';

const router = express.Router();
router.use(auth);

router.get('/', role(['vendor', 'officer', 'manager', 'admin']), getRFQs);
router.post('/', role(['officer', 'admin']), createRFQ);
router.get('/:id', role(['vendor', 'officer', 'manager', 'admin']), getRFQ);
router.put('/:id', role(['officer', 'admin']), updateRFQ);
router.patch('/:id/publish', role(['officer', 'admin']), publishRFQ);
router.patch('/:id/close', role(['officer', 'admin']), closeRFQ);
router.delete('/:id', role(['officer', 'admin']), deleteRFQ);
router.post('/:id/attachments', role(['officer', 'admin']), upload.single('file'), uploadRFQAttachment);
router.post('/:id/vendors', role(['officer', 'admin']), addRFQVendors);
router.get('/:rfqId/quotations', role(['officer', 'manager', 'admin']), getRFQQuotations);

export default router;
