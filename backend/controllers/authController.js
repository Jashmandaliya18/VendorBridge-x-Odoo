import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendEmail } from '../utils/emailSender.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });

export const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone, role, country, additionalInfo } = req.body;
  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error('Email already registered');
  }
  const photoUrl = req.file ? await uploadToCloudinary(req.file.path, 'users') : undefined;
  const user = await User.create({ firstName, lastName, email, password, phone, role, country, additionalInfo, photoUrl });
  res.status(201).json({ accessToken: generateToken(user._id), user: { _id: user._id, firstName, lastName, email, role, photoUrl } });
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid credentials');
  }
  res.json({ accessToken: generateToken(user._id), user: { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, photoUrl: user.photoUrl } });
});

export const logoutUser = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const updates = ['firstName', 'lastName', 'phone', 'country', 'additionalInfo'];
  updates.forEach((field) => { if (req.body[field] !== undefined) user[field] = req.body[field]; });
  if (req.body.password) user.password = req.body.password;
  if (req.file) user.photoUrl = await uploadToCloudinary(req.file.path, 'users');
  await user.save();
  res.json({ success: true, user });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const token = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  const html = `
    <h1>Password Reset Request</h1>
    <p>You requested a password reset for your VendorBridge account. Please click the link below to reset your password:</p>
    <a href="${resetUrl}" style="background-color: #0D9488; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
    <p>This link is valid for 1 hour. If you did not request this, please ignore this email.</p>
  `;

  await sendEmail({
    to: user.email,
    subject: 'VendorBridge Password Reset',
    html,
  });

  res.json({ success: true, message: 'Password reset link sent to email' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    res.status(400);
    throw new Error('Token and password are required');
  }

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired password reset token');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({ success: true, message: 'Password reset successful' });
});
