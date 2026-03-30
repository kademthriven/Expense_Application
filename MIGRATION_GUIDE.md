# Database Migration Implementation Guide

## Overview
This document explains the database migration system implemented for the Expense Tracker app using Sequelize CLI.

## What is a Migration?
A migration is a set of database schema changes that are version-controlled and can be applied or rolled back. They help manage database evolution without manually altering the database.

## Project Setup

### Installation
```bash
npm install --save-dev sequelize-cli
```

### Configuration Files Created
1. `.sequelizerc` - Sequelize CLI configuration file that specifies paths for:
   - Models: `models/`
   - Migrations: `migrations/`
   - Seeders: `seeders/`
   - Database config: `config/database.js`

2. `config/database.js` - Updated with Sequelize CLI configuration for development, test, and production environments

## Migration for Note Column

### Migration File
- **Location**: `migrations/20260330000001-add-note-to-transaction.js`
- **Purpose**: Adds a `note` column to the `transactions` table

### Migration Details

#### Up Function (Apply Migration)
```javascript
await queryInterface.addColumn('transactions', 'note', {
  type: Sequelize.STRING,
  allowNull: true,
  comment: 'Short description or comment for the expense'
});
```
- Adds a STRING column named `note` to the transactions table
- Allows NULL values
- Provides a descriptive comment

#### Down Function (Revert Migration)
```javascript
await queryInterface.removeColumn('transactions', 'note');
```
- Removes the `note` column if the migration is rolled back

### Running Migrations

#### Apply All Pending Migrations
```bash
npx sequelize db:migrate --env development
```

#### Rollback Last Migration
```bash
npx sequelize db:rollback --env development
```

#### Check Migration Status
```bash
npx sequelize db:migrate:status --env development
```

## Model Changes

### Transaction Model Update
The `Transaction` model in `models/transaction.js` was updated to include:

```javascript
note: {
  type: DataTypes.STRING,
  allowNull: true,
  comment: 'Short description or comment for the expense'
}
```

## Frontend Changes

### Form Updates
1. **Add Transaction Form** - Added note input field
2. **Edit Transaction Form** - Added note input field  
3. **Transaction Table** - Added note column to display notes

### JavaScript Updates
1. Updated `transactionForm` submission to include `note` field
2. Updated `editTransactionForm` submission to include `note` field
3. Updated `renderTransactions()` to display the note column
4. Updated `openEditModal()` to handle note field

## Backend Changes

### Transaction Controller Updates
1. **add()** function - Accepts and stores `note` field
2. **update()** function - Accepts and updates `note` field
3. Both functions pass the note value (or empty string) to the database

## Testing the Migration

### Step 1: Verify Migration Applied
✅ Run `npx sequelize db:migrate:status --env development` to confirm migration is "up"

### Step 2: Test Adding a Transaction with Note
1. Start the application: `node app.js`
2. Open browser and navigate to `http://localhost:4000`
3. Login to your account
4. Add a new transaction:
   - Amount: 500
   - Type: Expense
   - Description: Groceries
   - **Note**: Weekly shopping (new field)
   - Date: Today
   - Category: Food
   - Account: Cash

### Step 3: Verify Note is Saved
1. Check the Transactions table - note should appear in the row
2. Click Edit on the transaction - note should be populated in the form
3. Modify the note and click Update
4. Verify the note change is reflected in the table

### Step 4: Check Database (Optional)
Using MySQL client or database tool:
```sql
SELECT id, amount, description, note, date FROM transactions LIMIT 5;
```

You should see the `note` column with your data.

## Migration Workflow

### Creating a New Migration
```bash
npx sequelize migration:create --name add-column-name
```
This creates a new migration file in the `migrations/` folder.

### Structure of Migration Files
```javascript
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Apply schema changes
  },
  down: async (queryInterface, Sequelize) => {
    // Revert schema changes
  }
};
```

## Best Practices
1. ✅ Always define both `up` and `down` functions for reversibility
2. ✅ Use descriptive migration names (e.g., `20260330000001-add-note-to-transaction.js`)
3. ✅ Keep migrations small and focused on specific changes
4. ✅ Update the model file when creating a migration
5. ✅ Test migrations in development before production
6. ✅ Never edit or delete applied migrations - create new ones instead
7. ✅ Use `db:migrate:status` to track which migrations are applied

## Common Commands
```bash
# Create migration
npx sequelize migration:create --name migration-name

# Apply migrations
npx sequelize db:migrate

# Rollback one migration
npx sequelize db:rollback

# Rollback all migrations
npx sequelize db:migrate:undo:all

# Check status
npx sequelize db:migrate:status
```

## Files Modified/Created
- ✅ `.sequelizerc` - Created
- ✅ `migrations/` - Directory created
- ✅ `migrations/20260330000001-add-note-to-transaction.js` - Created
- ✅ `config/database.js` - Updated
- ✅ `models/transaction.js` - Updated
- ✅ `public/index.html` - Updated (UI)
- ✅ `public/app.js` - Updated (JavaScript)
- ✅ `controllers/transactionController.js` - Updated (Backend)

## Next Steps
- Create additional migrations as database schema evolves
- Consider adding validators for the note field (max length, etc.)
- Document any additional database changes for team members
