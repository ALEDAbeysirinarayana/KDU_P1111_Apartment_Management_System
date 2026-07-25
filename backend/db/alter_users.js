const pool = require('../config/db');

async function runAlter() {
  console.log('Altering users table status column to include "suspended"...');
  try {
    await pool.query(
      `ALTER TABLE users MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'suspended') DEFAULT 'pending'`
    );
    console.log('Users status ENUM updated successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to alter users table:', error);
    process.exit(1);
  }
}

runAlter();
