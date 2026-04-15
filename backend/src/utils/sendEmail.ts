import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';

interface SendEmailOptions {
  email: string;
  subject: string;
  message: string;    // plain-text fallback
  html?: string;      // rich HTML version
  attachments?: any[]; // For PDF or other attachments
}

// ─── Core Transporter (Gmail SMTP via App Password) ────────────────────────
const createTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP_USER or SMTP_PASS not set in .env');
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,          // STARTTLS on port 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS?.replace(/\s/g, ''),  // Gmail App Password (16 chars with no spaces)
    },
  });
};

// ─── Generic Email Sender ───────────────────────────────────────────────────
const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"ScaleCart" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
    attachments: options.attachments,
  });

  console.log(`Email sent → ${options.email} | Subject: "${options.subject}"`);
};

// ─── Order Confirmation Email ───────────────────────────────────────────────
interface OrderEmailData {
  orderId: string;
  totalAmount: number;
  itemCount?: number;
  shippingAddress?: string;
  paymentId?: string;
}

export const sendOrderConfirmationEmail = async (
  email: string,
  order: OrderEmailData
): Promise<void> => {
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; background: #f1f3f6; }
      .wrapper { max-width: 580px; margin: 32px auto; }
      /* ── Header ── */
      .header { background: #2874f0; padding: 24px 32px; border-radius: 8px 8px 0 0; text-align: center; }
      .header h1 { color: #fff; font-size: 26px; letter-spacing: 0.5px; }
      .header h1 span { color: #ffe500; }
      /* ── Body ── */
      .card { background: #fff; padding: 32px; border: 1px solid #e0e0e0; }
      .greeting { font-size: 18px; color: #212121; font-weight: 600; margin-bottom: 8px; }
      .subtext  { font-size: 14px; color: #666; margin-bottom: 24px; }
      /* ── Status Banner ── */
      .status-banner { background: #e8f5e9; border-left: 4px solid #43a047; border-radius: 4px; padding: 14px 20px; margin-bottom: 24px; }
      .status-banner p { color: #2e7d32; font-weight: 700; font-size: 15px; }
      /* ── Detail Rows ── */
      .details { border: 1px solid #f0f0f0; border-radius: 6px; overflow: hidden; margin-bottom: 24px; }
      .row { display: flex; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #f5f5f5; font-size: 14px; }
      .row:last-child { border-bottom: none; }
      .row .label { color: #888; }
      .row .value { color: #212121; font-weight: 600; text-align: right; max-width: 60%; }
      /* ── CTA Button ── */
      .cta { text-align: center; margin-bottom: 24px; }
      .cta a { display: inline-block; background: #fb641b; color: #fff; padding: 13px 36px; border-radius: 4px; text-decoration: none; font-weight: 700; font-size: 15px; letter-spacing: 0.5px; }
      /* ── Footer ── */
      .footer { background: #f9f9f9; padding: 18px 32px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #aaa; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="header">
        <h1>Scale<span>Cart</span></h1>
      </div>
      <div class="card">
        <p class="greeting">Your Order is Confirmed!</p>
        <p class="subtext">Thank you for shopping with ScaleCart. Your order has been received and is being processed.</p>

        <div class="status-banner">
          <p>Payment Received — Order Placed Successfully</p>
        </div>

        <div class="details">
          <div class="row">
            <span class="label">Order ID</span>
            <span class="value" style="font-family:monospace;">#${order.orderId.slice(-10).toUpperCase()}</span>
          </div>
          <div class="row">
            <span class="label">Items Ordered</span>
            <span class="value">${order.itemCount} item${order.itemCount !== 1 ? 's' : ''}</span>
          </div>
          <div class="row">
            <span class="label">Total Amount</span>
            <span class="value" style="color:#2874f0; font-size:16px;">₹${Math.floor(order.totalAmount).toLocaleString('en-IN')}</span>
          </div>
          <div class="row">
            <span class="label">Delivery Charges</span>
            <span class="value" style="color:#388e3c;">FREE</span>
          </div>
          ${order.shippingAddress ? `
          <div class="row">
            <span class="label">Delivering To</span>
            <span class="value">${order.shippingAddress}</span>
          </div>` : ''}
          <div class="row">
            <span class="label">Estimated Delivery</span>
            <span class="value">3–5 Business Days</span>
          </div>
        </div>

        <div class="cta">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders">Track My Order</a>
        </div>

        <p style="font-size:13px; color:#888; text-align:center;">
          Need help? Reply to this email or visit our support page.<br/>
          We are available 24/7 for you.
        </p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} ScaleCart. All rights reserved.</p>
        <p style="margin-top:4px;">You are receiving this because you placed an order on ScaleCart.</p>
      </div>
    </div>
  </body>
  </html>
  `;

  // --- PDF GENERATION LOGIC ---
  const generateInvoicePDF = (): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Business Header
      doc.fillColor('#2874f0').fontSize(26).text('ScaleCart Invoice', { align: 'right' });
      doc.fontSize(10).fillColor('gray')
        .text(`Order ID: #${order.orderId.slice(-10).toUpperCase()}`, { align: 'right' })
        .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
      doc.moveDown(2);

      // Customer Info
      doc.fillColor('#000000').fontSize(16).text('Billed To:');
      doc.fontSize(12).text(order.shippingAddress || 'N/A').moveDown(2);

      // Order Details Table
      doc.fontSize(14).fillColor('#2874f0').text('Order Details');
      doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
      doc.moveDown(1.5);
      
      doc.fillColor('#000000').fontSize(12)
        .text(`Items Ordered: ${order.itemCount}`)
        .moveDown(0.5)
        .text('Delivery Charges: FREE')
        .moveDown(1);

      doc.fontSize(16).fillColor('#388e3c')
        .text(`Total Amount Paid: INR ${Math.floor(order.totalAmount).toLocaleString('en-IN')}`, { align: 'right' });

      doc.moveDown(3);
      doc.fontSize(10).fillColor('gray').text('Thank you for shopping with ScaleCart. This is a computer generated invoice and does not require a signature.', { align: 'center' });
      doc.end();
    });
  };

  const invoiceBuffer = await generateInvoicePDF();

  await sendEmail({
    email,
    subject: `Order Confirmed #${order.orderId.slice(-8).toUpperCase()} — ScaleCart`,
    message: `Your order has been confirmed! Order ID: ${order.orderId}. Total: ₹${Math.floor(order.totalAmount)}. Estimated delivery: 3-5 business days.`,
    html,
    attachments: [
      {
        filename: `ScaleCart_Invoice_${order.orderId.slice(-8)}.pdf`,
        content: invoiceBuffer,
      }
    ]
  });
};

// ─── Welcome Email (on registration) ───────────────────────────────────────
export const sendWelcomeEmail = async (email: string, firstName: string): Promise<void> => {
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8"/>
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; background: #f1f3f6; }
      .wrapper { max-width: 540px; margin: 32px auto; }
      .header { background: #2874f0; padding: 24px; border-radius: 8px 8px 0 0; text-align: center; }
      .header h1 { color: #fff; font-size: 24px; }
      .header h1 span { color: #ffe500; }
      .card { background: #fff; padding: 32px; border: 1px solid #e0e0e0; text-align: center; }
      .card h2 { color: #212121; margin-bottom: 12px; }
      .card p  { font-size: 14px; color: #666; margin-bottom: 20px; line-height: 1.7; }
      .cta a { display: inline-block; background: #2874f0; color: #fff; padding: 13px 32px; border-radius: 4px; text-decoration: none; font-weight: 700; }
      .footer { background: #f9f9f9; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; padding: 16px; text-align: center; font-size: 12px; color: #aaa; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="header"><h1>Scale<span>Cart</span></h1></div>
      <div class="card">
        <h2>Welcome, ${firstName || 'there'}!</h2>
        <p>
          Your account has been created successfully.<br/>
          Start exploring thousands of products across electronics, fashion, beauty, and more.
        </p>
        <div class="cta" style="margin-bottom:20px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}">Start Shopping</a>
        </div>
        <p style="font-size:12px; color:#aaa;">If you didn't create this account, please ignore this email.</p>
      </div>
      <div class="footer">© ${new Date().getFullYear()} ScaleCart. All rights reserved.</div>
    </div>
  </body>
  </html>
  `;

  await sendEmail({
    email,
    subject: 'Welcome to ScaleCart — Happy Shopping!',
    message: `Welcome ${firstName}! Your ScaleCart account is ready. Start shopping at ${process.env.FRONTEND_URL || 'http://localhost:5173'}`,
    html,
  });
};

export default sendEmail;