const pool = require('../config/db');

async function runMigration() {
  console.log('Adding subject_title column to complaints table...');
  try {
    // Check if column already exists
    const [cols] = await pool.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'complaints' AND COLUMN_NAME = 'subject_title'
    `);

    if (cols.length > 0) {
      console.log('subject_title column already exists. Skipping.');
    } else {
      await pool.query(
        `ALTER TABLE complaints ADD COLUMN subject_title VARCHAR(255) NULL AFTER category`
      );
      console.log('subject_title column added successfully.');
    }

    // Ensure priority and status enums include emergency
    await pool.query(
      `ALTER TABLE complaints MODIFY COLUMN priority ENUM('low', 'medium', 'high', 'emergency') NOT NULL DEFAULT 'medium'`
    );
    await pool.query(
      `ALTER TABLE complaints MODIFY COLUMN status ENUM('pending', 'in_progress', 'resolved', 'emergency') DEFAULT 'pending'`
    );
    console.log('Priority/status enums confirmed.');

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
