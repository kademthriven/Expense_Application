require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');

const sequelize = require('./config/database');

// Models
const User = require('./models/user');
const Transaction = require('./models/transaction');
const Category = require('./models/category');
const Account = require('./models/account');
const Order = require('./models/order');

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

app.use(cors(
  process.env.NODE_ENV === 'production'
    ? { origin: process.env.FRONTEND_URL }
    : {}
));

app.use(express.json());
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

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

sequelize.sync({force: true})
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
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('DB Error:', err);
  });