import nodemailer from 'nodemailer';

let transporter = null;

const initializeTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error(
      'Email configuration missing. Please set EMAIL_USER and EMAIL_PASS in .env file'
    );
    throw new Error(
      'Email credentials not configured. Set EMAIL_USER and EMAIL_PASS in environment variables.'
    );
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  return transporter;
};

export const sendMail = async ({ to, subject, html }) => {
  try {
    if (!to) {
      throw new Error('Recipient email missing');
    }

    if (!subject) {
      throw new Error('Email subject is required');
    }

    if (!html) {
      throw new Error('Email HTML content is required');
    }

    const transport = initializeTransporter();

    await transport.sendMail({
      from: `"SECE Admission Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
  } catch (error) {
    console.error('Email sending failed:', error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};
