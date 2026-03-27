const { Cashfree, CFEnvironment } = require('cashfree-pg');
const crypto = require('crypto');
const { fn, col, literal } = require('sequelize');

const Order = require('../models/order');
const User = require('../models/user');
const Transaction = require('../models/transaction');

function getCashfreeClient() {
  const env =
    process.env.CASHFREE_ENV === 'production'
      ? CFEnvironment.PRODUCTION
      : CFEnvironment.SANDBOX;

  return new Cashfree(
    env,
    process.env.CASHFREE_APP_ID,
    process.env.CASHFREE_SECRET_KEY
  );
}

exports.createPremiumOrder = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isPremium) {
      return res.status(400).json({ error: 'You are already a premium user' });
    }

    const orderId = `premium_${req.userId}_${crypto.randomUUID().slice(0, 8)}`;
    const amount = Number(process.env.PREMIUM_AMOUNT || 499);

    const cashfree = getCashfreeClient();

    const request = {
      order_amount: amount,
      order_currency: 'INR',
      order_id: orderId,
      customer_details: {
        customer_id: String(user.id),
        customer_name: user.name,
        customer_email: user.email,
        customer_phone: user.phone
      },
      order_meta: {
        return_url: `${process.env.APP_BASE_URL}/premium/verify?order_id={order_id}`,
        notify_url: `${process.env.APP_BASE_URL}/premium/webhook`,
        payment_methods: 'cc,dc,upi'
      },
      order_note: 'Premium membership purchase'
    };

    const response = await cashfree.PGCreateOrder(request);
    const data = response.data;

    await Order.create({
      orderId,
      cfOrderId: data.cf_order_id || null,
      paymentSessionId: data.payment_session_id,
      amount,
      status: 'PENDING',
      userId: req.userId
    });

    return res.json({
      orderId,
      paymentSessionId: data.payment_session_id,
      environment: process.env.CASHFREE_ENV
    });
  } catch (err) {
    return res.status(500).json({
      error:
        err.response?.data?.message ||
        err.response?.data ||
        err.message ||
        'Failed to create premium order'
    });
  }
};

exports.checkPremiumOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      where: { orderId, userId: req.userId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'SUCCESSFUL') {
      return res.json({ status: 'SUCCESSFUL', isPremium: true });
    }

    if (order.status === 'FAILED') {
      return res.json({ status: 'FAILED', isPremium: false });
    }

    if (order.status === 'CANCELLED') {
      return res.json({ status: 'CANCELLED', isPremium: false });
    }

    const cashfree = getCashfreeClient();
    const response = await cashfree.PGOrderFetchPayments(orderId);
    const payments = response.data || [];

    const successPayment = payments.find((p) => p.payment_status === 'SUCCESS');
    const failedPayment = payments.find((p) =>
      ['FAILED', 'USER_DROPPED', 'CANCELLED'].includes(p.payment_status)
    );

    if (successPayment) {
      await order.update({ status: 'SUCCESSFUL' });

      const user = await User.findByPk(order.userId);
      if (user) {
        await user.update({ isPremium: true });
      }

      return res.json({ status: 'SUCCESSFUL', isPremium: true });
    }

    if (failedPayment) {
      await order.update({ status: 'FAILED' });
      return res.json({ status: 'FAILED', isPremium: false });
    }

    return res.json({ status: 'PENDING', isPremium: false });
  } catch (err) {
    return res.status(500).json({ error: 'Unable to verify payment status' });
  }
};

exports.cancelPremiumOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      where: { orderId, userId: req.userId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'PENDING') {
      await order.update({ status: 'CANCELLED' });
    }

    return res.json({ message: 'Order cancelled', status: order.status });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.verifyPremiumOrder = async (req, res) => {
  try {
    const { order_id } = req.query;

    if (!order_id) {
      return res.redirect('/index.html?payment=failed');
    }

    const order = await Order.findOne({ where: { orderId: order_id } });

    if (!order) {
      return res.redirect('/index.html?payment=failed');
    }

    const cashfree = getCashfreeClient();
    const response = await cashfree.PGOrderFetchPayments(order_id);
    const payments = response.data || [];

    const successPayment = payments.find((p) => p.payment_status === 'SUCCESS');
    const failedPayment = payments.find((p) =>
      ['FAILED', 'USER_DROPPED', 'CANCELLED'].includes(p.payment_status)
    );

    if (successPayment) {
      await order.update({ status: 'SUCCESSFUL' });

      const user = await User.findByPk(order.userId);
      if (user) {
        await user.update({ isPremium: true });
      }

      return res.redirect('/index.html?payment=success');
    }

    if (failedPayment) {
      await order.update({ status: 'FAILED' });
      return res.redirect('/index.html?payment=failed');
    }

    return res.redirect('/index.html?payment=pending');
  } catch (err) {
    return res.redirect('/index.html?payment=failed');
  }
};

exports.cashfreeWebhook = async (req, res) => {
  try {
    const eventType = req.body?.type;
    const orderId = req.body?.data?.order?.order_id;

    if (!orderId) {
      return res.status(200).json({ ok: true });
    }

    const order = await Order.findOne({ where: { orderId } });
    if (!order) {
      return res.status(200).json({ ok: true });
    }

    if (eventType === 'PAYMENT_SUCCESS_WEBHOOK') {
      await order.update({ status: 'SUCCESSFUL' });

      const user = await User.findByPk(order.userId);
      if (user) {
        await user.update({ isPremium: true });
      }
    }

    if (eventType === 'PAYMENT_FAILED_WEBHOOK') {
      await order.update({ status: 'FAILED' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(200).json({ ok: true });
  }
};

exports.getPremiumStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: ['id', 'name', 'email', 'isPremium']
    });

    return res.json({
      isPremium: !!user?.isPremium,
      message: user?.isPremium ? 'You are a premium user now' : ''
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const currentUser = await User.findByPk(req.userId);

    if (!currentUser || !currentUser.isPremium) {
      return res.status(403).json({ error: 'Leaderboard is available only for premium users' });
    }

    const leaderboard = await Transaction.findAll({
      attributes: [
        'userId',
        [fn('SUM', col('amount')), 'totalExpense']
      ],
      where: {
        type: 'expense'
      },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ],
      group: ['userId', 'user.id'],
      order: [[literal('totalExpense'), 'DESC']],
      limit: 10
    });

    const formatted = leaderboard.map((item, index) => ({
      rank: index + 1,
      userId: item.userId,
      name: item.user?.name || 'Unknown',
      email: item.user?.email || '',
      totalExpense: Number(item.get('totalExpense') || 0)
    }));

    return res.json(formatted);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};