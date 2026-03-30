# Migration Quick Reference

## Current Migration Status

| Migration File | Status | Description |
|---|---|---|
| `20260330000001-add-note-to-transaction.js` | ✅ UP | Added `note` column to transactions table |

## Quick Commands

### Check Migration Status
```bash
npx sequelize db:migrate:status --env development
```

### Apply All Pending Migrations
```bash
npx sequelize db:migrate --env development
```

### Rollback Last Migration
```bash
npx sequelize db:rollback --env development
```
**Warning**: This will remove the `note` column from the database. Make sure you have a backup if needed.

### Rollback All Migrations
```bash
npx sequelize db:migrate:undo:all --env development
```
**Warning**: This will revert all migrations. Use with caution!

## Migration Naming Convention
Files use timestamp format: `YYYYMMDDhhmmss-description.js`
- Example: `20260330000001-add-note-to-transaction.js`
- This ensures migrations run in order

## Database Schema Change

### Before Migration
```
transactions table columns:
- id
- amount
- description
- type
- date
- userId
- categoryId
- accountId
- createdAt
- updatedAt
```

### After Migration
```
transactions table columns:
- id
- amount
- description
- type
- date
- note        <-- NEW COLUMN
- userId
- categoryId
- accountId
- createdAt
- updatedAt
```

## Rollback Procedure (If Needed)

If you need to remove the `note` column:

```bash
# 1. Stop the running application
Ctrl+C

# 2. Rollback the migration
npx sequelize db:rollback --env development

# 3. Verify it's rolled back
npx sequelize db:migrate:status --env development

# 4. Restart the application
node app.js
```

## Re-apply Migration (After Rollback)

```bash
# 1. Check status (should show as "down")
npx sequelize db:migrate:status --env development

# 2. Apply the migration again
npx sequelize db:migrate --env development

# 3. Verify it's applied
npx sequelize db:migrate:status --env development
```

## Important Notes

❗ **DO NOT**:
- Manually delete the migration file
- Manually alter the database without using migrations
- Edit an already-applied migration file

✅ **DO**:
- Always use migrations for schema changes
- Create backups before production migrations
- Test migrations in development first
- Keep migration files in version control

## Server Running Status
- Current status: ✅ Running on port 4000
- Database: ✅ Connected
- Latest migration: ✅ Applied (20260330000001)
