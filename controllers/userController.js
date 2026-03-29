const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');

const sequelize = require('../config/database');
const User = require('../models/user');
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
      {
        name,
        email,
        phone,
        password: hashedPassword
      },
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

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await user.update(
      {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: expiresAt
      },
      { transaction: t }
    );

    const resetLink = `${process.env.APP_BASE_URL}/reset-password.html?token=${rawToken}`;

    await sendResetPasswordEmail(user.email, resetLink);

    await t.commit();
    return res.json({ message: 'Reset password link sent successfully' });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { token, password } = req.body;

    if (!token || !password) {
      await t.rollback();
      return res.status(400).json({ error: 'Token and password are required' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          [Op.gt]: new Date()
        }
      },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!user) {
      await t.rollback();
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await user.update(
      {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      },
      { transaction: t }
    );

    await t.commit();
    return res.json({ message: 'Password reset successful' });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ error: err.message });
  }
};