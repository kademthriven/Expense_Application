const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const Transaction = require('../models/transaction');
const Category = require('../models/category');
const Account = require('../models/account');

exports.add = async (req, res) => {
  try {
    const { amount, description, type, date, categoryId, accountId } = req.body;

    if (!amount || !type || !categoryId || !accountId) {
      return res.status(400).json({ error: 'Amount, type, category and account are required' });
    }

    const safeDate = date || new Date().toLocaleDateString('en-CA');

    const transaction = await Transaction.create({
      amount,
      description,
      type,
      date: safeDate,
      categoryId,
      accountId,
      userId: req.userId
    });

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

    const where = { userId: req.userId };

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
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;

      where.date = {
        [Op.between]: [startDate, endDate]
      };
    }

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
    const where = { userId: req.userId };

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

    const transaction = await Transaction.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await transaction.update({
      amount,
      description,
      type,
      date,
      categoryId,
      accountId
    });

    return res.json({ message: 'Updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await Transaction.destroy({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

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