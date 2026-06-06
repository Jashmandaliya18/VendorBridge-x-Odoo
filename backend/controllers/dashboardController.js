import asyncHandler from 'express-async-handler';
import RFQ from '../models/RFQ.js';
import Quotation from '../models/Quotation.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Invoice from '../models/Invoice.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const activeRFQs = await RFQ.countDocuments({ status: 'published' });
  const pendingApprovals = await Quotation.countDocuments({ status: 'submitted' });
  const posThisMonth = await PurchaseOrder.aggregate([{ $group: { _id: null, total: { $sum: '$grandTotal' } } }]);
  const overdueInvoices = await Invoice.countDocuments({ status: 'overdue' });
  res.json({ activeRFQs, pendingApprovals, posThisMonth: posThisMonth[0]?.total || 0, overdueInvoices, spendingTrend: [] });
});
