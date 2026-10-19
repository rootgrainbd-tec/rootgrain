import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { InvoiceSnapshot, InvoiceItemSnapshot, ReceiptSnapshot } from "@/types/document";

let regularFontBuffer: Buffer | null = null;
let boldFontBuffer: Buffer | null = null;

export function resolveFontPath(filename: string): string {
  const candidates = [
    path.join(/*turbopackIgnore: true*/ process.cwd(), 'src/assets/fonts', filename),
    path.join(/*turbopackIgnore: true*/ process.cwd(), 'public/fonts', filename),
    path.join(__dirname, 'assets/fonts', filename),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(`Font file ${filename} not found in any expected location.`);
}

export function getFontBuffers(): { regular: Buffer; bold: Buffer } {
  if (!regularFontBuffer) {
    const regPath = resolveFontPath('HindSiliguri-Regular.ttf');
    regularFontBuffer = fs.readFileSync(regPath);
  }
  if (!boldFontBuffer) {
    const boldPath = resolveFontPath('HindSiliguri-Bold.ttf');
    boldFontBuffer = fs.readFileSync(boldPath);
  }
  return { regular: regularFontBuffer, bold: boldFontBuffer };
}

function registerDocumentFonts(doc: PDFKit.PDFDocument): void {
  const { regular, bold } = getFontBuffers();
  doc.registerFont('HindSiliguri', regular);
  doc.registerFont('HindSiliguri-Bold', bold);
}

/**
 * Centralized BDT currency formatter for invoice and document PDFs.
 *
 * Requirements:
 * 1. Accepts finite numeric values only.
 * 2. Rejects NaN, Infinity, -Infinity, null, and undefined (fails safely).
 * 3. Preserves legitimate zero values (0 -> "৳0").
 * 4. Applies established project BDT formatting conventions (thousands separators via en-BD).
 * 5. Avoids double encoding or manual byte conversion.
 */
export function formatCurrencyBDT(amount: number): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    throw new Error(`Invalid monetary amount: expected finite number, received ${amount}`);
  }
  return `৳${amount.toLocaleString('en-BD')}`;
}

export async function generateInvoicePDF(snapshot: InvoiceSnapshot, templateVersion: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      registerDocumentFonts(doc);
      doc.font('HindSiliguri');

      // Header
      doc.font('HindSiliguri-Bold').fontSize(25).fillColor('#5D4037').text(snapshot.branding.companyName, { align: 'right' });
      doc.font('HindSiliguri').fontSize(10).fillColor('gray').text(
        snapshot.branding.address?.line1 ? `${snapshot.branding.address.line1}${snapshot.branding.address.line2 ? ', ' + snapshot.branding.address.line2 : ''}` : '123 Furniture Street, Dhaka, Bangladesh', 
        { align: 'right' }
      );
      doc.text(`Email: ${snapshot.branding.email}`, { align: 'right' });
      doc.text(`Phone: ${snapshot.branding.phone}`, { align: 'right' });
      doc.moveDown(2);

      // Invoice Info
      const invoiceTitle = snapshot.invoiceType === "FINAL" ? 'FINAL INVOICE' : 'ADVANCE INVOICE';
      doc.font('HindSiliguri-Bold').fontSize(20).fillColor('black').text(invoiceTitle, { underline: true });
      doc.moveDown();
      doc.font('HindSiliguri').fontSize(12).text(`Type: ${snapshot.invoiceType} Invoice`);
      
      if (snapshot.orderNumber) {
        doc.text(`Order: ${snapshot.orderNumber}`);
      }

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
      doc.font('HindSiliguri-Bold').fontSize(14).fillColor('#5D4037').text('Bill To:');
      doc.font('HindSiliguri').fontSize(12).fillColor('black');
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
      doc.font('HindSiliguri-Bold');
      doc.text('Item', 50, tableTop);
      doc.text('Qty', 350, tableTop, { width: 50, align: 'right' });
      doc.text('Price', 400, tableTop, { width: 100, align: 'right' });
      
      const hrTop = tableTop + 15;
      doc.moveTo(50, hrTop).lineTo(500, hrTop).stroke();

      // Table Body
      let yPosition = hrTop + 10;
      doc.font('HindSiliguri');

      (snapshot.items || []).forEach((item: InvoiceItemSnapshot) => {
        const itemText = item.productName || 'Item';
        const nameHeight = doc.heightOfString(itemText, { width: 300 });
        const rowHeight = Math.max(20, Math.ceil(nameHeight) + 4);

        if (yPosition + rowHeight > doc.page.height - 180) {
          doc.addPage();
          yPosition = 50;
          doc.font('HindSiliguri-Bold');
          doc.text('Item', 50, yPosition);
          doc.text('Qty', 350, yPosition, { width: 50, align: 'right' });
          doc.text('Price', 400, yPosition, { width: 100, align: 'right' });
          yPosition += 15;
          doc.moveTo(50, yPosition).lineTo(500, yPosition).stroke();
          yPosition += 10;
          doc.font('HindSiliguri');
        }

        doc.text(itemText, 50, yPosition, { width: 300 });
        doc.text(item.quantity?.toString() || '1', 350, yPosition, { width: 50, align: 'right' });
        const rawTotal = typeof item.total === 'number'
          ? item.total
          : ((Number(item.unitPrice || 0)) * Number(item.quantity || 1));
        if (!Number.isFinite(rawTotal)) {
          throw new Error(`Invalid item total for product "${itemText}"`);
        }
        doc.text(formatCurrencyBDT(rawTotal), 400, yPosition, { width: 100, align: 'right' });
        yPosition += rowHeight;
      });

      const footerLineY = yPosition + 10;
      doc.moveTo(50, footerLineY).lineTo(500, footerLineY).stroke();

      // Totals with breakdown
      yPosition = footerLineY + 15;
      if (yPosition > doc.page.height - 160) {
        doc.addPage();
        yPosition = 50;
      }
      doc.font('HindSiliguri').fontSize(12);

      if (typeof snapshot.subtotal === 'number') {
        if (!Number.isFinite(snapshot.subtotal)) {
          throw new Error("Subtotal must be a finite number if specified");
        }
        doc.text('Subtotal:', 300, yPosition, { width: 100, align: 'right' });
        doc.text(formatCurrencyBDT(snapshot.subtotal), 400, yPosition, { width: 100, align: 'right' });
        yPosition += 18;
      }

      if (typeof snapshot.shippingCost === 'number') {
        if (!Number.isFinite(snapshot.shippingCost)) {
          throw new Error("Shipping cost must be a finite number if specified");
        }
        doc.text('Shipping:', 300, yPosition, { width: 100, align: 'right' });
        doc.text(formatCurrencyBDT(snapshot.shippingCost), 400, yPosition, { width: 100, align: 'right' });
        yPosition += 18;
      }

      if (typeof snapshot.discountAmount === 'number' && snapshot.discountAmount > 0) {
        if (!Number.isFinite(snapshot.discountAmount)) {
          throw new Error("Discount amount must be a finite number if specified");
        }
        doc.fillColor('#2e7d32').text('Discount:', 300, yPosition, { width: 100, align: 'right' });
        doc.text(`-${formatCurrencyBDT(snapshot.discountAmount)}`, 400, yPosition, { width: 100, align: 'right' });
        doc.fillColor('black');
        yPosition += 18;
      }

      if (typeof snapshot.orderTotal !== 'number' || !Number.isFinite(snapshot.orderTotal)) {
        throw new Error("Invoice requires a finite numeric orderTotal");
      }
      doc.font('HindSiliguri-Bold').fontSize(14);
      doc.text('Total:', 300, yPosition, { width: 100, align: 'right' });
      doc.text(formatCurrencyBDT(snapshot.orderTotal), 400, yPosition, { width: 100, align: 'right' });

      // Advance / Balance
      yPosition += 30;
      doc.font('HindSiliguri').fontSize(12);
      if (snapshot.invoiceType === "FINAL") {
        if (
          typeof snapshot.validPaidAtIssuance !== 'number' ||
          !Number.isFinite(snapshot.validPaidAtIssuance) ||
          typeof snapshot.balanceDueAtIssuance !== 'number' ||
          !Number.isFinite(snapshot.balanceDueAtIssuance)
        ) {
          throw new Error("Final invoice requires explicit validPaidAtIssuance and balanceDueAtIssuance settlement fields (finite numbers)");
        }
        doc.fillColor('#2e7d32').text(`Valid Paid: ${formatCurrencyBDT(snapshot.validPaidAtIssuance)}`, 50, yPosition);
        yPosition += 20;
        doc.fillColor('#d32f2f').text(`Balance Due: ${formatCurrencyBDT(snapshot.balanceDueAtIssuance)}`, 50, yPosition);
      } else {
        if (typeof snapshot.requiredAdvance !== 'number' || !Number.isFinite(snapshot.requiredAdvance)) {
          throw new Error("Advance invoice requires a finite numeric requiredAdvance");
        }
        doc.fillColor('#5D4037').text(`Required Advance: ${formatCurrencyBDT(snapshot.requiredAdvance)}`, 50, yPosition);
      }

      // Footer Message
      doc.moveDown(4);
      doc.font('HindSiliguri').fontSize(10).fillColor('gray');
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

      registerDocumentFonts(doc);
      doc.font('HindSiliguri');

      // Header
      doc.font('HindSiliguri-Bold').fontSize(25).fillColor('#5D4037').text(snapshot.branding.companyName, { align: 'right' });
      doc.font('HindSiliguri').fontSize(10).fillColor('gray').text(
        snapshot.branding.address?.line1 ? `${snapshot.branding.address.line1}${snapshot.branding.address.line2 ? ', ' + snapshot.branding.address.line2 : ''}` : '123 Furniture Street, Dhaka, Bangladesh', 
        { align: 'right' }
      );
      doc.text(`Email: ${snapshot.branding.email}`, { align: 'right' });
      doc.text(`Phone: ${snapshot.branding.phone}`, { align: 'right' });
      doc.moveDown(2);

      // Receipt Info
      doc.font('HindSiliguri-Bold').fontSize(20).fillColor('black').text('PAYMENT RECEIPT', { underline: true });
      doc.moveDown();
      
      if (snapshot.referenceIdentity) {
        doc.font('HindSiliguri').fontSize(12).text(`Receipt Number: ${snapshot.referenceIdentity}`);
      }
      doc.text(`Date: ${snapshot.paidAt ? new Date(snapshot.paidAt).toLocaleDateString() : new Date().toLocaleDateString()}`);
      
      if (snapshot.linkedInvoiceReference) {
        doc.text(`Linked Invoice: ${snapshot.linkedInvoiceReference}`);
      }
      doc.moveDown();

      // Customer Info
      doc.font('HindSiliguri-Bold').fontSize(14).fillColor('#5D4037').text('Received From:');
      doc.font('HindSiliguri').fontSize(12).fillColor('black');
      doc.text(`${snapshot.customerName || 'Customer'}`);
      doc.moveDown(2);

      // Payment Details
      const tableTop = doc.y;
      doc.font('HindSiliguri-Bold');
      doc.text('Description', 50, tableTop);
      doc.text('Amount', 400, tableTop, { width: 100, align: 'right' });
      
      const hrTop = tableTop + 15;
      doc.moveTo(50, hrTop).lineTo(500, hrTop).stroke();

      let yPosition = hrTop + 10;
      doc.font('HindSiliguri');
      doc.text(`Payment for ${snapshot.type} via ${snapshot.method}`, 50, yPosition, { width: 300 });

      if (typeof snapshot.amount !== 'number' || !Number.isFinite(snapshot.amount)) {
        throw new Error("Receipt requires a finite numeric amount");
      }
      doc.text(formatCurrencyBDT(snapshot.amount), 400, yPosition, { width: 100, align: 'right' });
      yPosition += 20;

      if (snapshot.reference) {
        doc.font('HindSiliguri').fontSize(10);
        doc.text(`Reference: ${snapshot.reference}`, 50, yPosition);
        yPosition += 15;
      }

      const footerLineY = yPosition + 10;
      doc.moveTo(50, footerLineY).lineTo(500, footerLineY).stroke();

      // Footer Message
      doc.moveDown(4);
      doc.font('HindSiliguri').fontSize(10).fillColor('gray');
      doc.text(`Thank you for your payment!`, { align: 'center' });
      doc.fontSize(8).text(`Template Version: ${templateVersion}`, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
