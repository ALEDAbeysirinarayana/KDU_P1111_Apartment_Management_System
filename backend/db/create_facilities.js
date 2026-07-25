const pool = require('../config/db');

async function runPatch() {
  console.log('Creating and seeding facilities table...');
  try {
    // Create facilities table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS facilities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        facility_id VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        capacity INT NOT NULL DEFAULT 10,
        status ENUM('available', 'maintenance', 'fully_booked') NOT NULL DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if seeded
    const [existing] = await pool.query('SELECT COUNT(*) AS count FROM facilities');
    if (existing[0].count === 0) {
      await pool.query(`
        INSERT INTO facilities (facility_id, name, description, capacity, status) VALUES 
        ('FAC-001', 'Main Swimming Pool', 'Heated pool with lounge area', 25, 'available'),
        ('FAC-002', 'Rooftop Garden', 'BBQ pits and sunset view deck', 50, 'maintenance'),
        ('FAC-003', 'Business Center', 'Meeting rooms and high-speed Wi-Fi', 10, 'fully_booked')
      `);
      console.log('Default facilities seeded successfully.');
    } else {
      console.log('Facilities table already contains records. Skipping seed.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Failed to create/seed facilities table:', error);
    process.exit(1);
  }
}

runPatch();
