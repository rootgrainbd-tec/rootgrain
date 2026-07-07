import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.resend.com",
  port: 465,
  secure: true,
  auth: {
    user: "resend",
    pass: process.env.RESEND_API_KEY,
  },
});

const SENDER = '"Rootgrain" <support@rootgrain.bd>';
const BRAND_COLOR = "#5D4037";
const BG_COLOR = "#fcfaf8";

function getBaseTemplate(title: string, content: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { background-color: ${BRAND_COLOR}; padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px; text-transform: uppercase; font-weight: 600; }
        .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
        .footer { background-color: ${BG_COLOR}; padding: 20px; text-align: center; color: #777777; font-size: 14px; border-top: 1px solid #eeeeee; }
        .btn { display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff !important; text-decoration: none; padding: 12px 25px; border-radius: 4px; font-weight: bold; margin-top: 20px; }
        .order-summary { background-color: ${BG_COLOR}; border: 1px solid #eeeeee; border-radius: 6px; padding: 20px; margin: 25px 0; }
        .items-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .items-table th, .items-table td { padding: 10px; text-align: left; border-bottom: 1px solid #eeeeee; font-size: 14px;}
        .items-table th { color: #555555; text-transform: uppercase; font-size: 12px;}
        .total-row td { font-weight: bold; border-bottom: none; padding-top: 15px; }
        h2 { color: ${BRAND_COLOR}; margin-top: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Rootgrain</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>Rootgrain Furniture | Handcrafted in Bangladesh</p>
          <p>Need help? Contact us at <a href="mailto:support@rootgrain.bd" style="color: ${BRAND_COLOR};">support@rootgrain.bd</a></p>
          <p style="margin-top: 10px;"><a href="https://rootgrain.bd" style="color: ${BRAND_COLOR}; text-decoration: none;">www.rootgrain.bd</a></p>
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
          <td>${item.productName}</td>
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

export async function sendOrderConfirmationEmail(order: any, customerEmail: string) {
  try {
    const customerName = order.shippingAddress?.name || "Customer";
    const itemsHtml = getOrderItemsHtml(order.items);
    const advanceRequired = order.total * 0.2;

    const content = `
      <h2>Thank you for your order!</h2>
      <p>Hi ${customerName},</p>
      <p>We've successfully received your order <strong>#${order.orderNumber}</strong>. It is currently being processed.</p>
      
      <div class="order-summary">
        <h3 style="margin-top: 0; color: ${BRAND_COLOR}; border-bottom: 2px solid ${BRAND_COLOR}; padding-bottom: 10px; display: inline-block;">Order Summary</h3>
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
        
        <div style="background-color: #f5ece9; padding: 15px; border-radius: 4px; margin-top: 15px; border-left: 4px solid ${BRAND_COLOR};">
          <p style="margin: 0; color: ${BRAND_COLOR}; font-weight: bold;">Advance Required (20%): ৳${advanceRequired.toLocaleString()}</p>
        </div>
      </div>

      <p>Our representative will contact you shortly to confirm the advance payment details. Once the advance is received, production will begin.</p>
      
      <div style="text-align: center;">
        <a href="https://rootgrain.bd" class="btn">Visit Website</a>
      </div>
    `;

    const html = getBaseTemplate(\`Order Confirmation - \${order.orderNumber}\`, content);

    await transporter.sendMail({
      from: SENDER,
      to: customerEmail,
      subject: \`Order Confirmation - \${order.orderNumber} | Rootgrain\`,
      html,
    });
    
    console.log(\`[EMAIL] Order confirmation sent to \${customerEmail}\`);
  } catch (error) {
    console.error("[EMAIL ERROR] Failed to send order confirmation:", error);
  }
}

export async function sendOrderStatusUpdateEmail(order: any, customerEmail: string, status: string) {
  try {
    const customerName = order.shippingAddress?.name || "Customer";
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
      statusMessage = "Your order has been marked as <strong>Delivered</strong>. Thank you for choosing Rootgrain to furnish your home!";
    }

    const itemsHtml = getOrderItemsHtml(order.items);

    const content = \`
      <h2>\${heading}</h2>
      <p>Hi \${customerName},</p>
      <p>An update on your order <strong>#\${order.orderNumber}</strong>:</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid \${BRAND_COLOR}; margin: 25px 0; border-radius: 0 4px 4px 0;">
        <p style="margin: 0; font-size: 16px; line-height: 1.5;">\${statusMessage}</p>
      </div>

      \${itemsHtml ? \`
      <div class="order-summary" style="margin-top: 30px;">
        <h4 style="margin-top: 0; color: #555;">Items in this order:</h4>
        \${itemsHtml}
      </div>
      \` : ''}

      <div style="text-align: center; margin-top: 30px;">
        <a href="https://rootgrain.bd" class="btn">Visit Website</a>
      </div>
    \`;

    const html = getBaseTemplate(\`Order Update - \${order.orderNumber}\`, content);

    await transporter.sendMail({
      from: SENDER,
      to: customerEmail,
      subject: \`Order Update: \${status} - \${order.orderNumber} | Rootgrain\`,
      html,
    });

    console.log(\`[EMAIL] Status update (\${status}) sent to \${customerEmail}\`);
  } catch (error) {
    console.error("[EMAIL ERROR] Failed to send status update:", error);
  }
}
