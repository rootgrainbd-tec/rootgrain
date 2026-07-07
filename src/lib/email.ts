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

export async function sendOrderConfirmationEmail(order: any, customerEmail: string) {
  try {
    const html = `
      <div style="font-family: sans-serif; max-w-xl mx-auto; padding: 20px; color: #333;">
        <h1 style="color: #6d4c41;">Thank you for your order!</h1>
        <p>Hi there,</p>
        <p>We've received your order <strong>${order.orderNumber}</strong> and it is currently being processed.</p>
        
        <div style="background-color: #fcfaf8; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #4e342e;">Order Summary</h3>
          <p><strong>Total Amount:</strong> ৳${order.total.toLocaleString()}</p>
          <p><strong>Advance Required (20%):</strong> ৳${(order.total * 0.2).toLocaleString()}</p>
          <p><strong>Status:</strong> ${order.status.replace("_", " ")}</p>
        </div>

        <p>Our representative will contact you shortly to confirm the advance payment details. Once the advance is received, production will begin.</p>
        
        <p>You can track your order status anytime from your account dashboard.</p>
        <p>Best regards,<br/><strong>The Rootgrain Team</strong></p>
      </div>
    `;

    await transporter.sendMail({
      from: SENDER,
      to: customerEmail,
      subject: `Order Confirmation - ${order.orderNumber} | Rootgrain`,
      html,
    });
    
    console.log(`[EMAIL] Order confirmation sent to ${customerEmail}`);
  } catch (error) {
    console.error("[EMAIL ERROR] Failed to send order confirmation:", error);
  }
}

export async function sendOrderStatusUpdateEmail(order: any, customerEmail: string, status: string) {
  try {
    let statusMessage = "Your order status has been updated.";
    
    if (status === "CONFIRMED") {
      statusMessage = "Great news! Your advance payment has been received and your order is now <strong>Confirmed</strong>. We have started production.";
    } else if (status === "DISPATCHED") {
      statusMessage = "Your order has been <strong>Dispatched</strong> and is on its way to you! Our delivery team will contact you soon.";
    } else if (status === "DELIVERED") {
      statusMessage = "Your order has been marked as <strong>Delivered</strong>. Thank you for choosing Rootgrain!";
    }

    const html = `
      <div style="font-family: sans-serif; max-w-xl mx-auto; padding: 20px; color: #333;">
        <h1 style="color: #6d4c41;">Order Update</h1>
        <p>Hi there,</p>
        <p>An update on your order <strong>${order.orderNumber}</strong>:</p>
        
        <div style="background-color: #fcfaf8; padding: 15px; border-left: 4px solid #6d4c41; margin: 20px 0;">
          <p style="margin: 0; font-size: 16px;">${statusMessage}</p>
        </div>

        <p>Thank you for being with us.</p>
        <p>Best regards,<br/><strong>The Rootgrain Team</strong></p>
      </div>
    `;

    await transporter.sendMail({
      from: SENDER,
      to: customerEmail,
      subject: `Order Update: ${status} - ${order.orderNumber} | Rootgrain`,
      html,
    });

    console.log(`[EMAIL] Status update (${status}) sent to ${customerEmail}`);
  } catch (error) {
    console.error("[EMAIL ERROR] Failed to send status update:", error);
  }
}
