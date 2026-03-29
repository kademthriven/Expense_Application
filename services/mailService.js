const Sib = require('sib-api-v3-sdk');

exports.sendResetPasswordEmail = async (toEmail, resetLink) => {
  try {
    const client = Sib.ApiClient.instance;
    const apiKey = client.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    const tranEmailApi = new Sib.TransactionalEmailsApi();

    const sender = {
      email: process.env.MAIL_FROM,
      name: 'Expense Tracker'
    };

    const receivers = [{ email: toEmail }];

    const response = await tranEmailApi.sendTransacEmail({
      sender,
      to: receivers,
      subject: 'Reset Your Password',
      htmlContent: `
        <h2>Password Reset</h2>
        <p>Click below to reset your password:</p>
        <a href="${resetLink}" style="padding:10px 15px;background:#007bff;color:white;text-decoration:none;">
          Reset Password
        </a>
        <p>If button does not work, open this URL:</p>
        <p>${resetLink}</p>
      `
    });

    console.log('Brevo success response:', response);
    return response;
  } catch (err) {
    console.error('Brevo full error:', err);
    console.error('Brevo response body:', err.response?.body);
    throw err;
  }
};