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
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

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
    } catch (err) {
      reject(err);
    }
  });
};

export const generateInvoicePDF = (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

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
    } catch (err) {
      reject(err);
    }
  });
};

export const generateQuotationPDF = (quotation) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      buildDocument(doc, {
        title: 'Quotation Bid Detail',
        number: quotation._id.toString().toUpperCase(),
        date: quotation.createdAt?.toDateString() || new Date().toDateString(),
        vendorName: quotation.vendor?.name || 'Vendor Partner',
        status: quotation.status,
      });

      doc.text(`Payment Terms: ${quotation.paymentTerms || 'N/A'}`);
      doc.text(`Delivery Timeline: ${quotation.deliveryDays} Days`);
      doc.moveDown();

      doc.text('Line Items:');
      quotation.lineItems.forEach((item) => {
        doc.text(`• ${item.itemName} | Qty: ${item.quantity} | Unit: ${item.unit || 'pcs'} | Unit Price: ₹${item.unitPrice} | Total: ₹${item.total}`);
      });

      doc.moveDown();
      doc.text(`Subtotal: ₹${quotation.subtotal}`);
      doc.text(`GST (${quotation.gstPercent}%): ₹${quotation.gstAmount}`);
      doc.text(`Grand Total: ₹${quotation.grandTotal}`);
      if (quotation.notes) {
        doc.moveDown();
        doc.text(`Notes: ${quotation.notes}`);
      }
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
