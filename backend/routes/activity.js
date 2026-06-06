import express from 'express';
import auth from '../middleware/auth.js';
import role from '../middleware/role.js';
import { getActivityLogs } from '../controllers/activityController.js';

const router = express.Router();
router.use(auth);
router.get('/', role(['admin', 'officer', 'manager']), getActivityLogs);

export default router;
