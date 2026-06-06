import express from 'express';
import auth from '../middleware/auth.js';
import { getNotifications, markNotificationRead, markAllRead } from '../controllers/notificationController.js';

const router = express.Router();
router.use(auth);

router.get('/', getNotifications);
router.patch('/:id/read', markNotificationRead);
router.patch('/read-all', markAllRead);

export default router;
