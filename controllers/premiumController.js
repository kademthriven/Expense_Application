const { Cashfree, CFEnvironment } = require('cashfree-pg');
const crypto = require('crypto');
const Order = require('../models/order');
const User = require('../models/user');

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

    // Latest SDK note: only orderId param
    const response = await cashfree.PGOrderFetchPayments(order_id);
    const payments = response.data || [];

    const successfulPayment = payments.find((p) => p.payment_status === 'SUCCESS');
    const failedPayment = payments.find((p) =>
      ['FAILED', 'USER_DROPPED', 'CANCELLED'].includes(p.payment_status)
    );

    if (successfulPayment) {
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

    return res.json({ isPremium: !!user?.isPremium });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};