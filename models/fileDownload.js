const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FileDownload = sequelize.define('fileDownload', {
  fileName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  s3Key: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'S3 file key for accessing the file'
  },
  downloadUrl: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Presigned URL for downloading the file'
  },
  reportType: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
    defaultValue: 'monthly'
  },
  reportLabel: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Label describing the report period'
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  downloadedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = FileDownload;
