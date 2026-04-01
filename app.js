require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const morgan = require('morgan');

const sequelize = require('./config/database');

// Models
const User = require('./models/user');
const Transaction = require('./models/transaction');
const Category = require('./models/category');
const Account = require('./models/account');
const Order = require('./models/order');
const ForgotPasswordRequest = require('./models/forgotPasswordRequest');

// Routes
const userRoutes = require('./routes/userRoutes');
const passwordRoutes = require('./routes/passwordRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const accountRoutes = require('./routes/accountRoutes');
const premiumRoutes = require('./routes/premiumRoutes');
const aiRoutes = require('./routes/aiRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// Create logs folder if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Morgan access log stream
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

// Middleware
app.use(morgan('combined', { stream: accessLogStream }));

app.use(cors(
  process.env.NODE_ENV === 'production'
    ? { origin: process.env.FRONTEND_URL, credentials: true }
    : { origin: true, credentials: true }
));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Relations
User.hasMany(Transaction);
Transaction.belongsTo(User);

Category.hasMany(Transaction);
Transaction.belongsTo(Category);

Account.hasMany(Transaction);
Transaction.belongsTo(Account);

User.hasMany(Order);
Order.belongsTo(User);

User.hasMany(ForgotPasswordRequest);
ForgotPasswordRequest.belongsTo(User);

// Routes
app.use('/users', userRoutes);
app.use('/password', passwordRoutes);
app.use('/transactions', transactionRoutes);
app.use('/categories', categoryRoutes);
app.use('/accounts', accountRoutes);
app.use('/premium', premiumRoutes);
app.use('/ai', aiRoutes);
app.use('/reports', reportRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  const errorMessage = `
[${new Date().toISOString()}]
${req.method} ${req.originalUrl}
${err.stack || err.message}
--------------------------------------------------
`;

  fs.appendFile(
    path.join(logsDir, 'error.log'),
    errorMessage,
    (fileErr) => {
      if (fileErr) {
        console.error('Failed to write error log:', fileErr);
      }
    }
  );

  console.error(err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server error'
  });
});

sequelize.sync({ force: false })
  .then(async () => {
    const catCount = await Category.count();
    if (catCount === 0) {
      await Category.bulkCreate([
        { name: 'Food' },
        { name: 'Travel' },
        { name: 'Shopping' },
        { name: 'Bills' },
        { name: 'Salary' },
        { name: 'Other' }
      ]);
    }

    const accCount = await Account.count();
    if (accCount === 0) {
      await Account.bulkCreate([
        { name: 'Cash' },
        { name: 'Bank' },
        { name: 'UPI' },
        { name: 'Credit Card' }
      ]);
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    const dbErrorMessage = `
[${new Date().toISOString()}]
DATABASE ERROR
${err.stack || err.message}
--------------------------------------------------
`;

    fs.appendFile(
      path.join(logsDir, 'error.log'),
      dbErrorMessage,
      (fileErr) => {
        if (fileErr) {
          console.error('Failed to write DB error log:', fileErr);
        }
      }
    );

    console.error('DB Error:', err);
  });