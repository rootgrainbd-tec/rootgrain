import { Resend } from "resend";
import { getFreshSiteConfig } from "@/data/site-config";
import { EmailTheme } from "@/lib/email/theme";
import type { SiteConfig } from "@/types/site";
import { BrandService } from "@/lib/brand";

function escapeHtml(unsafe: string) {
  return (unsafe || "").replace(/[&<"'>]/g, function (m) {
    switch (m) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#039;";
      default: return m;
    }
  });
}

let _resend: Resend | null = null;
export function getResendClient(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

async function getEmailSender(config: SiteConfig) {
  const brand = new BrandService(config);
  const fromEmail = process.env.RESEND_FROM_EMAIL || "support@rootgrain.bd";
  return `"${brand.getCompanyName()}" <${fromEmail}>`;
}

function buildSocialLinksHtml(config: SiteConfig) {
  const socialHtml = [];
  const platforms = ['instagram', 'facebook', 'twitter', 'youtube', 'linkedin', 'pinterest'] as const;
  
  for (const platform of platforms) {
    if (config.social?.[platform]) {
      socialHtml.push(`<a href="${config.social[platform]}" style="margin: 0 5px; display: inline-block;">
        <img src="${config.url}/email-icons/${platform}.png" alt="${platform}" width="24" height="24" style="display: block; border: 0;" />
      </a>`);
    }
  }
  return socialHtml.join('\n');
}

export async function getBaseTemplate(title: string, content: string, config: SiteConfig) {
  const brand = new BrandService(config);
  const currentYear = new Date().getFullYear();
  const logoHtml = `<img src="${brand.getEmailLogo()}" alt="${brand.getCompanyName()}" style="max-height: 40px; border: 0;" />`;
    
  const socialLinksHtml = buildSocialLinksHtml(config);
  const supportEmailHtml = config.support?.email 
    ? `<p>Need help? Contact us at <a href="mailto:${config.support.email}" style="color: ${EmailTheme.primary};">${config.support.email}</a></p>` 
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: ${EmailTheme.background}; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: ${EmailTheme.containerBg}; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { background-color: ${EmailTheme.primary}; padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px; text-transform: uppercase; font-weight: 600; }
        .content { padding: 40px 30px; color: ${EmailTheme.textDark}; line-height: 1.6; }
        .footer { background-color: ${EmailTheme.footerBg}; padding: 20px; text-align: center; color: ${EmailTheme.textMuted}; font-size: 14px; border-top: 1px solid ${EmailTheme.border}; }
        .btn { display: inline-block; background-color: ${EmailTheme.primary}; color: #ffffff !important; text-decoration: none; padding: 12px 25px; border-radius: 4px; font-weight: bold; margin-top: 20px; }
        .order-summary { background-color: ${EmailTheme.footerBg}; border: 1px solid ${EmailTheme.border}; border-radius: 6px; padding: 20px; margin: 25px 0; }
        .items-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .items-table th, .items-table td { padding: 10px; text-align: left; border-bottom: 1px solid ${EmailTheme.border}; font-size: 14px;}
        .items-table th { color: #555555; text-transform: uppercase; font-size: 12px;}
        .total-row td { font-weight: bold; border-bottom: none; padding-top: 15px; }
        h2 { color: ${EmailTheme.primary}; margin-top: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${logoHtml}
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          ${config.tagline ? `<p>${config.tagline}</p>` : `<p>${brand.getCompanyName()} | Handcrafted in Bangladesh</p>`}
          ${supportEmailHtml}
          <p style="margin-top: 10px;"><a href="${config.url}" style="color: ${EmailTheme.primary}; text-decoration: none;">${config.url.replace(/^https?:\/\//, '')}</a></p>
          ${socialLinksHtml ? `<div style="margin-top: 15px;">${socialLinksHtml}</div>` : ''}
          <p style="margin-top: 15px; font-size: 12px;">&copy; ${currentYear} ${brand.getCompanyName()}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getOrderItemsHtml(items: any[]) {
  if (!items || items.length === 0) return '';
  
  let html = `
    <table class="items-table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Qty</th>
          <th style="text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  items.forEach(item => {
    html += `
        <tr>
          <td>${escapeHtml(item.productName)}</td>
          <td>${item.quantity}</td>
          <td style="text-align: right;">৳${item.total.toLocaleString()}</td>
        </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
  `;
  
  return html;
}

export async function renderOrderConfirmation(order: any, config: SiteConfig): Promise<{ subject: string, html: string }> {
  const customerName = escapeHtml(order.shippingAddress?.name || "Customer");
  const itemsHtml = getOrderItemsHtml(order.items);
  const advanceRequired = order.total * 0.2;
  const baseUrl = config.url;

  let trackButtonHtml = `<a href="${baseUrl}/track?orderNumber=${order.orderNumber}" class="btn" style="margin-right: 10px;">Track Order</a>`;

  const content = `
    <h2>Thank you for your order!</h2>
    <p>Hi ${customerName},</p>
    <p>We've successfully received your order <strong>#${order.orderNumber}</strong>. It is currently being processed.</p>
    
    <div class="order-summary">
      <h3 style="margin-top: 0; color: ${EmailTheme.primary}; border-bottom: 2px solid ${EmailTheme.primary}; padding-bottom: 10px; display: inline-block;">Order Summary</h3>
      ${itemsHtml}
      <table style="width: 100%; margin-top: 15px; font-size: 14px;">
        <tr>
          <td style="padding: 5px 0; color: #555;">Subtotal:</td>
          <td style="text-align: right; padding: 5px 0;">৳${order.subtotal.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #555;">Shipping:</td>
          <td style="text-align: right; padding: 5px 0;">৳${order.shippingCost.toLocaleString()}</td>
        </tr>
        ${order.discountAmount > 0 ? `
        <tr>
          <td style="padding: 5px 0; color: #2e7d32;">Discount:</td>
          <td style="text-align: right; padding: 5px 0; color: #2e7d32;">-৳${order.discountAmount.toLocaleString()}</td>
        </tr>` : ''}
        <tr style="font-weight: bold; font-size: 16px;">
          <td style="padding: 10px 0; border-top: 1px solid #ddd;">Total:</td>
          <td style="text-align: right; padding: 10px 0; border-top: 1px solid #ddd;">৳${order.total.toLocaleString()}</td>
        </tr>
      </table>
      
      <div style="background-color: #f5ece9; padding: 15px; border-radius: 4px; margin-top: 15px; border-left: 4px solid ${EmailTheme.primary};">
        <p style="margin: 0; color: ${EmailTheme.primary}; font-weight: bold;">Advance Required (20%): ৳${advanceRequired.toLocaleString()}</p>
      </div>
    </div>

    <p>Our representative will contact you shortly to confirm the advance payment details. Once the advance is received, production will begin.</p>
    
    <div style="text-align: center;">
      ${trackButtonHtml}
      <a href="${baseUrl}" class="btn">Visit Website</a>
    </div>
  `;

  const html = await getBaseTemplate(`Order Confirmation - ${order.orderNumber}`, content, config);
  return { subject: `Order Confirmation - ${order.orderNumber} | ${config.name || 'Rootgrain'}`, html };
}

export async function renderPaymentReceipt(order: any, amount: number, config: SiteConfig): Promise<{ subject: string, html: string }> {
  const customerName = escapeHtml(order.shippingAddress?.name || "Customer");
  const baseUrl = config.url;

  let trackButtonHtml = `<a href="${baseUrl}/track?orderNumber=${order.orderNumber}" class="btn" style="margin-right: 10px;">Track Order</a>`;

  const content = `
    <h2>Payment Received</h2>
    <p>Hi ${customerName},</p>
    <p>We've successfully received your payment of <strong>৳${amount.toLocaleString()}</strong> for order <strong>#${order.orderNumber}</strong>.</p>
    <p>A receipt document has been attached to this email.</p>
    
    <div style="text-align: center;">
      ${trackButtonHtml}
      <a href="${baseUrl}" class="btn">Visit Website</a>
    </div>
  `;

  const html = await getBaseTemplate(`Payment Receipt - ${order.orderNumber}`, content, config);
  return { subject: `Payment Receipt - ${order.orderNumber} | ${config.name || 'Rootgrain'}`, html };
}

export async function renderFinalInvoiceAvailable(order: any, config: SiteConfig): Promise<{ subject: string, html: string }> {
  const customerName = escapeHtml(order.shippingAddress?.name || "Customer");
  const baseUrl = config.url;

  let trackButtonHtml = `<a href="${baseUrl}/track?orderNumber=${order.orderNumber}" class="btn" style="margin-right: 10px;">Track Order</a>`;

  const content = `
    <h2>Your Final Invoice is Ready</h2>
    <p>Hi ${customerName},</p>
    <p>Your order <strong>#${order.orderNumber}</strong> has completed production and is ready for delivery.</p>
    <p>We have generated your Final Invoice, which is attached to this email.</p>
    
    <div style="text-align: center;">
      ${trackButtonHtml}
      <a href="${baseUrl}" class="btn">Visit Website</a>
    </div>
  `;

  const html = await getBaseTemplate(`Final Invoice - ${order.orderNumber}`, content, config);
  return { subject: `Final Invoice - ${order.orderNumber} | ${config.name || 'Rootgrain'}`, html };
}

export class CommunicationService {
  static async sendEmailWithAttachment(options: {
    to: string;
    subject: string;
    html: string;
    attachments?: Array<{ filename: string; content: Buffer }>;
  }) {
    const config = await getFreshSiteConfig();
    const sender = await getEmailSender(config);
    const resend = getResendClient();

    const result = await resend.emails.send({
      from: sender,
      ...(config.support?.email && { replyTo: config.support.email }),
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });
    
    if (result.error) {
        throw new Error(result.error.message);
    }
    return result.data;
  }
}
