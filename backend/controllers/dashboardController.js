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

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  if (role === 'admin') {
    // Admin: full visibility – vendors, approvals, POs, invoices, RFQs
    const Vendor = (await import('../models/Vendor.js')).default;
    const pendingVendors = await Vendor.countDocuments({ status: 'pending' });
    const activeVendors = await Vendor.countDocuments({ status: 'active' });
    const pendingApprovals = await Approval.countDocuments({ status: 'pending' });
    const overdueInvoices = await Invoice.countDocuments({ status: 'overdue' });
    const activeRFQs = await RFQ.countDocuments({ status: 'published' });
    const posResult = await PurchaseOrder.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);
    const posThisMonth = posResult[0]?.total || 0;

    cards.push(
      { title: 'Pending Vendors', value: pendingVendors, description: 'Awaiting admin approval', color: 'amber' },
      { title: 'Active Vendors', value: activeVendors, description: 'Verified & active partners', color: 'teal' },
      { title: 'Pending Approvals', value: pendingApprovals, description: 'Quotation approvals pending', color: 'blue' },
      { title: 'Overdue Invoices', value: overdueInvoices, description: 'Invoices past due date', color: 'rose' },
    );
    actions.push(
      { label: 'Manage Vendors', to: '/vendors' },
      { label: 'Create RFQ', to: '/rfqs/new' },
      { label: 'Review Quotations', to: '/quotations' },
      { label: 'View Approvals', to: '/approvals' },
    );

    // Pending vendors list for admin dashboard panel (up to 5)
    const pendingVendorsList = await Vendor.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(5);

    // Recent purchase orders
    const recentPurchaseOrders = await PurchaseOrder.find()
      .populate('vendor')
      .sort({ createdAt: -1 })
      .limit(5);

    // Spending trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    const spendingTrendData = await Invoice.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, total: { $sum: '$grandTotal' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const spendingTrend = spendingTrendData.map((item) => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year.toString().slice(-2)}`,
      amount: item.total,
    }));

    return res.json({ role, cards, actions, recentPurchaseOrders, spendingTrend, pendingVendorsList, activeRFQs, posThisMonth });

  } else if (role === 'officer') {
    // Officer: RFQs, quotations, POs, invoices
    const activeRFQs = await RFQ.countDocuments({ status: 'published' });
    const draftRFQs = await RFQ.countDocuments({ status: 'draft', createdBy: req.user._id });
    const submittedQuotations = await Quotation.countDocuments({ status: 'submitted' });
    const overdueInvoices = await Invoice.countDocuments({ status: 'overdue' });

    cards.push(
      { title: 'Active RFQs', value: activeRFQs, description: 'Published RFQs awaiting responses', color: 'teal' },
      { title: 'My Draft RFQs', value: draftRFQs, description: 'Drafts you created', color: 'blue' },
      { title: 'Submitted Quotations', value: submittedQuotations, description: 'Quotes awaiting review', color: 'amber' },
      { title: 'Overdue Invoices', value: overdueInvoices, description: 'Invoices past due', color: 'rose' },
    );
    actions.push(
      { label: 'Create RFQ', to: '/rfqs/new' },
      { label: 'Review Quotations', to: '/quotations' },
      { label: 'Manage Vendors', to: '/vendors' },
    );

    const recentPurchaseOrders = await PurchaseOrder.find()
      .populate('vendor')
      .sort({ createdAt: -1 })
      .limit(5);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    const spendingTrendData = await Invoice.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, total: { $sum: '$grandTotal' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const spendingTrend = spendingTrendData.map((item) => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year.toString().slice(-2)}`,
      amount: item.total,
    }));

    return res.json({ role, cards, actions, recentPurchaseOrders, spendingTrend, pendingVendorsList: [], activeRFQs, posThisMonth: 0 });

  } else if (role === 'manager') {
    // Manager: approvals pending for them, RFQs, quotations
    const approvalsPending = await Approval.countDocuments({
      status: 'pending',
      levels: { $elemMatch: { approver: req.user._id, status: 'pending' } },
    });
    const activeRFQs = await RFQ.countDocuments({ status: 'published' });
    const submittedQuotations = await Quotation.countDocuments({ status: 'submitted' });
    const overdueInvoices = await Invoice.countDocuments({ status: 'overdue' });

    cards.push(
      { title: 'Pending Approvals', value: approvalsPending, description: 'Approvals assigned to you', color: 'amber' },
      { title: 'Published RFQs', value: activeRFQs, description: 'Active procurement requests', color: 'teal' },
      { title: 'Submitted Quotations', value: submittedQuotations, description: 'Quotes awaiting review', color: 'blue' },
      { title: 'Overdue Invoices', value: overdueInvoices, description: 'Unpaid invoices', color: 'rose' },
    );
    actions.push(
      { label: 'View Approvals', to: '/approvals' },
      { label: 'Review Quotations', to: '/quotations' },
      { label: 'View RFQs', to: '/rfqs' },
    );

    const recentPurchaseOrders = await PurchaseOrder.find()
      .populate('vendor')
      .sort({ createdAt: -1 })
      .limit(5);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    const spendingTrendData = await Invoice.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, total: { $sum: '$grandTotal' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const spendingTrend = spendingTrendData.map((item) => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year.toString().slice(-2)}`,
      amount: item.total,
    }));

    return res.json({ role, cards, actions, recentPurchaseOrders, spendingTrend, pendingVendorsList: [], activeRFQs, posThisMonth: 0 });

  } else {
    // Vendor role: only their own quotations, open RFQs, their POs
    const myQuotations = await Quotation.countDocuments({ submittedBy: req.user._id });
    const draftQuotations = await Quotation.countDocuments({ submittedBy: req.user._id, status: 'draft' });
    const selectedQuotations = await Quotation.countDocuments({ submittedBy: req.user._id, status: 'selected' });
    const activeRFQs = await RFQ.countDocuments({ status: 'published' });

    cards.push(
      { title: 'My Quotations', value: myQuotations, description: 'Quotations submitted so far', color: 'teal' },
      { title: 'Draft Quotations', value: draftQuotations, description: 'Drafts waiting to submit', color: 'blue' },
      { title: 'Selected Quotations', value: selectedQuotations, description: 'Quotes accepted by buyers', color: 'amber' },
      { title: 'Open RFQs', value: activeRFQs, description: 'Active procurement requests', color: 'teal' },
    );
    actions.push(
      { label: 'Manage My Quotations', to: '/quotations' },
      { label: 'Browse Open RFQs', to: '/rfqs' },
    );

    // Vendor sees only their own POs (linked via selected quotations)
    const mySelectedQuotationIds = await Quotation.find({ submittedBy: req.user._id, status: 'selected' }).distinct('_id');
    const recentPurchaseOrders = await PurchaseOrder.find({ quotation: { $in: mySelectedQuotationIds } })
      .populate('vendor')
      .sort({ createdAt: -1 })
      .limit(5);

    return res.json({ role, cards, actions, recentPurchaseOrders, spendingTrend: [], pendingVendorsList: [], activeRFQs, posThisMonth: 0 });
  }
});
