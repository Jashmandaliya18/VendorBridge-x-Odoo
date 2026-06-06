import express from 'express';
import auth from '../middleware/auth.js';
import role from '../middleware/role.js';
import { getApprovals, getPendingApprovals, getApproval, approveRequest, rejectRequest } from '../controllers/approvalController.js';

const router = express.Router();
router.use(auth);

router.get('/', role(['manager', 'admin', 'officer']), getApprovals);
router.get('/pending', role(['manager', 'admin']), getPendingApprovals);
router.get('/:id', getApproval);
router.post('/:id/approve', role(['manager', 'admin']), approveRequest);
router.post('/:id/reject', role(['manager', 'admin']), rejectRequest);

export default router;
