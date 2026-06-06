import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async ({ to, cc, subject, html, attachments = [] }) => {
  try {
    const info = await transport.sendMail({
      from: process.env.SMTP_USER || 'no-reply@vendorbridge.test',
      to,
      cc,
      subject,
      html,
      attachments,
    });
    return info;
  } catch (error) {
    console.warn('SMTP sending failed. Email simulated:', { to, cc, subject, html, attachmentsCount: attachments.length });
    return { messageId: 'simulated-id-' + Date.now(), accepted: [to] };
  }
};
