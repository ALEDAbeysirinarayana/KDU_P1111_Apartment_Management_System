const pool = require('../config/db');

async function run() {
  console.log('Patching parking_management table for visitor fields...');
  try {
    const [cols] = await pool.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'parking_management'
    `);
    const colNames = cols.map(c => c.COLUMN_NAME);

    if (!colNames.includes('visitor_name')) {
      await pool.query(`ALTER TABLE parking_management ADD COLUMN visitor_name VARCHAR(255) NULL AFTER guest_date`);
      console.log('Added: visitor_name');
    }
    if (!colNames.includes('visitor_vehicle')) {
      await pool.query(`ALTER TABLE parking_management ADD COLUMN visitor_vehicle VARCHAR(100) NULL AFTER visitor_name`);
      console.log('Added: visitor_vehicle');
    }
    if (!colNames.includes('arrival_time')) {
      await pool.query(`ALTER TABLE parking_management ADD COLUMN arrival_time VARCHAR(50) NULL AFTER visitor_vehicle`);
      console.log('Added: arrival_time');
    }
    if (!colNames.includes('reason')) {
      await pool.query(`ALTER TABLE parking_management ADD COLUMN reason TEXT NULL AFTER arrival_time`);
      console.log('Added: reason');
    }

    console.log('parking_management patched successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Patch failed:', err);
    process.exit(1);
  }
}

run();
