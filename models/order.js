const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('order', {
  orderId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  cfOrderId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paymentSessionId: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'SUCCESSFUL', 'FAILED', 'CANCELLED'),
    defaultValue: 'PENDING'
  }
});

module.exports = Order;