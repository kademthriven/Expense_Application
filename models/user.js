const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('user', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isPremium: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  totalExpense: {
  type: DataTypes.FLOAT,
  defaultValue: 0
 }
});

module.exports = User;