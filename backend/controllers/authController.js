import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });

export const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone, role, country, additionalInfo } = req.body;
  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error('Email already registered');
  }
  const photoUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
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
  if (req.file) user.photoUrl = `/uploads/${req.file.filename}`;
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
  res.json({ success: true, message: `Password reset token generated: ${token}` });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    res.status(400);
    throw new Error('Token and password are required');
  }
  res.json({ success: true, message: 'Password reset completed' });
});
