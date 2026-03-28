const Category = require('../models/category');
const Transaction = require('../models/transaction');
const { suggestCategoryWithGemini, generateInsights } = require('../services/geminiService');

function buildSummary(transactions) {
  let income = 0;
  let expense = 0;

  for (const item of transactions) {
    if (item.type === 'income') income += Number(item.amount);
    else expense += Number(item.amount);
  }

  return {
    income,
    expense,
    balance: income - expense
  };
}

exports.suggestCategory = async (req, res) => {
  try {
    const { description, type } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    const suggestion = await suggestCategoryWithGemini(
      description,
      categories,
      type || 'expense'
    );

    if (!suggestion) {
      return res.status(404).json({ error: 'No category available' });
    }

    return res.json({
      categoryId: suggestion.id,
      categoryName: suggestion.name
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getInsights = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { userId: req.userId },
      include: [{ model: Category, attributes: ['name'] }],
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      limit: 50
    });

    const summary = buildSummary(transactions);
    const insights = await generateInsights(transactions, summary);

    return res.json(insights);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};