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

// Routes
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const accountRoutes = require('./routes/accountRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Relations
User.hasMany(Transaction);
Transaction.belongsTo(User);

Category.hasMany(Transaction);
Transaction.belongsTo(Category);

Account.hasMany(Transaction);
Transaction.belongsTo(Account);

// Routes
app.use('/users', userRoutes);
app.use('/transactions', transactionRoutes);
app.use('/categories', categoryRoutes);
app.use('/accounts', accountRoutes);

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Error middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

sequelize.sync({ force: true })
  .then(async () => {
    console.log('Database recreated');

    await Category.bulkCreate([
      { name: 'Food' },
      { name: 'Travel' },
      { name: 'Shopping' },
      { name: 'Bills' },
      { name: 'Salary' },
      { name: 'Other' }
    ]);

    await Account.bulkCreate([
      { name: 'Cash' },
      { name: 'Bank' },
      { name: 'UPI' },
      { name: 'Credit Card' }
    ]);

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('DB Error:', err);
  });