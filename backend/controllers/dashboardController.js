import asyncHandler from 'express-async-handler';
import RFQ from '../models/RFQ.js';
import Quotation from '../models/Quotation.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Invoice from '../models/Invoice.js';
import Approval from '../models/Approval.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const role = req.user.role;
  const cards = [];
  const actions = [];

  const activeRFQs = await RFQ.countDocuments({ status: 'published' });
  const overdueInvoices = await Invoice.countDocuments({ status: 'overdue' });
  
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  if (role === 'admin' || role === 'officer') {
    const pendingApprovals = await Approval.countDocuments({ status: 'pending' });
    const posResult = await PurchaseOrder.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);
    const posThisMonth = posResult[0]?.total || 0;

    cards.push(
      { title: 'Active RFQs', value: activeRFQs, description: 'Published RFQs awaiting responses' },
      { title: 'Pending Approvals', value: pendingApprovals, description: 'Requests needing review' },
      { title: 'POs This Month', value: `₹${posThisMonth.toLocaleString()}`, description: 'Total purchase order value' },
      { title: 'Overdue Invoices', value: overdueInvoices, description: 'Invoices past due' },
    );
    actions.push(
      { label: 'Create RFQ', to: '/rfqs/new' },
      { label: 'Manage Vendors', to: '/vendors' },
      { label: 'Review Quotations', to: '/quotations' },
    );
  } else if (role === 'manager') {
    const approvalsPending = await Approval.countDocuments({
      status: 'pending',
      levels: { $elemMatch: { approver: req.user._id, status: 'pending' } },
    });
    const submittedQuotations = await Quotation.countDocuments({ status: 'submitted' });

    cards.push(
      { title: 'Pending Approvals', value: approvalsPending, description: 'Approvals assigned to you' },
      { title: 'Published RFQs', value: activeRFQs, description: 'Active procurement requests' },
      { title: 'Submitted Quotations', value: submittedQuotations, description: 'Quotes awaiting review' },
      { title: 'Overdue Invoices', value: overdueInvoices, description: 'Unpaid invoices' },
    );
    actions.push(
      { label: 'Review Quotations', to: '/quotations' },
      { label: 'View RFQs', to: '/rfqs' },
    );
  } else if (role === 'vendor') {
    const myQuotations = await Quotation.countDocuments({ submittedBy: req.user._id });
    const draftQuotations = await Quotation.countDocuments({ submittedBy: req.user._id, status: 'draft' });
    const selectedQuotations = await Quotation.countDocuments({ submittedBy: req.user._id, status: 'selected' });

    cards.push(
      { title: 'My Quotations', value: myQuotations, description: 'Quotations submitted so far' },
      { title: 'Draft Quotations', value: draftQuotations, description: 'Drafts waiting to submit' },
      { title: 'Selected Quotations', value: selectedQuotations, description: 'Quotes accepted by buyers' },
      { title: 'Open RFQs', value: activeRFQs, description: 'Active procurement requests' },
    );
    actions.push({ label: 'Manage My Quotations', to: '/quotations' });
  } else {
    const pendingApprovals = await Approval.countDocuments({ status: 'pending' });
    const posResult = await PurchaseOrder.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);
    const posThisMonth = posResult[0]?.total || 0;

    cards.push(
      { title: 'Active RFQs', value: activeRFQs, description: 'Published RFQs awaiting responses' },
      { title: 'Pending Approvals', value: pendingApprovals, description: 'Requests needing review' },
      { title: 'POs This Month', value: `₹${posThisMonth.toLocaleString()}`, description: 'Total purchase order value' },
      { title: 'Overdue Invoices', value: overdueInvoices, description: 'Invoices past due' },
    );
    actions.push({ label: 'Review Quotations', to: '/quotations' });
  }

  // Get recent purchase orders
  const recentPurchaseOrders = await PurchaseOrder.find()
    .populate('vendor')
    .sort({ createdAt: -1 })
    .limit(5);

  // Get spending trend (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const spendingTrendData = await Invoice.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, total: { $sum: '$grandTotal' } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const spendingTrend = spendingTrendData.map((item) => ({
    month: `${monthNames[item._id.month - 1]} ${item._id.year.toString().slice(-2)}`,
    amount: item.total,
  }));

  res.json({ role, cards, actions, recentPurchaseOrders, spendingTrend });
});
