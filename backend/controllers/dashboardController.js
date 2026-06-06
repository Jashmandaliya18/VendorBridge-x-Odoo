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

  if (role === 'admin' || role === 'officer') {
    const pendingApprovals = await Approval.countDocuments({ status: 'pending' });
    const posResult = await PurchaseOrder.aggregate([{ $group: { _id: null, total: { $sum: '$grandTotal' } } }]);
    const posThisMonth = posResult[0]?.total || 0;

    cards.push(
      { title: 'Active RFQs', value: activeRFQs, description: 'Published RFQs awaiting responses' },
      { title: 'Pending Approvals', value: pendingApprovals, description: 'Requests needing review' },
      { title: 'POs This Month', value: `₹${posThisMonth.toLocaleString()}`, description: 'Total purchase order value' },
      { title: 'Overdue Invoices', value: overdueInvoices, description: 'Invoices past due' },
    );
    actions.push(
      { label: 'Create RFQ', to: '/rfqs' },
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
    const posResult = await PurchaseOrder.aggregate([{ $group: { _id: null, total: { $sum: '$grandTotal' } } }]);
    const posThisMonth = posResult[0]?.total || 0;

    cards.push(
      { title: 'Active RFQs', value: activeRFQs, description: 'Published RFQs awaiting responses' },
      { title: 'Pending Approvals', value: pendingApprovals, description: 'Requests needing review' },
      { title: 'POs This Month', value: `₹${posThisMonth.toLocaleString()}`, description: 'Total purchase order value' },
      { title: 'Overdue Invoices', value: overdueInvoices, description: 'Invoices past due' },
    );
    actions.push({ label: 'Review Quotations', to: '/quotations' });
  }

  res.json({ role, cards, actions });
});
