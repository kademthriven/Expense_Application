const sequelize = require('../config/database');
const Category = require('../models/category');

exports.getAll = async (req, res) => {
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    return res.json(categories);
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
      return res.status(400).json({ error: 'Category name is required' });
    }

    const trimmedName = name.trim();

    const existing = await Category.findOne({
      where: { name: trimmedName },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (existing) {
      await t.rollback();
      return res.status(400).json({ error: 'Category already exists' });
    }

    const category = await Category.create(
      { name: trimmedName },
      { transaction: t }
    );

    await t.commit();
    return res.status(201).json(category);
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ error: err.message });
  }
};