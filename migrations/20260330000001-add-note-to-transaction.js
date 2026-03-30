'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.addColumn('people', 'alma', Sequelize.STRING);
     */
    
    return await queryInterface.addColumn('transactions', 'note', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Short description or comment for the expense'
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.removeColumn('people', 'alma');
     */
    
    return await queryInterface.removeColumn('transactions', 'note');
  }
};
