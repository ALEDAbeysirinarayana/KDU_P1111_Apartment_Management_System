const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runSeed() {
  console.log('Starting migration and seeding...');
  
  // Retrieve environment variables
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || 'Shashini1223@';
  const dbPort = process.env.DB_PORT || 3306;
  const dbName = process.env.DB_NAME || 'apartment_management_system';

  let connection;
  try {
    // 1. Connect without database name first to create it
    console.log(`Connecting to MySQL server at ${dbHost}:${dbPort} as ${dbUser}...`);
    connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      port: dbPort
    });

    console.log(`Creating database '${dbName}' if not exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.end();

    // 2. Connect to the created database to run migrations and seeds
    console.log(`Connecting to database '${dbName}'...`);
    const pool = mysql.createPool({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      port: dbPort,
      waitForConnections: true,
      connectionLimit: 5
    });

    // 3. Read and execute migration.sql
    const migrationPath = path.join(__dirname, 'migration.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL by semi-colon (ignoring comments/empty lines) and execute individually
    const queries = migrationSql
      .split(/;\s*$/m)
      .map(query => query.trim())
      .filter(query => query.length > 0);

    console.log(`Executing ${queries.length} database setup queries...`);
    for (const query of queries) {
      await pool.query(query);
    }
    console.log('Database tables created successfully.');

    // ── PATCH: units table ──────────────────────────────────────────────────
    console.log('\n[Patch] Altering units table...');
    for (const [col, def] of [
      ['type',   "VARCHAR(50) DEFAULT '2BHK'"],
      ['status', "ENUM('occupied','vacant','maintenance') DEFAULT 'vacant'"]
    ]) {
      try {
        await pool.query(`ALTER TABLE units ADD COLUMN \`${col}\` ${def}`);
        console.log(`  Added units.${col}`);
      } catch (e) {
        console.log(`  units.${col} already exists.`);
      }
    }

    // ── PATCH: users.status ENUM – add 'suspended' ──────────────────────────
    console.log('[Patch] Expanding users.status ENUM to include suspended...');
    try {
      await pool.query(
        `ALTER TABLE users MODIFY COLUMN status ENUM('pending','approved','rejected','suspended') DEFAULT 'pending'`
      );
      console.log('  users.status ENUM updated.');
    } catch (e) {
      console.log('  users.status ENUM patch failed (may already be correct):', e.message);
    }


    // ── PATCH: parking_management – drop unique on slot_number, add composite ─
    console.log('[Patch] Patching parking_management table...');
    try {
      await pool.query('ALTER TABLE parking_management DROP INDEX slot_number');
      console.log('  Dropped global unique index on slot_number.');
    } catch (e) {
      console.log('  slot_number index already dropped or does not exist.');
    }
    try {
      await pool.query('ALTER TABLE parking_management ADD UNIQUE KEY uq_slot_guest_date (slot_number, guest_date)');
      console.log('  Added uq_slot_guest_date index.');
    } catch (e) {
      console.log('  uq_slot_guest_date index already exists.');
    }

    // ── PATCH: parking_management – visitor columns ─────────────────────────
    console.log('[Patch] Adding visitor columns to parking_management...');
    const [pmCols] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'parking_management'`
    );
    const pmColNames = pmCols.map(c => c.COLUMN_NAME);
    for (const [col, def] of [
      ['visitor_name',    'VARCHAR(255) NULL AFTER guest_date'],
      ['visitor_vehicle', 'VARCHAR(100) NULL AFTER visitor_name'],
      ['arrival_time',    'VARCHAR(50)  NULL AFTER visitor_vehicle'],
      ['reason',         'TEXT         NULL AFTER arrival_time']
    ]) {
      if (!pmColNames.includes(col)) {
        await pool.query(`ALTER TABLE parking_management ADD COLUMN \`${col}\` ${def}`);
        console.log(`  Added parking_management.${col}`);
      }
    }

    // ── PATCH: facility_reservations – extra columns ─────────────────────────
    console.log('[Patch] Patching facility_reservations table...');
    const [frCols] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'facility_reservations'`
    );
    const frColNames = frCols.map(c => c.COLUMN_NAME);
    for (const [col, def] of [
      ['purpose',      'VARCHAR(255) NULL AFTER date'],
      ['participants', 'INT          NULL DEFAULT 1 AFTER purpose'],
      ['notes',        'TEXT         NULL AFTER participants'],
      ['time_slot',    'VARCHAR(100) NULL AFTER notes']
    ]) {
      if (!frColNames.includes(col)) {
        await pool.query(`ALTER TABLE facility_reservations ADD COLUMN \`${col}\` ${def}`);
        console.log(`  Added facility_reservations.${col}`);
      }
    }

    // ── PATCH: notices – extra columns ─────────────────────────────────────
    console.log('[Patch] Altering notices table...');
    const noticesCols = [
      { name: 'notice_id',   def: 'VARCHAR(50) NULL UNIQUE' },
      { name: 'category',    def: "VARCHAR(50) DEFAULT 'Other'" },
      { name: 'expiry_date', def: 'DATE NULL' },
      { name: 'priority',    def: "ENUM('low','medium','high','urgent') DEFAULT 'low'" },
      { name: 'audience',    def: "VARCHAR(100) DEFAULT 'All Residents'" },
      { name: 'status',      def: "ENUM('published','scheduled','expired','archived') DEFAULT 'published'" }
    ];
    for (const col of noticesCols) {
      const [existing] = await pool.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notices' AND COLUMN_NAME = ?`,
        [col.name]
      );
      if (existing.length === 0) {
        await pool.query(`ALTER TABLE notices ADD COLUMN \`${col.name}\` ${col.def}`);
        console.log(`  Added notices.${col.name}`);
      }
    }

    // ── PATCH: bills – extra columns + payment_transactions table ────────────
    console.log('[Patch] Patching bills table...');
    const billsCols = [
      { name: 'invoice_id',      def: 'VARCHAR(50) NULL UNIQUE' },
      { name: 'payment_method',  def: "VARCHAR(50) DEFAULT 'Bank Transfer'" },
      { name: 'paid_at',         def: 'TIMESTAMP NULL' }
    ];
    for (const col of billsCols) {
      const [existing] = await pool.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bills' AND COLUMN_NAME = ?`,
        [col.name]
      );
      if (existing.length === 0) {
        await pool.query(`ALTER TABLE bills ADD COLUMN \`${col.name}\` ${col.def}`);
        console.log(`  Added bills.${col.name}`);
      }
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        transaction_id VARCHAR(50)    NOT NULL UNIQUE,
        bill_id        INT            NOT NULL,
        unit_id        INT            NOT NULL,
        user_id        INT            NOT NULL,
        amount         DECIMAL(10,2)  NOT NULL,
        method         ENUM('Bank Transfer','Online Payment','Card','Cash') DEFAULT 'Bank Transfer',
        status         ENUM('successful','pending','failed') DEFAULT 'successful',
        notes          VARCHAR(255)   NULL,
        created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bill_id)  REFERENCES bills(id)  ON DELETE CASCADE,
        FOREIGN KEY (unit_id)  REFERENCES units(id)  ON DELETE CASCADE,
        FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE
      )
    `);
    console.log('  payment_transactions table ready.');

    // ── PATCH: complaints – subject_title + updated enums ───────────────────
    console.log('[Patch] Patching complaints table...');
    const [compCols] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'complaints' AND COLUMN_NAME = 'subject_title'`
    );
    if (compCols.length === 0) {
      await pool.query(`ALTER TABLE complaints ADD COLUMN subject_title VARCHAR(255) NULL AFTER category`);
      console.log('  Added complaints.subject_title');
    }
    await pool.query(
      `ALTER TABLE complaints MODIFY COLUMN priority ENUM('low','medium','high','emergency') NOT NULL DEFAULT 'medium'`
    );
    await pool.query(
      `ALTER TABLE complaints MODIFY COLUMN status ENUM('pending','in_progress','resolved','emergency') DEFAULT 'pending'`
    );

    // ── CREATE: facilities table ─────────────────────────────────────────────
    console.log('[Create] Creating facilities table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS facilities (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        facility_id VARCHAR(50)  NOT NULL UNIQUE,
        name        VARCHAR(100) NOT NULL,
        description TEXT,
        capacity    INT          NOT NULL DEFAULT 10,
        status      ENUM('available','maintenance','fully_booked') NOT NULL DEFAULT 'available',
        created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ── CREATE: events + event_registrations tables ─────────────────────────
    console.log('[Create] Creating events tables...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        event_id   VARCHAR(50)  NOT NULL UNIQUE,
        name       VARCHAR(100) NOT NULL,
        type       VARCHAR(50)  NOT NULL,
        date       DATE         NOT NULL,
        time       VARCHAR(50)  NOT NULL,
        location   VARCHAR(100) NOT NULL,
        status     VARCHAR(50)  NOT NULL DEFAULT 'Upcoming',
        created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_registrations (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        reg_id     VARCHAR(50)  NOT NULL UNIQUE,
        event_id   INT          NOT NULL,
        user_id    INT          NOT NULL,
        attendance ENUM('registered','attended','no_show') NOT NULL DEFAULT 'registered',
        created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id)  ON DELETE CASCADE,
        FOREIGN KEY (user_id)  REFERENCES users(id)   ON DELETE CASCADE
      )
    `);

    // 4. Insert Seed Users
    console.log('\nInserting seed users...');
    const users = [
      { email: 'admin@apartment.com',       password: 'AdminPass123!',       role: 'admin',       status: 'approved' },
      { email: 'staff@apartment.com',       password: 'StaffPass123!',       role: 'staff',       status: 'approved' },
      { email: 'maintenance@apartment.com', password: 'MaintenancePass123!', role: 'maintenance', status: 'approved' },
      { email: 'homeowner@apartment.com',   password: 'OwnerPass123!',       role: 'homeowner',   status: 'approved' }
    ];

    const insertedUsers = {};
    for (const user of users) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(user.password, salt);
      
      const [result] = await pool.query(
        'INSERT INTO users (email, password_hash, role, status, owner_approved) VALUES (?, ?, ?, ?, ?)',
        [user.email, hash, user.role, user.status, 1]
      );
      insertedUsers[user.role] = result.insertId;
      console.log(`  Created: ${user.email} (${user.role})`);
    }

    // 5. Insert Seed Parking Slots
    console.log('Inserting seed parking slots...');
    const parkingSlots = [
      { slot_number: 'P-101', type: 'permanent', status: 'active' },
      { slot_number: 'P-102', type: 'permanent', status: 'active' },
      { slot_number: 'P-201', type: 'permanent', status: 'active' },
      { slot_number: 'P-202', type: 'permanent', status: 'active' },
      { slot_number: 'G-101', type: 'guest',     status: 'approved' },
      { slot_number: 'G-102', type: 'guest',     status: 'approved' }
    ];

    const slotIds = {};
    for (const slot of parkingSlots) {
      const [result] = await pool.query(
        'INSERT INTO parking_management (slot_number, type, status) VALUES (?, ?, ?)',
        [slot.slot_number, slot.type, slot.status]
      );
      slotIds[slot.slot_number] = result.insertId;
    }
    console.log('Parking slots created.');

    // 6. Insert Seed Units
    console.log('Inserting seed units...');
    const units = [
      { block_name: 'Block A', floor_number: 1, unit_number: '101', type: '2BHK', owner_id: insertedUsers['homeowner'], parking_slot_id: slotIds['P-101'] },
      { block_name: 'Block A', floor_number: 1, unit_number: '102', type: '3BHK', owner_id: null, parking_slot_id: slotIds['P-102'] },
      { block_name: 'Block B', floor_number: 2, unit_number: '201', type: '2BHK', owner_id: null, parking_slot_id: slotIds['P-201'] },
      { block_name: 'Block B', floor_number: 2, unit_number: '202', type: '1BHK', owner_id: null, parking_slot_id: slotIds['P-202'] }
    ];

    for (const unit of units) {
      const status = (unit.owner_id || unit.tenant_id) ? 'occupied' : 'vacant';
      const [result] = await pool.query(
        'INSERT INTO units (block_name, floor_number, unit_number, type, status, owner_id, parking_slot_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [unit.block_name, unit.floor_number, unit.unit_number, unit.type, status, unit.owner_id, unit.parking_slot_id]
      );
      
      if (unit.parking_slot_id) {
        await pool.query(
          'UPDATE parking_management SET unit_id = ? WHERE id = ?',
          [result.insertId, unit.parking_slot_id]
        );
      }
    }
    console.log('Units created.');

    // 7. Seed Facilities
    console.log('Seeding facilities...');
    const [facCount] = await pool.query('SELECT COUNT(*) AS count FROM facilities');
    if (facCount[0].count === 0) {
      await pool.query(`
        INSERT INTO facilities (facility_id, name, description, capacity, status) VALUES 
        ('FAC-001', 'Main Swimming Pool',  'Heated pool with lounge area',        25, 'available'),
        ('FAC-002', 'Rooftop Garden',      'BBQ pits and sunset view deck',        50, 'maintenance'),
        ('FAC-003', 'Business Center',     'Meeting rooms and high-speed Wi-Fi',   10, 'fully_booked')
      `);
      console.log('  Facilities seeded.');
    }

    // 8. Seed Events
    console.log('Seeding events...');
    const [evCount] = await pool.query('SELECT COUNT(*) AS count FROM events');
    if (evCount[0].count === 0) {
      await pool.query(`
        INSERT INTO events (event_id, name, type, date, time, location, status) VALUES 
        ('EV-201', 'Morning Yoga',                'Fitness',  '2026-10-14', '8:00 AM',  'Clubhouse',   'Completed'),
        ('EV-202', 'AGM (Annual General Meeting)', 'Meeting',  '2026-11-15', '10:00 AM', 'Main Lobby',  'Upcoming'),
        ('EV-203', 'Community Fire Drill',         'Safety',   '2026-11-20', '2:00 PM',  'Courtyard',   'Upcoming'),
        ('EV-204', 'Community Meeting',            'Meeting',  '2026-10-29', '6:00 PM',  'Clubhouse',   'Registration Open'),
        ('EV-205', 'Halloween Party',              'Festival', '2026-10-31', '7:00 PM',  'Rooftop',     'Upcoming'),
        ('EV-206', 'New Year Celebration',         'Social',   '2026-12-31', '8:00 PM',  'Rooftop',     'Upcoming'),
        ('EV-207', 'Neighborhood Cleanup',         'Social',   '2026-11-05', '9:00 AM',  'Surroundings','Upcoming')
      `);

      const [dbEvents] = await pool.query('SELECT id, event_id FROM events');
      const yogaEvent    = dbEvents.find(e => e.event_id === 'EV-201');
      const meetingEvent = dbEvents.find(e => e.event_id === 'EV-204');
      const homeownerId  = insertedUsers['homeowner'];
      const staffId      = insertedUsers['staff'];

      if (yogaEvent && meetingEvent) {
        await pool.query(`
          INSERT INTO event_registrations (reg_id, event_id, user_id, attendance) VALUES 
          ('RG-1001', ?, ?, 'registered'),
          ('RG-990',  ?, ?, 'attended'),
          ('RG-985',  ?, ?, 'no_show')
        `, [meetingEvent.id, homeownerId, yogaEvent.id, staffId, yogaEvent.id, homeownerId]);
      }
      console.log('  Events and registrations seeded.');
    }

    // 9. Seed Notices
    console.log('Seeding notices...');
    const [noticeCount] = await pool.query('SELECT COUNT(*) AS count FROM notices');
    if (noticeCount[0].count === 0) {
      const adminId = insertedUsers['admin'];
      await pool.query(`
        INSERT INTO notices (notice_id, title, content, category, created_by, created_at, expiry_date, priority, audience, status) VALUES 
        ('NOT-2024-001', 'Water Maintenance Shutdown',  'Scheduled water supply shutdown for tank cleaning in Tower A & B.', 'Utility', ?, '2026-10-24', '2026-10-26', 'urgent', 'Tower A, B',    'published'),
        ('NOT-2024-005', 'Annual General Meeting 2026', 'Notice of the Annual General Meeting of the homeowner association.', 'Event',   ?, '2026-11-01', '2026-11-15', 'high',   'All Residents', 'scheduled'),
        ('NOT-2023-142', 'New Gym Equipment Arrival',   'Modern treadmill and weights added to the resident gym center.',    'Amenity', ?, '2026-09-15', '2026-09-30', 'low',    'Active Members','expired')
      `, [adminId, adminId, adminId]);
      console.log('  Notices seeded.');
    }

    console.log('\n✅ Database migration and seeding completed successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Migration/Seeding failed:', error);
    if (connection) {
      try { await connection.end(); } catch (err) {}
    }
    process.exit(1);
  }
}

runSeed();
