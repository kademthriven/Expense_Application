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
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Account name is required' });
    }

    const account = await Account.create({ name });
    return res.status(201).json(account);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};