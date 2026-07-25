const pool = require('../config/db');

async function runAlter() {
  console.log('Altering notices table and seeding defaults...');
  try {
    const cols = [
      { name: 'notice_id', def: 'VARCHAR(50) NULL UNIQUE' },
      { name: 'category', def: "VARCHAR(50) DEFAULT 'Other'" },
      { name: 'expiry_date', def: 'DATE NULL' },
      { name: 'priority', def: "ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'low'" },
      { name: 'audience', def: "VARCHAR(100) DEFAULT 'All Residents'" },
      { name: 'status', def: "ENUM('published', 'scheduled', 'expired', 'archived') DEFAULT 'published'" }
    ];

    for (const col of cols) {
      const [existing] = await pool.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notices' AND COLUMN_NAME = ?`,
        [col.name]
      );

      if (existing.length === 0) {
        await pool.query(`ALTER TABLE notices ADD COLUMN \`${col.name}\` ${col.def}`);
        console.log(`Added column ${col.name}`);
      } else {
        console.log(`Column ${col.name} already exists`);
      }
    }

    // Seed some mock notices if empty or contains only defaults
    const [existingNotices] = await pool.query('SELECT COUNT(*) AS count FROM notices');
    // We clear or verify
    if (existingNotices[0].count <= 1) {
      // Clear to seed high quality mock data matching screenshot
      await pool.query('DELETE FROM notices');
      
      const [adminUser] = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
      const adminId = adminUser[0]?.id || 1;

      await pool.query(`
        INSERT INTO notices (notice_id, title, content, category, created_by, created_at, expiry_date, priority, audience, status) VALUES 
        ('NOT-2024-001', 'Water Maintenance Shutdown', 'Scheduled water supply shutdown for tank cleaning in Tower A & B.', 'Utility', ?, '2026-10-24', '2026-10-26', 'urgent', 'Tower A, B', 'published'),
        ('NOT-2024-005', 'Annual General Meeting 2026', 'Notice of the Annual General Meeting of the homeowner association.', 'Event', ?, '2026-11-01', '2026-11-15', 'high', 'All Residents', 'scheduled'),
        ('NOT-2023-142', 'New Gym Equipment Arrival', 'Modern treadmill and weights added to the resident gym center.', 'Amenity', ?, '2026-09-15', '2026-09-30', 'low', 'Active Members', 'expired')
      `, [adminId, adminId, adminId]);
      
      console.log('Seeded high-fidelity mock notices.');
    }

    console.log('Notices table successfully altered and seeded.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to alter notices table:', error);
    process.exit(1);
  }
}

runAlter();
