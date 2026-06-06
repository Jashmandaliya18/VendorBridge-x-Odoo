import asyncHandler from 'express-async-handler';
import ActivityLog from '../models/ActivityLog.js';

export const getActivityLogs = asyncHandler(async (req, res) => {
  const { type, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (type) filter.eventType = type;
  const logs = await ActivityLog.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  res.json(logs);
});
