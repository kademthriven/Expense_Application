const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Account = sequelize.define('account', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
});

module.exports = Account;