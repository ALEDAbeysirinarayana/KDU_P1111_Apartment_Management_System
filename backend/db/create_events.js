const pool = require('../config/db');

async function runPatch() {
  console.log('Creating and seeding events and event_registrations tables...');
  try {
    // Create events table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        time VARCHAR(50) NOT NULL,
        location VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Upcoming',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create event_registrations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reg_id VARCHAR(50) NOT NULL UNIQUE,
        event_id INT NOT NULL,
        user_id INT NOT NULL,
        attendance ENUM('registered', 'attended', 'no_show') NOT NULL DEFAULT 'registered',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Check if seeded
    const [existingEvents] = await pool.query('SELECT COUNT(*) AS count FROM events');
    if (existingEvents[0].count === 0) {
      // Create some default events
      await pool.query(`
        INSERT INTO events (event_id, name, type, date, time, location, status) VALUES 
        ('EV-204', 'Community Meeting', 'Meeting', '2026-10-29', '6:00 PM', 'Clubhouse', 'Registration Open'),
        ('EV-205', 'Halloween Party', 'Festival', '2026-10-31', '7:00 PM', 'Rooftop', 'Upcoming'),
        ('EV-201', 'Morning Yoga', 'Fitness', '2026-10-14', '8:00 AM', 'Clubhouse', 'Completed'),
        ('EV-202', 'AGM (Annual General Meeting)', 'Meeting', '2026-11-15', '10:00 AM', 'Main Lobby', 'Upcoming'),
        ('EV-203', 'Community Fire Drill', 'Safety', '2026-11-20', '2:00 PM', 'Courtyard', 'Upcoming'),
        ('EV-206', 'New Year Celebration', 'Social', '2026-12-31', '8:00 PM', 'Rooftop', 'Upcoming'),
        ('EV-207', 'Neighborhood Cleanup', 'Social', '2026-11-05', '9:00 AM', 'Surroundings', 'Upcoming')
      `);
      console.log('Default events seeded successfully.');

      // Get user ids
      const [users] = await pool.query('SELECT id, full_name, role FROM users');
      const [dbEvents] = await pool.query('SELECT id, event_id FROM events');
      
      const yogaEvent = dbEvents.find(e => e.event_id === 'EV-201');
      const meetingEvent = dbEvents.find(e => e.event_id === 'EV-204');

      if (users.length > 0 && yogaEvent && meetingEvent) {
        // Seed some registrations
        // Find homeowner or any user
        const resident1 = users.find(u => u.role === 'homeowner') || users[0];
        const resident2 = users[1] || users[0];
        
        await pool.query(`
          INSERT INTO event_registrations (reg_id, event_id, user_id, attendance) VALUES 
          ('RG-1001', ?, ?, 'registered'),
          ('RG-990', ?, ?, 'attended'),
          ('RG-985', ?, ?, 'no_show')
        `, [meetingEvent.id, resident1.id, yogaEvent.id, resident2.id, yogaEvent.id, resident1.id]);
        console.log('Default registrations seeded.');
      }
    } else {
      console.log('Events table already contains records. Skipping seed.');
    }

    console.log('Database tables patched and seeded for events.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to create/seed events tables:', error);
    process.exit(1);
  }
}

runPatch();
