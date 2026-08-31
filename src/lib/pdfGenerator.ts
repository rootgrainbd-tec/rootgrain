import PDFDocument from 'pdfkit';
import { getSiteConfig } from "@/data/site-config";
import { BrandService } from "@/lib/brand";

export async function generateInvoicePDF(order: any): Promise<Buffer> {
  const config = await getSiteConfig();
  const brand = new BrandService(config);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(25).fillColor('#5D4037').text(brand.getCompanyName(), { align: 'right' });
      doc.fontSize(10).fillColor('gray').text(
        config.address?.line1 ? `${config.address.line1}${config.address.line2 ? ', ' + config.address.line2 : ''}` : '123 Furniture Street, Dhaka, Bangladesh', 
        { align: 'right' }
      );
      doc.text(`Email: ${config.support?.email || 'support@rootgrain.bd'}`, { align: 'right' });
      doc.text(`Phone: ${config.support?.phone?.display || '+880 1234-567890'}`, { align: 'right' });
      doc.moveDown(2);

      // Invoice Info
      doc.fontSize(20).fillColor('black').text('INVOICE', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Order Number: ${order.orderNumber}`);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
      doc.moveDown();

      // Customer Info
      doc.fontSize(14).fillColor('#5D4037').text('Bill To:');
      doc.fontSize(12).fillColor('black');
      doc.text(`${order.shippingAddress?.name}`);
      doc.text(`${order.shippingAddress?.address}`);
      if (order.shippingAddress?.apartment) {
        doc.text(`${order.shippingAddress?.apartment}`);
      }
      doc.text(`${order.shippingAddress?.city}, ${order.shippingAddress?.postalCode}`);
      doc.text(`Phone: ${order.shippingAddress?.phone}`);
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

      order.items.forEach((item: any) => {
        doc.text(item.productName, 50, yPosition, { width: 300 });
        doc.text(item.quantity.toString(), 350, yPosition, { width: 50, align: 'right' });
        doc.text(`Tk ${item.total.toLocaleString()}`, 400, yPosition, { width: 100, align: 'right' });
        yPosition += 20;
      });

      const footerLineY = yPosition + 10;
      doc.moveTo(50, footerLineY).lineTo(500, footerLineY).stroke();

      // Totals
      yPosition = footerLineY + 15;
      doc.text('Subtotal:', 300, yPosition, { width: 100, align: 'right' });
      doc.text(`Tk ${order.subtotal.toLocaleString()}`, 400, yPosition, { width: 100, align: 'right' });
      yPosition += 20;

      doc.text('Shipping:', 300, yPosition, { width: 100, align: 'right' });
      doc.text(`Tk ${order.shippingCost.toLocaleString()}`, 400, yPosition, { width: 100, align: 'right' });
      yPosition += 20;

      if (order.discountAmount > 0) {
        doc.fillColor('green');
        doc.text('Discount:', 300, yPosition, { width: 100, align: 'right' });
        doc.text(`-Tk ${order.discountAmount.toLocaleString()}`, 400, yPosition, { width: 100, align: 'right' });
        yPosition += 20;
        doc.fillColor('black');
      }

      doc.font('Helvetica-Bold').fontSize(14);
      doc.text('Total:', 300, yPosition, { width: 100, align: 'right' });
      doc.text(`Tk ${order.total.toLocaleString()}`, 400, yPosition, { width: 100, align: 'right' });

      // Advance
      yPosition += 30;
      doc.font('Helvetica-Oblique').fontSize(12);
      const advanceRequired = order.total * 0.2;
      doc.fillColor('#5D4037').text(`Advance Required (20%): Tk ${advanceRequired.toLocaleString()}`, 50, yPosition);

      // Footer Message
      doc.moveDown(4);
      doc.font('Helvetica').fontSize(10).fillColor('gray');
      doc.text(`Thank you for choosing ${brand.getCompanyName()}!`, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
export async function generateReceiptPDF(snapshot: any, templateVersion: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(25).fillColor('#5D4037').text(snapshot.branding?.companyName || 'Company', { align: 'right' });
      doc.fontSize(10).fillColor('gray').text(
        snapshot.branding?.address?.line1 ? `${snapshot.branding.address.line1}${snapshot.branding.address.line2 ? ', ' + snapshot.branding.address.line2 : ''}` : 'Address', 
        { align: 'right' }
      );
      doc.text(`Email: ${snapshot.branding?.email || 'email'}`, { align: 'right' });
      doc.text(`Phone: ${snapshot.branding?.phone || 'phone'}`, { align: 'right' });
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
