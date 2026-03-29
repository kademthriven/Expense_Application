const { Op, fn, col } = require('sequelize');
const Transaction = require('../models/transaction');
const Category = require('../models/category');
const User = require('../models/user');
const ExcelJS = require('exceljs');

function getRange(view, selectedDate) {
  const base = selectedDate ? new Date(selectedDate) : new Date();

  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, '0');
  const day = String(base.getDate()).padStart(2, '0');

  if (view === 'daily') {
    const date = `${year}-${month}-${day}`;
    return {
      label: date,
      startDate: date,
      endDate: date
    };
  }

  if (view === 'weekly') {
    const current = new Date(base);
    const dayOfWeek = current.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(current);
    monday.setDate(current.getDate() + diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const startDate = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    const endDate = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;

    return {
      label: `${startDate} to ${endDate}`,
      startDate,
      endDate
    };
  }

  const startDate = `${year}-${month}-01`;
  const end = new Date(year, Number(month), 0);
  const endDate = `${year}-${month}-${String(end.getDate()).padStart(2, '0')}`;

  return {
    label: `${year}-${month}`,
    startDate,
    endDate
  };
}

exports.getPremiumReport = async (req, res) => {
  try {
    const { view = 'monthly', selectedDate } = req.query;

    const user = await User.findByPk(req.userId);

    if (!user || !user.isPremium) {
      return res.status(403).json({ error: 'Report is available only for premium users' });
    }

    const { label, startDate, endDate } = getRange(view, selectedDate);

    const transactions = await Transaction.findAll({
      where: {
        userId: req.userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [{ model: Category, attributes: ['name'] }],
      order: [['date', 'ASC'], ['createdAt', 'ASC']]
    });

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((item) => {
      if (item.type === 'income') totalIncome += Number(item.amount);
      else totalExpense += Number(item.amount);
    });

    const categorySummary = await Transaction.findAll({
      attributes: [
        'categoryId',
        [fn('SUM', col('amount')), 'totalAmount']
      ],
      where: {
        userId: req.userId,
        type: 'expense',
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [{ model: Category, attributes: ['name'] }],
      group: ['categoryId', 'category.id'],
      order: [[fn('SUM', col('amount')), 'DESC']]
    });

    return res.json({
      label,
      view,
      startDate,
      endDate,
      summary: {
        income: totalIncome,
        expense: totalExpense,
        savings: totalIncome - totalExpense
      },
      transactions: transactions.map((item) => ({
        id: item.id,
        date: item.date,
        description: item.description,
        category: item.category ? item.category.name : 'Other',
        income: item.type === 'income' ? Number(item.amount) : 0,
        expense: item.type === 'expense' ? Number(item.amount) : 0
      })),
      categorySummary: categorySummary.map((item) => ({
        category: item.category ? item.category.name : 'Other',
        totalAmount: Number(item.get('totalAmount') || 0)
      }))
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.downloadPremiumReport = async (req, res) => {
  try {
    const { view = 'monthly', selectedDate } = req.query;

    const user = await User.findByPk(req.userId);

    if (!user || !user.isPremium) {
      return res.status(403).json({ error: 'Download is available only for premium users' });
    }

    const { label, startDate, endDate } = getRange(view, selectedDate);

    const transactions = await Transaction.findAll({
      where: {
        userId: req.userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [{ model: Category, attributes: ['name'] }],
      order: [['date', 'ASC'], ['createdAt', 'ASC']]
    });

    let totalIncome = 0;
    let totalExpense = 0;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Report');

    sheet.addRow(['Expense Tracker Report']);
    sheet.addRow([`View: ${view}`]);
    sheet.addRow([`Period: ${label}`]);
    sheet.addRow([]);

    sheet.addRow(['Date', 'Description', 'Category', 'Income', 'Expense']);

    transactions.forEach((item) => {
      const income = item.type === 'income' ? Number(item.amount) : 0;
      const expense = item.type === 'expense' ? Number(item.amount) : 0;

      totalIncome += income;
      totalExpense += expense;

      sheet.addRow([
        item.date,
        item.description || '',
        item.category ? item.category.name : 'Other',
        income,
        expense
      ]);
    });

    sheet.addRow([]);
    sheet.addRow(['Total', '', '', totalIncome, totalExpense]);
    sheet.addRow(['Savings', '', '', '', totalIncome - totalExpense]);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=report-${view}-${label}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};