const { Op, fn, col } = require('sequelize');
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable').default;
const ExcelJS = require('exceljs');
const Transaction = require('../models/transaction');
const Category = require('../models/category');
const User = require('../models/user');
const FileDownload = require('../models/fileDownload');
const s3Service = require('../services/s3Service');

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

function formatCurrency(value) {
  return `₹${Number(value || 0).toFixed(2)}`;
}

function buildPdfBuffer({ user, view, label, startDate, endDate, transactions, totalIncome, totalExpense, categorySummary }) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Expense Tracker Premium Report', 14, 18);

  doc.setFontSize(11);
  doc.text(`User: ${user.name || user.email || `User ${user.id}`}`, 14, 28);
  doc.text(`Report Type: ${view.toUpperCase()}`, 14, 35);
  doc.text(`Period: ${label}`, 14, 42);
  doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 49);
  doc.text(`Generated On: ${new Date().toLocaleString('en-IN')}`, 14, 56);

  doc.setFontSize(12);
  doc.text(`Total Income: ${formatCurrency(totalIncome)}`, 14, 68);
  doc.text(`Total Expense: ${formatCurrency(totalExpense)}`, 14, 76);
  doc.text(`Savings: ${formatCurrency(totalIncome - totalExpense)}`, 14, 84);

  autoTable(doc, {
    startY: 92,
    head: [['Date', 'Description', 'Category', 'Income', 'Expense', 'Note']],
    body: transactions.length
      ? transactions.map((item) => [
          item.date,
          item.description || '-',
          item.category ? item.category.name : 'Other',
          item.type === 'income' ? formatCurrency(item.amount) : '-',
          item.type === 'expense' ? formatCurrency(item.amount) : '-',
          item.note || '-'
        ])
      : [['-', 'No transactions found for this report', '-', '-', '-', '-']],
    styles: {
      fontSize: 9,
      cellPadding: 2
    },
    headStyles: {
      fillColor: [52, 73, 94]
    }
  });

  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 110;

  autoTable(doc, {
    startY: finalY,
    head: [['Category', 'Total Expense']],
    body: categorySummary.length
      ? categorySummary.map((item) => [
          item.category ? item.category.name : 'Other',
          formatCurrency(item.get('totalAmount') || 0)
        ])
      : [['No expense categories found', '-']],
    styles: {
      fontSize: 9,
      cellPadding: 2
    },
    headStyles: {
      fillColor: [22, 160, 133]
    }
  });

  return Buffer.from(doc.output('arraybuffer'));
}

exports.getPremiumReport = async (req, res) => {
  try {
    const { view = 'monthly', selectedDate } = req.query;

    const user = await User.findByPk(req.userId);

    if (!user || !user.isPremium) {
      return res.status(401).json({ error: 'Report is available only for premium users' });
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
        expense: item.type === 'expense' ? Number(item.amount) : 0,
        note: item.note || ''
      })),
      categorySummary: categorySummary.map((item) => ({
        category: item.category ? item.category.name : 'Other',
        totalAmount: Number(item.get('totalAmount') || 0)
      }))
    });
  } catch (err) {
    console.error('getPremiumReport error:', err);
    return res.status(500).json({ error: err.message });
  }
};

exports.downloadPremiumReport = async (req, res) => {
  try {
    const { view = 'monthly', selectedDate } = req.query;

    const user = await User.findByPk(req.userId);

    if (!user || !user.isPremium) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Download is available only for premium users'
      });
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

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Expense Tracker App';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Expenses');

    sheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Note', key: 'note', width: 30 }
    ];

    sheet.addRow({
      date: '',
      description: 'Expense Tracker Premium Report',
      category: '',
      type: '',
      amount: '',
      note: ''
    });

    sheet.addRow({
      date: '',
      description: `Report Type: ${view.toUpperCase()}`,
      category: '',
      type: '',
      amount: '',
      note: ''
    });

    sheet.addRow({
      date: '',
      description: `Period: ${label}`,
      category: '',
      type: '',
      amount: '',
      note: ''
    });

    sheet.addRow({
      date: '',
      description: `Total Income: ₹${totalIncome}`,
      category: '',
      type: '',
      amount: '',
      note: ''
    });

    sheet.addRow({
      date: '',
      description: `Total Expense: ₹${totalExpense}`,
      category: '',
      type: '',
      amount: '',
      note: ''
    });

    sheet.addRow({
      date: '',
      description: `Savings: ₹${totalIncome - totalExpense}`,
      category: '',
      type: '',
      amount: '',
      note: ''
    });

    sheet.addRow({});

    transactions.forEach((item) => {
      sheet.addRow({
        date: item.date,
        description: item.description || '',
        category: item.category ? item.category.name : 'Other',
        type: item.type,
        amount: Number(item.amount),
        note: item.note || ''
      });
    });

    const fileBuffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const fileName = s3Service.generateFileName(req.userId, view, label, 'xlsx');
    const s3Key = await s3Service.uploadToS3(fileBuffer, fileName);
    const downloadUrl = await s3Service.getDownloadUrl(s3Key, fileName);

    const fileDownload = await FileDownload.create({
      userId: req.userId,
      fileName,
      s3Key,
      downloadUrl,
      reportType: view,
      reportLabel: label,
      startDate,
      endDate,
      downloadedAt: new Date()
    });

    return res.status(200).json({
      success: true,
      message: 'Excel report generated successfully',
      downloadUrl,
      fileName,
      reportType: view,
      reportLabel: label,
      fileId: fileDownload.id,
      expiresIn: '7 days',
      fileFormat: 'xlsx'
    });
  } catch (err) {
    console.error('downloadPremiumReport error:', err);
    return res.status(500).json({ error: err.message });
  }
};

exports.getDownloadHistory = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);

    if (!user || !user.isPremium) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Download history is available only for premium users'
      });
    }

    const downloads = await FileDownload.findAll({
      where: { userId: req.userId },
      order: [['downloadedAt', 'DESC']],
      attributes: [
        'id',
        'fileName',
        's3Key',
        'reportType',
        'reportLabel',
        'startDate',
        'endDate',
        'downloadedAt'
      ]
    });

    const downloadsWithFreshUrls = await Promise.all(
      downloads.map(async (file) => ({
        id: file.id,
        fileName: file.fileName,
        downloadUrl: await s3Service.getFileAccessUrl(file.s3Key, file.fileName),
        reportType: file.reportType,
        reportLabel: file.reportLabel,
        startDate: file.startDate,
        endDate: file.endDate,
        downloadDate: file.downloadedAt,
        fileFormat: file.fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'xlsx'
      }))
    );

    return res.status(200).json({
      success: true,
      totalDownloads: downloadsWithFreshUrls.length,
      downloads: downloadsWithFreshUrls
    });
  } catch (err) {
    console.error('getDownloadHistory error:', err);
    return res.status(500).json({ error: err.message });
  }
};

exports.deleteDownloadRecord = async (req, res) => {
  try {
    const { fileId } = req.params;

    const user = await User.findByPk(req.userId);

    if (!user || !user.isPremium) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'This action is available only for premium users'
      });
    }

    const fileDownload = await FileDownload.findByPk(fileId);

    if (!fileDownload) {
      return res.status(404).json({ error: 'File record not found' });
    }

    if (fileDownload.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own records' });
    }

    await fileDownload.destroy();

    return res.status(200).json({
      success: true,
      message: 'Download record deleted successfully'
    });
  } catch (err) {
    console.error('deleteDownloadRecord error:', err);
    return res.status(500).json({ error: err.message });
  }
};
exports.uploadRenderedPdf = async (req, res) => {
  try {
    const { view = 'monthly', selectedDate } = req.query;

    const user = await User.findByPk(req.userId);

    if (!user || !user.isPremium) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Download is available only for premium users'
      });
    }

    if (!req.body || !req.body.length) {
      return res.status(400).json({
        error: 'PDF buffer is missing'
      });
    }

    const { label, startDate, endDate } = getRange(view, selectedDate);

    const fileName = s3Service.generateFileName(req.userId, view, label, 'pdf');
    const s3Key = await s3Service.uploadToS3(req.body, fileName);
    const fileUrl = await s3Service.getViewUrl(s3Key, fileName);

    const fileDownload = await FileDownload.create({
      userId: req.userId,
      fileName,
      s3Key,
      downloadUrl: fileUrl,
      reportType: view,
      reportLabel: label,
      startDate,
      endDate,
      downloadedAt: new Date()
    });

    return res.status(200).json({
      success: true,
      message: 'PDF uploaded successfully',
      downloadUrl: fileUrl,
      fileName,
      reportType: view,
      reportLabel: label,
      fileId: fileDownload.id,
      expiresIn: '7 days',
      fileFormat: 'pdf'
    });
  } catch (err) {
    console.error('uploadRenderedPdf error:', err);
    return res.status(500).json({ error: err.message });
  }
};