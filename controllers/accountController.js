const sequelize = require('../config/database');
const Account = require('../models/account');

exports.getAll = async (req, res) => {
  try {
    const accounts = await Account.findAll({ order: [['name', 'ASC']] });
    return res.json(accounts);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.add = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      await t.rollback();
      return res.status(400).json({ error: 'Account name is required' });
    }

    const trimmedName = name.trim();

    const existing = await Account.findOne({
      where: { name: trimmedName },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (existing) {
      await t.rollback();
      return res.status(400).json({ error: 'Account already exists' });
    }

    const account = await Account.create(
      { name: trimmedName },
      { transaction: t }
    );

    await t.commit();
    return res.status(201).json(account);
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ error: err.message });
  }
};