import nodemailer from 'nodemailer';
import "dotenv/config"; // Ensure dotenv loads it correctly for testing

async function testEmail() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS?.replace(/\s/g, '');

  console.log(`Testing SMTP connection -> USER: ${user}, PASS LENGTH: ${pass?.length}`);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // TLS
    auth: { user, pass },
  });

  try {
    await transporter.verify();
    console.log("✅ SMTP Verification Successful!");

    await transporter.sendMail({
      from: `"Test " <${user}>`,
      to: user, // send to self
      subject: "Test Diagnostic Email",
      text: "If you receive this, Nodemailer is working.",
    });
    console.log("✅ Test Email sent successfully to", user);
  } catch (error: any) {
    console.error("❌ SMTP Error:", error.message);
  }
}

testEmail();
