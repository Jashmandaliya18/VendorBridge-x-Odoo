import express from 'express';
import upload from '../middleware/upload.js';
import {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  updateMe,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/register', upload.single('photo'), registerUser);
router.post('/login', loginUser);
router.post('/logout', auth, logoutUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', auth, getMe);
router.put('/me', auth, updateMe);

export default router;
