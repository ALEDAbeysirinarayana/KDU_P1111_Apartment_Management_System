const pool = require('../config/db');

async function runAlter() {
  console.log('Altering complaints table structure to support emergency priorities and statuses...');
  try {
    await pool.query(
      `ALTER TABLE complaints MODIFY COLUMN priority ENUM('low', 'medium', 'high', 'emergency') NOT NULL DEFAULT 'medium'`
    );
    await pool.query(
      `ALTER TABLE complaints MODIFY COLUMN status ENUM('pending', 'in_progress', 'resolved', 'emergency') DEFAULT 'pending'`
    );
    console.log('Complaints table altered successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to alter complaints table:', error);
    process.exit(1);
  }
}

runAlter();
