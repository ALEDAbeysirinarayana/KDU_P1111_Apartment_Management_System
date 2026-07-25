const pool = require('../config/db');

async function run() {
  console.log('Patching facility_reservations table...');
  try {
    const [cols] = await pool.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'facility_reservations'
    `);
    const colNames = cols.map(c => c.COLUMN_NAME);

    if (!colNames.includes('purpose')) {
      await pool.query(`ALTER TABLE facility_reservations ADD COLUMN purpose VARCHAR(255) NULL AFTER date`);
      console.log('Added: purpose');
    }
    if (!colNames.includes('participants')) {
      await pool.query(`ALTER TABLE facility_reservations ADD COLUMN participants INT NULL DEFAULT 1 AFTER purpose`);
      console.log('Added: participants');
    }
    if (!colNames.includes('notes')) {
      await pool.query(`ALTER TABLE facility_reservations ADD COLUMN notes TEXT NULL AFTER participants`);
      console.log('Added: notes');
    }
    if (!colNames.includes('time_slot')) {
      await pool.query(`ALTER TABLE facility_reservations ADD COLUMN time_slot VARCHAR(100) NULL AFTER notes`);
      console.log('Added: time_slot');
    }

    console.log('facility_reservations patched successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Patch failed:', err);
    process.exit(1);
  }
}

run();
