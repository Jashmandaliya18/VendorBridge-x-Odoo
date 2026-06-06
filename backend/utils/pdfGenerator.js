import PDFDocument from 'pdfkit';

const buildDocument = (doc, meta) => {
  doc.fontSize(18).text(meta.title, { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Number: ${meta.number}`);
  doc.text(`Date: ${meta.date}`);
  doc.moveDown();
  doc.text(`Vendor: ${meta.vendorName}`);
  doc.text(`Status: ${meta.status}`);
  doc.moveDown();
};

export const generatePOPDF = (po) => {
  const doc = new PDFDocument({ margin: 40 });
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', () => {});

  buildDocument(doc, {
    title: 'Purchase Order',
    number: po.poNumber,
    date: po.createdAt?.toDateString() || new Date().toDateString(),
    vendorName: po.vendorName || po.vendor?.name,
    status: po.status,
  });

  doc.text('Line Items:');
  po.lineItems.forEach((item) => {
    doc.text(`• ${item.itemName} | Qty: ${item.quantity} | Unit: ${item.unit} | Price: ₹${item.unitPrice} | Total: ₹${item.total}`);
  });

  doc.moveDown();
  doc.text(`Subtotal: ₹${po.subtotal}`);
  doc.text(`CGST: ₹${po.cgst}`);
  doc.text(`SGST: ₹${po.sgst}`);
  doc.text(`Grand Total: ₹${po.grandTotal}`);
  doc.end();

  return Buffer.concat(buffers);
};

export const generateInvoicePDF = (invoice) => {
  const doc = new PDFDocument({ margin: 40 });
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', () => {});

  buildDocument(doc, {
    title: 'Invoice',
    number: invoice.invoiceNumber,
    date: invoice.createdAt?.toDateString() || new Date().toDateString(),
    vendorName: invoice.vendorName || invoice.vendor?.name,
    status: invoice.status,
  });

  doc.text('Line Items:');
  invoice.lineItems.forEach((item) => {
    doc.text(`• ${item.itemName} | Qty: ${item.quantity} | Unit Price: ₹${item.unitPrice} | Total: ₹${item.total}`);
  });

  doc.moveDown();
  doc.text(`Subtotal: ₹${invoice.subtotal}`);
  doc.text(`GST: ₹${invoice.gstAmount}`);
  doc.text(`Grand Total: ₹${invoice.grandTotal}`);
  doc.end();

  return Buffer.concat(buffers);
};
