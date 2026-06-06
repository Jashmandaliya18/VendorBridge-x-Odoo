import express from 'express';
import {
  getVendors,
  getVendorStats,
  getMyVendorProfile,
  getVendor,
  createVendor,
  updateVendor,
  updateVendorStatus,
  deleteVendor,
} from '../controllers/vendorController.js';
import auth from '../middleware/auth.js';
import role from '../middleware/role.js';

const router = express.Router();

router.use(auth);
router.get('/', role(['admin', 'officer', 'manager']), getVendors);
router.get('/stats', role(['admin', 'officer', 'manager']), getVendorStats);
// Must be before /:id to avoid "my-profile" being treated as an ID
router.get('/my-profile', role(['vendor']), getMyVendorProfile);
router.get('/:id', role(['admin', 'officer', 'manager']), getVendor);
router.post('/', role(['admin', 'officer']), createVendor);
router.put('/:id', role(['admin', 'officer']), updateVendor);
router.patch('/:id/status', role(['admin']), updateVendorStatus);
router.delete('/:id', role(['admin']), deleteVendor);

export default router;
