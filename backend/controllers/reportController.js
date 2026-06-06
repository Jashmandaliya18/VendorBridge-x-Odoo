import asyncHandler from 'express-async-handler';
import Invoice from '../models/Invoice.js';
import Vendor from '../models/Vendor.js';

export const getSummary = asyncHandler(async (req, res) => {
  const totalSpend = await Invoice.aggregate([{ $group: { _id: null, total: { $sum: '$grandTotal' } } }]);
  const activeVendors = await Vendor.countDocuments({ status: 'active' });
  const overdueInvoices = await Invoice.countDocuments({ status: 'overdue' });
  res.json({ totalSpend: totalSpend[0]?.total || 0, activeVendors, overdueInvoices, poFulfillment: 0 });
});

export const getSpendingTrend = asyncHandler(async (req, res) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  const trend = await Invoice.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, total: { $sum: '$grandTotal' } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);
  res.json(trend);
});

export const getVendorPerformance = asyncHandler(async (req, res) => {
  const performance = await Vendor.find().limit(20);
  res.json(performance.map((vendor) => ({ vendorId: vendor._id, name: vendor.name, rfqs: 0, winRate: 0, avgRating: 0 })));
});

export const exportReport = asyncHandler(async (req, res) => {
  const format = req.query.format || 'csv';
  const rows = ['name,metric'].join('\n');
  if (format === 'pdf') {
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename=report.pdf' });
    return res.send(Buffer.from('PDF export placeholder'));
  }
  res.set({ 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=report.csv' });
  res.send(rows);
});
