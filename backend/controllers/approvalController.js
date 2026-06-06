import asyncHandler from 'express-async-handler';
import Approval from '../models/Approval.js';
import Quotation from '../models/Quotation.js';
import RFQ from '../models/RFQ.js';
import { logActivity } from '../utils/logActivity.js';

export const getApprovals = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const approvals = await Approval.find(filter).populate('rfq quotation initiatedBy levels.approver');
  res.json(approvals);
});

export const getPendingApprovals = asyncHandler(async (req, res) => {
  const approvals = await Approval.find({ 'levels.status': 'pending' }).populate('rfq quotation levels.approver');
  res.json(approvals);
});

export const getApproval = asyncHandler(async (req, res) => {
  const approval = await Approval.findById(req.params.id).populate('rfq quotation initiatedBy levels.approver');
  if (!approval) {
    res.status(404);
    throw new Error('Approval not found');
  }
  res.json(approval);
});

export const approveRequest = asyncHandler(async (req, res) => {
  const approval = await Approval.findById(req.params.id);
  if (!approval) {
    res.status(404);
    throw new Error('Approval not found');
  }
  const current = approval.levels.find((level) => level.status === 'pending');
  if (!current) {
    res.status(400);
    throw new Error('Approval workflow already complete');
  }
  current.status = 'approved';
  current.remarks = req.body.remarks;
  current.actionedAt = new Date();
  const nextLevel = approval.levels.find((level) => level.level === current.level + 1);
  if (!nextLevel) {
    approval.status = 'approved';
    const quotation = await Quotation.findById(approval.quotation);
    const rfq = await RFQ.findById(approval.rfq);
    if (quotation) quotation.status = 'selected';
    if (rfq) rfq.status = 'closed';
    await quotation?.save();
    await rfq?.save();
  }
  await approval.save();
  await logActivity({ eventType: 'approval', description: `Approval level ${current.level} approved`, performedBy: req.user._id, entityId: approval._id, entityType: 'Approval' });
  res.json(approval);
});

export const rejectRequest = asyncHandler(async (req, res) => {
  const approval = await Approval.findById(req.params.id);
  if (!approval) {
    res.status(404);
    throw new Error('Approval not found');
  }
  const current = approval.levels.find((level) => level.status === 'pending');
  if (!current) {
    res.status(400);
    throw new Error('Approval workflow already complete');
  }
  current.status = 'rejected';
  current.remarks = req.body.remarks;
  current.actionedAt = new Date();
  approval.status = 'rejected';
  await approval.save();
  await logActivity({ eventType: 'approval', description: `Approval rejected at level ${current.level}`, performedBy: req.user._id, entityId: approval._id, entityType: 'Approval' });
  res.json(approval);
});
