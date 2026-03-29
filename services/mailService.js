const nodemailer = require('nodemailer');

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT || 587),
    secure: String(process.env.MAIL_SECURE) === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });
}

async function sendResetPasswordEmail(toEmail, resetLink) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS || !process.env.MAIL_FROM) {
    throw new Error('Mail configuration is missing in .env');
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: toEmail,
    subject: 'Reset your Expense Tracker password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Password</h2>
        <p>You requested to reset your password.</p>
        <p>Click the button below to set a new password:</p>
        <p>
          <a href="${resetLink}" style="display:inline-block;padding:12px 20px;background:#0d6efd;color:#fff;text-decoration:none;border-radius:6px;">
            Reset Password
          </a>
        </p>
        <p>This link will expire in 1 hour.</p>
        <p>If the button does not work, use this link:</p>
        <p>${resetLink}</p>
      </div>
    `
  });
}

module.exports = {
  sendResetPasswordEmail
};