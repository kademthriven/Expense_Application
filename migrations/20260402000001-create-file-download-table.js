'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Create fileDownloads table for tracking downloaded expense reports
     */
    await queryInterface.createTable('fileDownloads', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      fileName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      s3Key: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'S3 file key for accessing the file'
      },
      downloadUrl: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Presigned URL for downloading the file'
      },
      reportType: {
        type: Sequelize.ENUM('daily', 'weekly', 'monthly'),
        defaultValue: 'monthly'
      },
      reportLabel: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Label describing the report period'
      },
      startDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      endDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      downloadedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add index on userId for faster queries
    await queryInterface.addIndex('fileDownloads', ['userId']);
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Drop fileDownloads table
     */
    await queryInterface.dropTable('fileDownloads');
  }
};
