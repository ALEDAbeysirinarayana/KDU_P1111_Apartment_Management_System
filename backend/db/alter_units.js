const pool = require('../config/db');

async function runAlter() {
  console.log('Altering units table structure to add type and status columns...');
  try {
    // Add type column
    try {
      await pool.query(
        `ALTER TABLE units ADD COLUMN type VARCHAR(50) DEFAULT '2BHK'`
      );
      console.log('Added type column.');
    } catch (e) {
      console.log('type column already exists or failed:', e.message);
    }

    // Add status column
    try {
      await pool.query(
        `ALTER TABLE units ADD COLUMN status ENUM('occupied', 'vacant', 'maintenance') DEFAULT 'vacant'`
      );
      console.log('Added status column.');
    } catch (e) {
      console.log('status column already exists or failed:', e.message);
    }

    // Update existing units to occupied if they have owner_id or tenant_id
    await pool.query(
      `UPDATE units SET status = 'occupied' WHERE owner_id IS NOT NULL OR tenant_id IS NOT NULL`
    );
    console.log('Synchronized occupancy status based on allocations.');

    console.log('Units table altered successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to alter units table:', error);
    process.exit(1);
  }
}

runAlter();
