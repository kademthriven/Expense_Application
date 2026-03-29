const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ForgotPasswordRequest = sequelize.define('forgotPasswordRequest', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
});

module.exports = ForgotPasswordRequest;