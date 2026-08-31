import { Resend } from "resend";
import { generateInvoicePDF } from "./pdfGenerator";
import { logger } from "./logger";
import { getFreshSiteConfig } from "@/data/site-config";
import { EmailTheme } from "./email/theme";
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
function getResendClient(): Resend {
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

async function getBaseTemplate(title: string, content: string, config: SiteConfig) {
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

function getOrderItemsHtml(items: any[]) {
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



export async function sendOrderStatusUpdateEmail(order: any, customerEmail: string, status: string) {
  const traceStartTime = Date.now();
  let currentStage = "START";
  try {
    logger.info({ orderNumber: order?.orderNumber, status, stage: currentStage }, "STATUS_EMAIL_START");
    const config = await getFreshSiteConfig();
    const sender = await getEmailSender(config);
    const customerName = escapeHtml(order.shippingAddress?.name || "Customer");
    let statusMessage = "Your order status has been updated.";
    let heading = "Order Update";
    
    if (status === "CONFIRMED") {
      heading = "Order Confirmed!";
      statusMessage = "Great news! Your advance payment has been received and your order is now <strong>Confirmed</strong>. We have started production and will update you once it's ready for dispatch.";
    } else if (status === "DISPATCHED") {
      heading = "Order Dispatched!";
      statusMessage = "Your order has been <strong>Dispatched</strong> and is on its way to you! Our delivery team will contact you soon.";
    } else if (status === "DELIVERED") {
      heading = "Order Delivered!";
      statusMessage = "Your order has been marked as <strong>Delivered</strong>. Thank you for choosing us to furnish your home!";
    } else if (status === "PENDING_ADVANCE" || status === "PENDING") {
      heading = "Order Pending";
      statusMessage = "Your order status is currently <strong>Pending</strong>. We are awaiting your advance payment or further action to begin processing.";
    } else if (status === "PROCESSING") {
      heading = "Order in Production";
      statusMessage = "Your order is now <strong>Processing</strong> in our workshop. Our craftsmen are building your piece with care.";
    } else if (status === "REJECTED") {
      heading = "Order Rejected";
      statusMessage = "Unfortunately, your order has been <strong>Rejected</strong>. Please contact our support team for more details.";
    } else if (status === "CANCELLED") {
      heading = "Order Cancelled";
      statusMessage = "Your order has been <strong>Cancelled</strong>. If you believe this is an error or wish to re-order, please visit our website or contact support.";
    }

    const itemsHtml = getOrderItemsHtml(order.items);

    const content = `
      <h2>${heading}</h2>
      <p>Hi ${customerName},</p>
      <p>An update on your order <strong>#${order.orderNumber}</strong>:</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid ${EmailTheme.primary}; margin: 25px 0; border-radius: 0 4px 4px 0;">
        <p style="margin: 0; font-size: 16px; line-height: 1.5;">${statusMessage}</p>
      </div>

      ${itemsHtml ? `
      <div class="order-summary" style="margin-top: 30px;">
        <h4 style="margin-top: 0; color: #555;">Items in this order:</h4>
        ${itemsHtml}
      </div>
      ` : ''}

      <div style="text-align: center; margin-top: 30px;">
        <a href="${config.url}" class="btn">Visit Website</a>
      </div>
    `;

    const brand = new BrandService(config);
    const html = await getBaseTemplate(`Order Update - ${order.orderNumber}`, content, config);
    
    currentStage = "TEMPLATE_DONE";
    logger.info({ orderNumber: order?.orderNumber, status, stage: currentStage, durationMs: Date.now() - traceStartTime }, "STATUS_EMAIL_TEMPLATE_DONE");

    currentStage = "RESEND_START";
    logger.info({ orderNumber: order?.orderNumber, status, stage: currentStage }, "STATUS_EMAIL_RESEND_START");
    const resendStartTime = Date.now();

    await getResendClient().emails.send({
      from: sender,
      ...(config.support?.email && { replyTo: config.support.email }),
      to: customerEmail,
      subject: `Order Update: ${status} - ${order.orderNumber} | ${brand.getCompanyName()}`,
      html,
    });

    currentStage = "RESEND_SUCCESS";
    logger.info({ orderNumber: order?.orderNumber, status, stage: currentStage, durationMs: Date.now() - resendStartTime }, "STATUS_EMAIL_RESEND_SUCCESS");
    
    logger.info({ orderNumber: order?.orderNumber, status }, "[EMAIL] Status update sent");
  } catch (error: any) {
    logger.error({ 
      err: error,
      orderNumber: order?.orderNumber,
      status,
      stage: currentStage,
      errorName: error?.name,
      errorMessage: error?.message,
      stack: error?.stack
    }, "STATUS_EMAIL_ERROR");
    logger.error({ err: error, orderNumber: order?.orderNumber, status }, "[EMAIL ERROR] Failed to send status update");
  }
}

export async function sendAbandonedCartEmail(customerEmail: string, items: any[], promoCode: string, discountPercent: number) {
  try {
    const config = await getFreshSiteConfig();
    const sender = await getEmailSender(config);
    const itemsHtml = getOrderItemsHtml(items);
    
    const content = `
      <h2>We saved your cart!</h2>
      <p>Hi there,</p>
      <p>We noticed you left some beautiful furniture in your cart. We've saved it for you!</p>
      
      <div class="order-summary" style="margin-top: 25px;">
        <h3 style="margin-top: 0; color: ${EmailTheme.primary};">Your Saved Items:</h3>
        ${itemsHtml}
      </div>

      <div style="background-color: #f8f9fa; border: 2px dashed ${EmailTheme.primary}; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
        <p style="margin: 0 0 10px 0; font-size: 16px;">Come back and complete your order with a <strong>${discountPercent}% discount</strong>!</p>
        <p style="margin: 0; font-size: 14px; color: #555;">Use promo code at checkout:</p>
        <div style="font-size: 24px; font-weight: bold; color: ${EmailTheme.primary}; letter-spacing: 2px; margin-top: 10px;">${promoCode}</div>
      </div>

      <div style="text-align: center;">
        <a href="${config.url}/checkout" class="btn">Complete My Order</a>
      </div>
    `;

    const brand = new BrandService(config);
    const html = await getBaseTemplate(`Complete Your Order`, content, config);

    await getResendClient().emails.send({
      from: sender,
      ...(config.support?.email && { replyTo: config.support.email }),
      to: customerEmail,
      subject: `You left something behind! (Here's ${discountPercent}% off) | ${brand.getCompanyName()}`,
      html,
    });
    
    logger.info({ customerEmail }, "[EMAIL] Abandoned cart recovery email sent");
  } catch (error) {
    logger.error({ err: error }, "[EMAIL ERROR] Failed to send abandoned cart email");
  }
}

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  try {
    const config = await getFreshSiteConfig();
    const sender = await getEmailSender(config);
    const content = `
      <h2>Reset Your Password</h2>
      <p>We received a request to reset the password for your account.</p>
      <p>If you didn't make this request, you can safely ignore this email.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" class="btn">Reset Password</a>
      </div>
      
      <p style="font-size: 13px; color: #666;">
        Or copy and paste this link into your browser:<br>
        <a href="${resetLink}" style="color: ${EmailTheme.primary};">${resetLink}</a>
      </p>
      <p style="font-size: 13px; color: #666; margin-top: 20px;">
        This link will expire in 1 hour for your security.
      </p>
    `;

    const brand = new BrandService(config);
    const html = await getBaseTemplate(`Reset Your Password`, content, config);

    await getResendClient().emails.send({
      from: sender,
      ...(config.support?.email && { replyTo: config.support.email }),
      to: email,
      subject: `Reset Your Password | ${brand.getCompanyName()}`,
      html,
    });
    
    logger.info({ email }, "[EMAIL] Password reset email sent");
  } catch (error) {
    logger.error({ err: error }, "[EMAIL ERROR] Failed to send password reset email");
  }
}

export async function sendVerificationEmail(email: string, verifyLink: string) {
  try {
    const config = await getFreshSiteConfig();
    const brand = new BrandService(config);
    const sender = await getEmailSender(config);
    const content = `
      <h2>Verify Your Email Address</h2>
      <p>Thank you for registering with ${brand.getCompanyName()}!</p>
      <p>Please click the button below to verify your email address and activate your account.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyLink}" class="btn">Verify Email</a>
      </div>
      
      <p style="font-size: 13px; color: #666;">
        Or copy and paste this link into your browser:<br>
        <a href="${verifyLink}" style="color: ${EmailTheme.primary};">${verifyLink}</a>
      </p>
      <p style="font-size: 13px; color: #666; margin-top: 20px;">
        This link will expire in 1 hour. If you didn't create an account, you can safely ignore this email.
      </p>
    `;

    const html = await getBaseTemplate(`Verify Your Email`, content, config);

    await getResendClient().emails.send({
      from: sender,
      ...(config.support?.email && { replyTo: config.support.email }),
      to: email,
      subject: `Verify Your Email | ${brand.getCompanyName()}`,
      html,
    });
    
    logger.info({ email }, "[EMAIL] Verification email sent");
  } catch (error) {
    logger.error({ err: error }, "[EMAIL ERROR] Failed to send verification email");
  }
}

export async function sendLoginAttemptEmail(email: string) {
  try {
    const config = await getFreshSiteConfig();
    const sender = await getEmailSender(config);
    const content = `
      <h2>Registration Attempt</h2>
      <p>We noticed a recent registration attempt using your email address.</p>
      <p>You already have an active account with us. Please log in using your existing credentials or social login.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${config.url}/login" class="btn">Log In</a>
      </div>
      
      <p style="font-size: 13px; color: #666; margin-top: 20px;">
        If you didn't make this request, your account is still secure and you don't need to take any action.
      </p>
    `;

    const brand = new BrandService(config);
    const html = await getBaseTemplate(`Registration Attempt`, content, config);

    await getResendClient().emails.send({
      from: sender,
      ...(config.support?.email && { replyTo: config.support.email }),
      to: email,
      subject: `Registration Attempt | ${brand.getCompanyName()}`,
      html,
    });
    
    logger.info({ email }, "[EMAIL] Enumeration protection login attempt email sent");
  } catch (error) {
    logger.error({ err: error }, "[EMAIL ERROR] Failed to send enumeration protection email");
  }
}

export async function sendWelcomeEmail(user: { name?: string | null; email?: string | null }) {
  if (!user.email) return;

  try {
    const config = await getFreshSiteConfig();
    const sender = await getEmailSender(config);
    const currentYear = new Date().getFullYear();
    const siteUrl = config.url;
    const firstName = user.name ? user.name.split(" ")[0] : "there";
    
    const socialLinksHtml = buildSocialLinksHtml(config);
    const phoneDisplay = config.support?.phone?.display;
    const emailDisplay = config.support?.email;
    
    const brand = new BrandService(config);
    const logoHtml = `<img src="${brand.getEmailLogo()}" alt="${brand.getCompanyName()}" style="max-height: 40px; border: 0;" />`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${brand.getCompanyName()}!</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: ${EmailTheme.cream}; margin: 0; padding: 0; color: ${EmailTheme.textDark}; }
          .preheader { display: none; max-height: 0px; overflow: hidden; }
          .container { max-width: 600px; margin: 40px auto; background-color: ${EmailTheme.containerBg}; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
          .header { background-color: ${EmailTheme.forestGreen}; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; line-height: 1.8; font-size: 16px; }
          .content h1 { color: ${EmailTheme.forestGreen}; font-size: 24px; margin-top: 0; font-weight: 600; }
          .content p { margin-bottom: 20px; }
          .cta-container { text-align: center; margin: 35px 0; }
          .btn-primary { display: inline-block; background-color: ${EmailTheme.accent}; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 4px; font-weight: bold; margin: 0 10px 10px 0; transition: background-color 0.3s; }
          .btn-secondary { display: inline-block; background-color: transparent; border: 2px solid ${EmailTheme.forestGreen}; color: ${EmailTheme.forestGreen} !important; text-decoration: none; padding: 12px 26px; border-radius: 4px; font-weight: bold; margin: 0 0 10px 0; }
          .footer { background-color: ${EmailTheme.cream}; padding: 30px; text-align: center; font-size: 14px; border-top: 1px solid #eaddd5; color: ${EmailTheme.textMuted}; }
          .footer h3 { color: ${EmailTheme.forestGreen}; margin: 0 0 5px 0; font-size: 16px; }
          .footer p { margin: 5px 0; }
          .social-links { margin-top: 15px; }
          .social-links a { display: inline-block; margin: 0 5px; }
          @media only screen and (max-width: 600px) {
            .container { margin: 20px 10px; width: auto; }
            .btn-primary, .btn-secondary { display: block; margin: 10px auto; width: 80%; }
          }
        </style>
      </head>
      <body>
        <span class="preheader">${config.tagline || 'Your sustainable journey starts today.'}</span>
        <div class="container">
          <div class="header">
            ${logoHtml}
          </div>
          <div class="content">
            <h1>Welcome to the ${brand.getCompanyName()} Family!</h1>
            <p>Hi ${firstName},</p>
            <p>Thank you for joining us. We're thrilled to have you with us on this journey.</p>
            <p>At ${brand.getCompanyName()}, we believe that every grain tells a story. Our handcrafted furniture is designed to bring the timeless elegance of nature into your home, combining sustainable practices with exceptional craftsmanship.</p>
            <p>Whether you're looking to furnish a new space or find that perfect statement piece, our collection has been curated with you in mind.</p>
            
            <div class="cta-container">
              <a href="${siteUrl}/collection" class="btn-primary">Explore Collection</a>
              <a href="${siteUrl}" class="btn-secondary">Visit Website</a>
            </div>
            
            <p style="margin-top: 30px;">We can't wait to see how you style your space!</p>
            <p>Warmly,<br><strong>The ${brand.getCompanyName()} Team</strong></p>
          </div>
          <div class="footer">
            <h3>${brand.getCompanyName()}</h3>
            <p>${config.tagline || 'Every Grain Tells a Story.'}</p>
            ${phoneDisplay || emailDisplay ? `
            <p style="margin-top: 15px;">
              ${phoneDisplay ? `<strong>WhatsApp:</strong> ${phoneDisplay}<br>` : ''}
              ${emailDisplay ? `<strong>Email:</strong> <a href="mailto:${emailDisplay}" style="color: ${EmailTheme.accent};">${emailDisplay}</a>` : ''}
            </p>
            ` : ''}
            ${socialLinksHtml ? `<div class="social-links">${socialLinksHtml}</div>` : ''}
            <p style="margin-top: 20px; font-size: 12px; color: #888;">&copy; ${currentYear} ${brand.getCompanyName()}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data } = await getResendClient().emails.send({
      from: sender,
      ...(config.support?.email && { replyTo: config.support.email }),
      to: user.email,
      subject: `🌿 Welcome to ${brand.getCompanyName()}!`,
      html,
    });
    
    logger.info({ email: user.email, messageId: data?.id }, "[EMAIL] Welcome email sent");
  } catch (error) {
    logger.error({ err: error, email: user.email }, "[EMAIL ERROR] Failed to send welcome email");
  }
}
