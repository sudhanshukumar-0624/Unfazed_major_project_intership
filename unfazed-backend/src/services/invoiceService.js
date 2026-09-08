const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a GST-style PDF invoice and save it to disk.
 * Returns the file path.
 */
const generateInvoice = async ({ payment, therapist, client, invoiceNumber }) => {
  return new Promise((resolve, reject) => {
    const invoiceDir = path.join(__dirname, '../../invoices');
    if (!fs.existsSync(invoiceDir)) {
      fs.mkdirSync(invoiceDir, { recursive: true });
    }

    const filePath = path.join(invoiceDir, `invoice-${invoiceNumber}.pdf`);
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // ── Header ──
    doc
      .fontSize(20)
      .text('UNFAZED', 50, 50, { align: 'left' })
      .fontSize(10)
      .text('SaaS Platform for Therapists', { align: 'left' });

    doc.moveDown();
    doc.fontSize(16).text('TAX INVOICE', { align: 'right' });
    doc.fontSize(10)
      .text(`Invoice No: ${invoiceNumber}`, { align: 'right' })
      .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // ── Billed By ──
    doc.fontSize(12).text('Billed By:', { underline: true });
    doc.fontSize(10)
      .text(`${therapist.name}`)
      .text(`Email: ${therapist.email}`);

    doc.moveDown();

    // ── Billed To ──
    doc.fontSize(12).text('Billed To:', { underline: true });
    doc.fontSize(10)
      .text(`${client.name}`)
      .text(`Email: ${client.email}`);

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // ── Line Items ──
    doc.fontSize(12).text('Description', 50, doc.y, { continued: true });
    doc.text('Amount (INR)', { align: 'right' });
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    const amountINR = (payment.amount / 100).toFixed(2);
    const platformFeeINR = (payment.platform_fee / 100).toFixed(2);
    const netINR = (payment.net_amount / 100).toFixed(2);

    doc.fontSize(10).text('Therapy Session', 50, doc.y, { continued: true });
    doc.text(`₹${amountINR}`, { align: 'right' });

    doc.text('Platform Fee', 50, doc.y, { continued: true });
    doc.text(`₹${platformFeeINR}`, { align: 'right' });

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(12).text('Net Amount', 50, doc.y, { continued: true });
    doc.text(`₹${netINR}`, { align: 'right' });

    doc.moveDown(2);
    doc.fontSize(9)
      .fillColor('gray')
      .text('This is a computer-generated invoice and does not require a signature.', { align: 'center' });

    doc.end();
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
};

module.exports = { generateInvoice };
