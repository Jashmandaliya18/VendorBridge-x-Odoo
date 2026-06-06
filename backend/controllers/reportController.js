import asyncHandler from 'express-async-handler';
import Invoice from '../models/Invoice.js';
import Vendor from '../models/Vendor.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import RFQ from '../models/RFQ.js';
import Quotation from '../models/Quotation.js';
import PDFDocument from 'pdfkit';

export const getSummary = asyncHandler(async (req, res) => {
  const totalSpend = await Invoice.aggregate([{ $group: { _id: null, total: { $sum: '$grandTotal' } } }]);
  const activeVendors = await Vendor.countDocuments({ status: 'active' });
  const overdueInvoices = await Invoice.countDocuments({ status: 'overdue' });
  
  const totalPOs = await PurchaseOrder.countDocuments({ status: { $ne: 'draft' } });
  const paidPOs = await PurchaseOrder.countDocuments({ status: 'paid' });
  const poFulfillment = totalPOs > 0 ? Math.round((paidPOs / totalPOs) * 100) : 0;

  res.json({ 
    totalSpend: totalSpend[0]?.total || 0, 
    activeVendors, 
    overdueInvoices, 
    poFulfillment 
  });
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
  const vendors = await Vendor.find();
  const performance = await Promise.all(
    vendors.map(async (vendor) => {
      const rfqsCount = await RFQ.countDocuments({ vendorIds: vendor._id });
      const totalQuotations = await Quotation.countDocuments({ vendor: vendor._id });
      const wonQuotations = await Quotation.countDocuments({ vendor: vendor._id, status: 'selected' });
      const winRate = totalQuotations > 0 ? Math.round((wonQuotations / totalQuotations) * 100) : 0;
      return { 
        vendorId: vendor._id, 
        name: vendor.name, 
        rfqs: rfqsCount, 
        winRate: winRate, 
        avgRating: vendor.rating || 0 
      };
    })
  );
  res.json(performance);
});

export const exportReport = asyncHandler(async (req, res) => {
  const format = req.query.format || 'csv';
  
  const vendors = await Vendor.find();
  const performance = await Promise.all(
    vendors.map(async (vendor) => {
      const rfqsCount = await RFQ.countDocuments({ vendorIds: vendor._id });
      const totalQuotations = await Quotation.countDocuments({ vendor: vendor._id });
      const wonQuotations = await Quotation.countDocuments({ vendor: vendor._id, status: 'selected' });
      const winRate = totalQuotations > 0 ? Math.round((wonQuotations / totalQuotations) * 100) : 0;
      return { 
        name: vendor.name, 
        rfqs: rfqsCount, 
        winRate: winRate, 
        rating: vendor.rating || 0 
      };
    })
  );

  if (format === 'pdf') {
    const doc = new PDFDocument({ margin: 40 });
    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => {
      res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename=vendor_performance_report.pdf' });
      res.send(Buffer.concat(buffers));
    });

    doc.fontSize(20).text('Vendor Performance Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.moveDown();
    
    doc.fontSize(12).text('Summary table of all vendors:', { underline: true });
    doc.moveDown();

    performance.forEach((vp) => {
      doc.fontSize(10).text(`• Name: ${vp.name} | RFQs: ${vp.rfqs} | Win Rate: ${vp.winRate}% | Rating: ${vp.rating}/5`);
      doc.moveDown(0.5);
    });

    doc.end();
    return;
  }

  const headers = 'Vendor Name,RFQs Assigned,Win Rate %,Rating\n';
  const rows = performance.map((vp) => `"${vp.name}",${vp.rfqs},${vp.winRate}%,${vp.rating}`).join('\n');
  res.set({ 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=vendor_performance_report.csv' });
  res.send(headers + rows);
});
