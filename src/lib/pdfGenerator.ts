import PDFDocument from 'pdfkit';
import { InvoiceSnapshot, ReceiptSnapshot } from "@/types/document";

export async function generateInvoicePDF(snapshot: InvoiceSnapshot, templateVersion: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(25).fillColor('#5D4037').text(snapshot.branding.companyName, { align: 'right' });
      doc.fontSize(10).fillColor('gray').text(
        snapshot.branding.address?.line1 ? `${snapshot.branding.address.line1}${snapshot.branding.address.line2 ? ', ' + snapshot.branding.address.line2 : ''}` : '123 Furniture Street, Dhaka, Bangladesh', 
        { align: 'right' }
      );
      doc.text(`Email: ${snapshot.branding.email}`, { align: 'right' });
      doc.text(`Phone: ${snapshot.branding.phone}`, { align: 'right' });
      doc.moveDown(2);

      // Invoice Info
      const invoiceTitle = snapshot.invoiceType === "FINAL" ? 'FINAL INVOICE' : 'INVOICE';
      doc.fontSize(20).fillColor('black').text(invoiceTitle, { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Type: ${snapshot.invoiceType} Invoice`);
      
      if (snapshot.issuedAt) {
        doc.text(`Date: ${new Date(snapshot.issuedAt).toLocaleDateString()}`);
      } else {
        doc.text(`Date: ${new Date().toLocaleDateString()}`);
      }
      
      if (snapshot.referenceIdentity) {
        doc.text(`Invoice Number: ${snapshot.referenceIdentity}`);
      }
      doc.moveDown();

      // Customer Info
      doc.fontSize(14).fillColor('#5D4037').text('Bill To:');
      doc.fontSize(12).fillColor('black');
      doc.text(`${snapshot.shippingAddress?.name || 'Customer'}`);
      doc.text(`${snapshot.shippingAddress?.address || ''}`);
      if (snapshot.shippingAddress?.apartment) {
        doc.text(`${snapshot.shippingAddress?.apartment}`);
      }
      doc.text(`${snapshot.shippingAddress?.city || ''}, ${snapshot.shippingAddress?.postalCode || ''}`);
      doc.text(`Phone: ${snapshot.shippingAddress?.phone || ''}`);
      doc.text(`Email: ${snapshot.customerEmail || ''}`);
      doc.moveDown(2);

      // Table Header
      const tableTop = doc.y;
      doc.font('Helvetica-Bold');
      doc.text('Item', 50, tableTop);
      doc.text('Qty', 350, tableTop, { width: 50, align: 'right' });
      doc.text('Price', 400, tableTop, { width: 100, align: 'right' });
      
      const hrTop = tableTop + 15;
      doc.moveTo(50, hrTop).lineTo(500, hrTop).stroke();

      // Table Body
      let yPosition = hrTop + 10;
      doc.font('Helvetica');

      (snapshot.items || []).forEach((item: any) => {
        doc.text(item.productName || item.name || 'Item', 50, yPosition, { width: 300 });
        doc.text(item.quantity?.toString() || '1', 350, yPosition, { width: 50, align: 'right' });
        const itemTotal = item.total || (item.price * item.quantity);
        doc.text(`Tk ${itemTotal?.toLocaleString() || '0'}`, 400, yPosition, { width: 100, align: 'right' });
        yPosition += 20;
      });

      const footerLineY = yPosition + 10;
      doc.moveTo(50, footerLineY).lineTo(500, footerLineY).stroke();

      // Totals
      yPosition = footerLineY + 15;
      doc.font('Helvetica-Bold').fontSize(14);
      doc.text('Total:', 300, yPosition, { width: 100, align: 'right' });
      doc.text(`Tk ${snapshot.orderTotal?.toLocaleString() || '0'}`, 400, yPosition, { width: 100, align: 'right' });

      // Advance / Balance
      yPosition += 30;
      doc.font('Helvetica-Oblique').fontSize(12);
      if (snapshot.invoiceType === "FINAL" && snapshot.validPaidAtIssuance !== undefined && snapshot.balanceDueAtIssuance !== undefined) {
        doc.fillColor('#2e7d32').text(`Valid Paid: Tk ${snapshot.validPaidAtIssuance.toLocaleString()}`, 50, yPosition);
        yPosition += 20;
        doc.fillColor('#d32f2f').text(`Balance Due: Tk ${snapshot.balanceDueAtIssuance.toLocaleString()}`, 50, yPosition);
      } else {
        doc.fillColor('#5D4037').text(`Required Advance: Tk ${snapshot.requiredAdvance?.toLocaleString() || '0'}`, 50, yPosition);
      }

      // Footer Message
      doc.moveDown(4);
      doc.font('Helvetica').fontSize(10).fillColor('gray');
      doc.text(`Thank you for choosing ${snapshot.branding.companyName}!`, { align: 'center' });
      doc.fontSize(8).text(`Template Version: ${templateVersion}`, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export async function generateReceiptPDF(snapshot: ReceiptSnapshot, templateVersion: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(25).fillColor('#5D4037').text(snapshot.branding.companyName, { align: 'right' });
      doc.fontSize(10).fillColor('gray').text(
        snapshot.branding.address?.line1 ? `${snapshot.branding.address.line1}${snapshot.branding.address.line2 ? ', ' + snapshot.branding.address.line2 : ''}` : '123 Furniture Street, Dhaka, Bangladesh', 
        { align: 'right' }
      );
      doc.text(`Email: ${snapshot.branding.email}`, { align: 'right' });
      doc.text(`Phone: ${snapshot.branding.phone}`, { align: 'right' });
      doc.moveDown(2);

      // Receipt Info
      doc.fontSize(20).fillColor('black').text('PAYMENT RECEIPT', { underline: true });
      doc.moveDown();
      
      if (snapshot.referenceIdentity) {
        doc.fontSize(12).text(`Receipt Number: ${snapshot.referenceIdentity}`);
      }
      doc.text(`Date: ${snapshot.paidAt ? new Date(snapshot.paidAt).toLocaleDateString() : new Date().toLocaleDateString()}`);
      
      if (snapshot.linkedInvoiceReference) {
        doc.text(`Linked Invoice: ${snapshot.linkedInvoiceReference}`);
      }
      doc.moveDown();

      // Customer Info
      doc.fontSize(14).fillColor('#5D4037').text('Received From:');
      doc.fontSize(12).fillColor('black');
      doc.text(`${snapshot.customerName || 'Customer'}`);
      doc.moveDown(2);

      // Payment Details
      const tableTop = doc.y;
      doc.font('Helvetica-Bold');
      doc.text('Description', 50, tableTop);
      doc.text('Amount', 400, tableTop, { width: 100, align: 'right' });
      
      const hrTop = tableTop + 15;
      doc.moveTo(50, hrTop).lineTo(500, hrTop).stroke();

      let yPosition = hrTop + 10;
      doc.font('Helvetica');
      doc.text(`Payment for ${snapshot.type} via ${snapshot.method}`, 50, yPosition, { width: 300 });
      doc.text(`Tk ${snapshot.amount?.toLocaleString() || '0'}`, 400, yPosition, { width: 100, align: 'right' });
      yPosition += 20;

      if (snapshot.reference) {
        doc.font('Helvetica-Oblique').fontSize(10);
        doc.text(`Reference: ${snapshot.reference}`, 50, yPosition);
        yPosition += 15;
      }

      const footerLineY = yPosition + 10;
      doc.moveTo(50, footerLineY).lineTo(500, footerLineY).stroke();

      // Footer Message
      doc.moveDown(4);
      doc.font('Helvetica').fontSize(10).fillColor('gray');
      doc.text(`Thank you for your payment!`, { align: 'center' });
      doc.fontSize(8).text(`Template Version: ${templateVersion}`, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
