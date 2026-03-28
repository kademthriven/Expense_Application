const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const Transaction = require('../models/transaction');
const Category = require('../models/category');
const Account = require('../models/account');
const User = require('../models/user');
const { suggestCategoryWithGemini } = require('../services/geminiService');

function buildDateFilter(view, selectedDate, selectedMonth, selectedYear) {
  const where = {};

  if (view === 'daily' && selectedDate) {
    where.date = selectedDate;
  }

  if (view === 'monthly' && selectedMonth) {
    const [year, month] = selectedMonth.split('-');
    const startDate = `${year}-${month}-01`;
    const end = new Date(Number(year), Number(month), 0);
    const endDate = `${year}-${month}-${String(end.getDate()).padStart(2, '0')}`;

    where.date = {
      [Op.between]: [startDate, endDate]
    };
  }

  if (view === 'yearly' && selectedYear) {
    where.date = {
      [Op.between]: [`${selectedYear}-01-01`, `${selectedYear}-12-31`]
    };
  }

  return where;
}

async function resolveCategoryId({ categoryId, description, type }) {
  if (categoryId) return categoryId;

  const categories = await Category.findAll({ order: [['name', 'ASC']] });

  if (!categories.length) {
    throw new Error('No categories found');
  }

  if (description && description.trim()) {
    const suggested = await suggestCategoryWithGemini(description, categories, type);
    if (suggested) return suggested.id;
  }

  const fallbackName = type === 'income' ? 'Salary' : 'Other';
  const fallback =
    categories.find((c) => c.name.toLowerCase() === fallbackName.toLowerCase()) ||
    categories[0];

  return fallback.id;
}

exports.add = async (req, res) => {
  try {
    const { amount, description, type, date, categoryId, accountId } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!type || !accountId) {
      return res.status(400).json({ error: 'Amount, type and account are required' });
    }

    const safeDate = date || new Date().toLocaleDateString('en-CA');
    const numericAmount = Number(amount);
    const finalCategoryId = await resolveCategoryId({
      categoryId,
      description,
      type
    });

    const transaction = await Transaction.create({
      amount: numericAmount,
      description: description || '',
      type,
      date: safeDate,
      categoryId: finalCategoryId,
      accountId,
      userId: req.userId
    });

    if (type === 'expense') {
      const user = await User.findByPk(req.userId);
      if (user) {
        await user.increment('totalExpense', { by: numericAmount });
      }
    }

    return res.status(201).json(transaction);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    const { search, view, selectedDate, selectedMonth, selectedYear } = req.query;

    const where = {
      userId: req.userId,
      ...buildDateFilter(view, selectedDate, selectedMonth, selectedYear)
    };

    if (search) {
      where.description = {
        [Op.like]: `%${search}%`
      };
    }

    const { count, rows } = await Transaction.findAndCountAll({
      where,
      include: [
        { model: Category, attributes: ['id', 'name'] },
        { model: Account, attributes: ['id', 'name'] }
      ],
      limit,
      offset,
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });

    return res.json({
      transactions: rows,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalItems: count
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.summary = async (req, res) => {
  try {
    const { view, selectedDate, selectedMonth, selectedYear } = req.query;

    const where = {
      userId: req.userId,
      ...buildDateFilter(view, selectedDate, selectedMonth, selectedYear)
    };

    const transactions = await Transaction.findAll({ where });

    let income = 0;
    let expense = 0;

    transactions.forEach((item) => {
      if (item.type === 'income') income += Number(item.amount);
      else expense += Number(item.amount);
    });

    return res.json({
      income,
      expense,
      balance: income - expense
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { amount, description, type, date, categoryId, accountId } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const transaction = await Transaction.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const user = await User.findByPk(req.userId);
    const oldAmount = Number(transaction.amount);
    const newAmount = Number(amount);
    const oldType = transaction.type;
    const newType = type;
    const finalCategoryId = await resolveCategoryId({
      categoryId,
      description,
      type
    });

    if (user) {
      if (oldType === 'expense') {
        await user.decrement('totalExpense', { by: oldAmount });
      }

      if (newType === 'expense') {
        await user.increment('totalExpense', { by: newAmount });
      }
    }

    await transaction.update({
      amount: newAmount,
      description: description || '',
      type,
      date,
      categoryId: finalCategoryId,
      accountId
    });

    return res.json({ message: 'Updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.type === 'expense') {
      const user = await User.findByPk(req.userId);
      if (user) {
        await user.decrement('totalExpense', { by: Number(transaction.amount) });
      }
    }

    await transaction.destroy();

    return res.json({ message: 'Deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.exportExcel = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { userId: req.userId },
      include: [
        { model: Category, attributes: ['name'] },
        { model: Account, attributes: ['name'] }
      ],
      order: [['date', 'DESC']]
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transactions');

    worksheet.columns = [
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Account', key: 'account', width: 20 }
    ];

    transactions.forEach((item) => {
      worksheet.addRow({
        amount: item.amount,
        type: item.type,
        description: item.description || '',
        date: item.date,
        category: item.category ? item.category.name : '',
        account: item.account ? item.account.name : ''
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=transactions.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};