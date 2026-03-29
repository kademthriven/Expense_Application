const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const sequelize = require('../config/database');
const User = require('../models/user');
const ForgotPasswordRequest = require('../models/forgotPasswordRequest');
const { sendResetPasswordEmail } = require('../services/mailService');

exports.signup = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      await t.rollback();
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({
      where: { email },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (existingUser) {
      await t.rollback();
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create(
      { name, email, phone, password: hashedPassword },
      { transaction: t }
    );

    await t.commit();
    return res.status(201).json({ message: 'Signup successful' });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({
      where: { email },
      attributes: ['id', 'name', 'email', 'password', 'isPremium']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ error: 'Wrong password' });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isPremium: user.isPremium
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { email } = req.body;

    if (!email) {
      await t.rollback();
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({
      where: { email },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!user) {
      await t.rollback();
      return res.status(404).json({ error: 'User not found' });
    }

    const requestId = uuidv4();

    await ForgotPasswordRequest.create(
      {
        id: requestId,
        userId: user.id,
        isActive: true
      },
      { transaction: t }
    );

    const resetLink = `${process.env.APP_BASE_URL}/password/resetpassword/${requestId}`;

    console.log('Reset link:', resetLink);

    try {
      await sendResetPasswordEmail(user.email, resetLink);
    } catch (mailErr) {
      console.error('Mail send failed, but request created:', mailErr.message);
    }

    await t.commit();

    return res.json({
      message: 'Reset password request created successfully',
      resetLink
    });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ error: err.message });
  }
};

exports.getResetPasswordPage = async (req, res) => {
  try {
    const { requestId } = req.params;

    const requestRow = await ForgotPasswordRequest.findOne({
      where: {
        id: requestId,
        isActive: true
      }
    });

    if (!requestRow) {
      return res.status(400).send('<h2>Invalid or expired reset password link</h2>');
    }

    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Reset Password</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"/>
      </head>
      <body style="background:#f5f7fb;">
        <div class="container">
          <div class="row justify-content-center align-items-center min-vh-100">
            <div class="col-md-5">
              <div class="card shadow border-0 rounded-4">
                <div class="card-body p-4">
                  <h3 class="text-center mb-4">Reset Password</h3>

                  <div class="mb-3">
                    <label class="form-label">New Password</label>
                    <input type="password" id="password" class="form-control" />
                  </div>

                  <button class="btn btn-primary w-100" onclick="updatePassword()">
                    Update Password
                  </button>

                  <p id="message" class="text-center mt-3 mb-0 small"></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
        <script>
          async function updatePassword() {
            const password = document.getElementById('password').value;
            const message = document.getElementById('message');

            try {
              const res = await axios.post('/password/updatepassword/${requestId}', { password });
              message.className = 'text-center mt-3 mb-0 small text-success';
              message.innerText = res.data.message;

              setTimeout(() => {
                window.location.href = '/login.html';
              }, 1500);
            } catch (err) {
              message.className = 'text-center mt-3 mb-0 small text-danger';
              message.innerText = err.response?.data?.error || 'Failed to update password';
            }
          }
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    return res.status(500).send('<h2>Something went wrong</h2>');
  }
};

exports.updatePassword = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { requestId } = req.params;
    const { password } = req.body;

    if (!password) {
      await t.rollback();
      return res.status(400).json({ error: 'Password is required' });
    }

    const requestRow = await ForgotPasswordRequest.findOne({
      where: {
        id: requestId,
        isActive: true
      },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!requestRow) {
      await t.rollback();
      return res.status(400).json({ error: 'Invalid or expired reset request' });
    }

    const user = await User.findByPk(requestRow.userId, {
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!user) {
      await t.rollback();
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await user.update(
      { password: hashedPassword },
      { transaction: t }
    );

    await requestRow.update(
      { isActive: false },
      { transaction: t }
    );

    await t.commit();
    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ error: err.message });
  }
};