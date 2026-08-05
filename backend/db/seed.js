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

    // 4. Insert Seed Users (24 accounts total: 4 core + 20 additional seeds)
    console.log('\nInserting seed users (24 total)...');
    const users = [
      // Core 4 Users
      { email: 'admin@apartment.com',       password: 'AdminPass123!',       role: 'admin',       status: 'approved', fullName: 'System Admin', phone: '+94 77 000 0001' },
      { email: 'staff@apartment.com',       password: 'StaffPass123!',       role: 'staff',       status: 'approved', fullName: 'Primary Staff', phone: '+94 77 000 0002' },
      { email: 'maintenance@apartment.com', password: 'MaintenancePass123!', role: 'maintenance', status: 'approved', fullName: 'Chief Technician', phone: '+94 77 000 0003' },
      { email: 'homeowner@apartment.com',   password: 'OwnerPass123!',       role: 'homeowner',   status: 'approved', fullName: 'Primary Homeowner', building: 'Block A', unit: 'A01', phone: '+94 77 301 0001', nic: 'NIC882001001V', vehicle: 'WP-CAB-1001' },

      // 20 Additional Seed Users
      // Additional Staff & Maintenance
      { email: 'staff.sarah@apartment.com', password: 'StaffPass123!',       role: 'staff',       status: 'approved', fullName: 'Sarah Jenkins', phone: '+94 77 111 2233' },
      { email: 'maint.alex@apartment.com',  password: 'MaintenancePass123!', role: 'maintenance', status: 'approved', fullName: 'Alex Rivera', phone: '+94 77 222 3344' },

      // Additional Homeowners (11)
      { email: 'owner.smith@apartment.com',     password: 'OwnerPass123!', role: 'homeowner', status: 'approved', fullName: 'John Smith',       building: 'Block A', unit: 'A02', phone: '+94 77 301 0002', nic: 'NIC882001002V', vehicle: 'WP-CAB-1002' },
      { email: 'owner.johnson@apartment.com',   password: 'OwnerPass123!', role: 'homeowner', status: 'approved', fullName: 'Robert Johnson',   building: 'Block A', unit: 'A03', phone: '+94 77 301 0003', nic: 'NIC882001003V', vehicle: 'WP-CAB-1003' },
      { email: 'owner.williams@apartment.com',  password: 'OwnerPass123!', role: 'homeowner', status: 'approved', fullName: 'Emily Williams',   building: 'Block A', unit: 'A04', phone: '+94 77 301 0004', nic: 'NIC882001004V', vehicle: 'WP-CAB-1004' },
      { email: 'owner.brown@apartment.com',     password: 'OwnerPass123!', role: 'homeowner', status: 'approved', fullName: 'Michael Brown',    building: 'Block B', unit: 'B01', phone: '+94 77 302 0001', nic: 'NIC882002001V', vehicle: 'WP-CAB-2001' },
      { email: 'owner.jones@apartment.com',     password: 'OwnerPass123!', role: 'homeowner', status: 'approved', fullName: 'Jessica Jones',    building: 'Block B', unit: 'B02', phone: '+94 77 302 0002', nic: 'NIC882002002V', vehicle: 'WP-CAB-2002' },
      { email: 'owner.garcia@apartment.com',    password: 'OwnerPass123!', role: 'homeowner', status: 'approved', fullName: 'Carlos Garcia',    building: 'Block B', unit: 'B03', phone: '+94 77 302 0003', nic: 'NIC882002003V', vehicle: 'WP-CAB-2003' },
      { email: 'owner.miller@apartment.com',    password: 'OwnerPass123!', role: 'homeowner', status: 'approved', fullName: 'David Miller',     building: 'Block B', unit: 'B04', phone: '+94 77 302 0004', nic: 'NIC882002004V', vehicle: 'WP-CAB-2004' },
      { email: 'owner.davis@apartment.com',     password: 'OwnerPass123!', role: 'homeowner', status: 'approved', fullName: 'Amanda Davis',     building: 'Block C', unit: 'C01', phone: '+94 77 303 0001', nic: 'NIC882003001V', vehicle: 'WP-CAB-3001' },
      { email: 'owner.rodriguez@apartment.com', password: 'OwnerPass123!', role: 'homeowner', status: 'approved', fullName: 'Sofia Rodriguez',  building: 'Block C', unit: 'C02', phone: '+94 77 303 0002', nic: 'NIC882003002V', vehicle: 'WP-CAB-3002' },
      { email: 'owner.martinez@apartment.com',  password: 'OwnerPass123!', role: 'homeowner', status: 'approved', fullName: 'Daniel Martinez',  building: 'Block C', unit: 'C03', phone: '+94 77 303 0003', nic: 'NIC882003003V', vehicle: 'WP-CAB-3003' },
      { email: 'owner.hernandez@apartment.com', password: 'OwnerPass123!', role: 'homeowner', status: 'approved', fullName: 'James Hernandez',  building: 'Block C', unit: 'C04', phone: '+94 77 303 0004', nic: 'NIC882003004V', vehicle: 'WP-CAB-3004' },

      // Additional Tenants (7)
      { email: 'tenant.wilson@apartment.com',   password: 'TenantPass123!', role: 'tenant', status: 'approved', fullName: 'Mark Wilson',     building: 'Block A', unit: 'A01', ownerEmail: 'homeowner@apartment.com',       relationship: 'Primary Tenant', phone: '+94 77 401 0001', nic: 'NIC991001001V' },
      { email: 'tenant.anderson@apartment.com', password: 'TenantPass123!', role: 'tenant', status: 'approved', fullName: 'Chloe Anderson',  building: 'Block A', unit: 'A02', ownerEmail: 'owner.smith@apartment.com',     relationship: 'Tenant',         phone: '+94 77 401 0002', nic: 'NIC991001002V' },
      { email: 'tenant.taylor@apartment.com',   password: 'TenantPass123!', role: 'tenant', status: 'approved', fullName: 'Ryan Taylor',     building: 'Block A', unit: 'A03', ownerEmail: 'owner.johnson@apartment.com',   relationship: 'Family Member',  phone: '+94 77 401 0003', nic: 'NIC991001003V' },
      { email: 'tenant.thomas@apartment.com',   password: 'TenantPass123!', role: 'tenant', status: 'approved', fullName: 'Matthew Thomas',  building: 'Block B', unit: 'B01', ownerEmail: 'owner.brown@apartment.com',     relationship: 'Tenant',         phone: '+94 77 402 0001', nic: 'NIC991002001V' },
      { email: 'tenant.white@apartment.com',    password: 'TenantPass123!', role: 'tenant', status: 'approved', fullName: 'Olivia White',    building: 'Block B', unit: 'B02', ownerEmail: 'owner.jones@apartment.com',     relationship: 'Roommate',       phone: '+94 77 402 0002', nic: 'NIC991002002V' },
      { email: 'tenant.harris@apartment.com',   password: 'TenantPass123!', role: 'tenant', status: 'approved', fullName: 'Joshua Harris',   building: 'Block C', unit: 'C01', ownerEmail: 'owner.davis@apartment.com',     relationship: 'Tenant',         phone: '+94 77 403 0001', nic: 'NIC991003001V' },
      { email: 'tenant.martin@apartment.com',   password: 'TenantPass123!', role: 'tenant', status: 'approved', fullName: 'Sophia Martin',   building: 'Block C', unit: 'C02', ownerEmail: 'owner.rodriguez@apartment.com', relationship: 'Tenant',         phone: '+94 77 403 0002', nic: 'NIC991003002V' },

      // 10 Pending User Registrations (Awaiting Admin / Staff Approval)
      // Pending Homeowners (5)
      { email: 'pending.owner1@apartment.com', password: 'OwnerPass123!', role: 'homeowner', status: 'pending', fullName: 'Alexander Wright', building: 'Block A', unit: 'A05', phone: '+94 77 501 0001', nic: 'NIC992001001V', vehicle: 'WP-CAB-5001' },
      { email: 'pending.owner2@apartment.com', password: 'OwnerPass123!', role: 'homeowner', status: 'pending', fullName: 'Isabella Scott',    building: 'Block A', unit: 'A06', phone: '+94 77 501 0002', nic: 'NIC992001002V', vehicle: 'WP-CAB-5002' },
      { email: 'pending.owner3@apartment.com', password: 'OwnerPass123!', role: 'homeowner', status: 'pending', fullName: 'Benjamin Green',    building: 'Block B', unit: 'B05', phone: '+94 77 502 0001', nic: 'NIC992002001V', vehicle: 'WP-CAB-5003' },
      { email: 'pending.owner4@apartment.com', password: 'OwnerPass123!', role: 'homeowner', status: 'pending', fullName: 'Charlotte Adams',   building: 'Block B', unit: 'B06', phone: '+94 77 502 0002', nic: 'NIC992002002V', vehicle: 'WP-CAB-5004' },
      { email: 'pending.owner5@apartment.com', password: 'OwnerPass123!', role: 'homeowner', status: 'pending', fullName: 'Lucas Baker',       building: 'Block C', unit: 'C05', phone: '+94 77 503 0001', nic: 'NIC992003001V', vehicle: 'WP-CAB-5005' },

      // Pending Tenants (5)
      { email: 'pending.tenant1@apartment.com', password: 'TenantPass123!', role: 'tenant', status: 'pending', fullName: 'Mia Nelson',       building: 'Block A', unit: 'A04', ownerEmail: 'owner.williams@apartment.com',  relationship: 'Tenant',        phone: '+94 77 601 0001', nic: 'NIC993001001V' },
      { email: 'pending.tenant2@apartment.com', password: 'TenantPass123!', role: 'tenant', status: 'pending', fullName: 'Ethan Carter',     building: 'Block B', unit: 'B03', ownerEmail: 'owner.garcia@apartment.com',    relationship: 'Tenant',        phone: '+94 77 602 0001', nic: 'NIC993002001V' },
      { email: 'pending.tenant3@apartment.com', password: 'TenantPass123!', role: 'tenant', status: 'pending', fullName: 'Harper Mitchell', building: 'Block B', unit: 'B04', ownerEmail: 'owner.miller@apartment.com',     relationship: 'Roommate',      phone: '+94 77 602 0002', nic: 'NIC993002002V' },
      { email: 'pending.tenant4@apartment.com', password: 'TenantPass123!', role: 'tenant', status: 'pending', fullName: 'Mason Perez',      building: 'Block C', unit: 'C03', ownerEmail: 'owner.martinez@apartment.com', relationship: 'Tenant',        phone: '+94 77 603 0001', nic: 'NIC993003001V' },
      { email: 'pending.tenant5@apartment.com', password: 'TenantPass123!', role: 'tenant', status: 'pending', fullName: 'Evelyn Roberts',   building: 'Block C', unit: 'C04', ownerEmail: 'owner.hernandez@apartment.com',relationship: 'Family Member', phone: '+94 77 603 0002', nic: 'NIC993003002V' }
    ];

    const insertedUsersByEmail = {};
    const insertedUsersByRole = {};

    for (const u of users) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(u.password, salt);

      let ownerId = null;
      if (u.ownerEmail && insertedUsersByEmail[u.ownerEmail]) {
        ownerId = insertedUsersByEmail[u.ownerEmail];
      }

      const [result] = await pool.query(
        `INSERT INTO users (
          email, password_hash, role, status, owner_id, owner_approved,
          full_name, nic_or_passport, phone_number, building_name, unit_number, vehicle_number, relationship_to_owner
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          u.email, hash, u.role, u.status, ownerId, 1,
          u.fullName || null, u.nic || null, u.phone || null, u.building || null, u.unit || null, u.vehicle || null, u.relationship || null
        ]
      );

      insertedUsersByEmail[u.email] = result.insertId;
      if (!insertedUsersByRole[u.role]) {
        insertedUsersByRole[u.role] = result.insertId;
      }
      console.log(`  Created: ${u.email} (${u.role})`);
    }

    // 5. Insert Seed Parking Slots
    console.log('Inserting seed parking slots...');

    // Generate 60 permanent slots (one per unit: A01–A20, B01–B20, C01–C20)
    // plus 6 guest slots
    const parkingSlots = [];
    for (const block of ['A', 'B', 'C']) {
      for (let i = 1; i <= 20; i++) {
        parkingSlots.push({ slot_number: `P-${block}${String(i).padStart(2,'0')}`, type: 'permanent', status: 'active' });
      }
    }
    // Guest slots
    for (let i = 1; i <= 6; i++) {
      parkingSlots.push({ slot_number: `G-${String(i).padStart(3,'0')}`, type: 'guest', status: 'approved' });
    }

    const slotIds = {};
    for (const slot of parkingSlots) {
      const [result] = await pool.query(
        'INSERT INTO parking_management (slot_number, type, status) VALUES (?, ?, ?)',
        [slot.slot_number, slot.type, slot.status]
      );
      slotIds[slot.slot_number] = result.insertId;
    }
    console.log(`  ${parkingSlots.length} parking slots created.`);

    // 6. Insert Seed Units – 20 units per block for Blocks A, B, C (60 total)
    console.log('Inserting seed units (20 per block × 3 blocks = 60 units)...');

    // Unit types cycling: 1BHK, 2BHK, 3BHK
    const unitTypes = ['1BHK', '2BHK', '3BHK'];
    // Blocks definition
    const blocks = [
      { name: 'Block A', prefix: 'A' },
      { name: 'Block B', prefix: 'B' },
      { name: 'Block C', prefix: 'C' }
    ];

    // Build map from unit_number to owner_id and tenant_id
    const unitOwnerMap = {};
    const unitTenantMap = {};
    for (const u of users) {
      if (u.unit) {
        if (u.role === 'homeowner') {
          unitOwnerMap[u.unit] = insertedUsersByEmail[u.email];
        } else if (u.role === 'tenant') {
          unitTenantMap[u.unit] = insertedUsersByEmail[u.email];
        }
      }
    }

    for (const block of blocks) {
      for (let i = 1; i <= 20; i++) {
        const floorNumber = Math.ceil(i / 4);
        const unitNumber  = `${block.prefix}${String(i).padStart(2, '0')}`;
        const unitType    = unitTypes[(i - 1) % unitTypes.length];
        const slotKey     = `P-${block.prefix}${String(i).padStart(2, '0')}`;
        const parkingSlotId = slotIds[slotKey];

        const ownerId  = unitOwnerMap[unitNumber] || null;
        const tenantId = unitTenantMap[unitNumber] || null;
        const status   = (ownerId || tenantId) ? 'occupied' : 'vacant';

        const [result] = await pool.query(
          'INSERT INTO units (block_name, floor_number, unit_number, type, status, owner_id, parking_slot_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [block.name, floorNumber, unitNumber, unitType, status, ownerId, parkingSlotId]
        );

        // Link parking slot back to unit
        if (parkingSlotId) {
          await pool.query(
            'UPDATE parking_management SET unit_id = ? WHERE id = ?',
            [result.insertId, parkingSlotId]
          );
        }
      }
    }
    console.log('  60 units created (20 per block for Blocks A, B, C).');

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
      const homeownerId  = insertedUsersByRole['homeowner'];
      const staffId      = insertedUsersByRole['staff'];

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
      const adminId = insertedUsersByRole['admin'];
      await pool.query(`
        INSERT INTO notices (notice_id, title, content, category, created_by, created_at, expiry_date, priority, audience, status) VALUES 
        ('NOT-2024-001', 'Water Maintenance Shutdown',  'Scheduled water supply shutdown for tank cleaning in Tower A & B.', 'Utility', ?, '2026-10-24', '2026-10-26', 'urgent', 'Tower A, B',    'published'),
        ('NOT-2024-005', 'Annual General Meeting 2026', 'Notice of the Annual General Meeting of the homeowner association.', 'Event',   ?, '2026-11-01', '2026-11-15', 'high',   'All Residents', 'scheduled'),
        ('NOT-2023-142', 'New Gym Equipment Arrival',   'Modern treadmill and weights added to the resident gym center.',    'Amenity', ?, '2026-09-15', '2026-09-30', 'low',    'Active Members','expired')
      `, [adminId, adminId, adminId]);
      console.log('  Notices seeded.');
    }

    // 10. Seed Complaints & Maintenance Requests (20 records)
    console.log('Seeding complaints & maintenance requests...');
    const [compCount] = await pool.query('SELECT COUNT(*) AS count FROM complaints');
    if (compCount[0].count === 0) {

      // Resolve user IDs we need for complaint submissions
      const adminId       = insertedUsersByEmail['admin@apartment.com'];
      const staffId       = insertedUsersByEmail['staff@apartment.com'];
      const staffSarahId  = insertedUsersByEmail['staff.sarah@apartment.com'];
      const maintAlexId   = insertedUsersByEmail['maint.alex@apartment.com'];
      const maintChiefId  = insertedUsersByEmail['maintenance@apartment.com'];

      // Resident IDs (homeowners & tenants who submit complaints)
      const r1  = insertedUsersByEmail['homeowner@apartment.com'];       // A01 owner
      const r2  = insertedUsersByEmail['owner.smith@apartment.com'];     // A02 owner
      const r3  = insertedUsersByEmail['owner.johnson@apartment.com'];   // A03 owner
      const r4  = insertedUsersByEmail['owner.williams@apartment.com'];  // A04 owner
      const r5  = insertedUsersByEmail['owner.brown@apartment.com'];     // B01 owner
      const r6  = insertedUsersByEmail['owner.jones@apartment.com'];     // B02 owner
      const r7  = insertedUsersByEmail['owner.garcia@apartment.com'];    // B03 owner
      const r8  = insertedUsersByEmail['owner.miller@apartment.com'];    // B04 owner
      const r9  = insertedUsersByEmail['owner.davis@apartment.com'];     // C01 owner
      const r10 = insertedUsersByEmail['owner.rodriguez@apartment.com']; // C02 owner
      const r11 = insertedUsersByEmail['owner.martinez@apartment.com'];  // C03 owner
      const r12 = insertedUsersByEmail['owner.hernandez@apartment.com']; // C04 owner
      const t1  = insertedUsersByEmail['tenant.wilson@apartment.com'];   // A01 tenant
      const t2  = insertedUsersByEmail['tenant.anderson@apartment.com']; // A02 tenant
      const t3  = insertedUsersByEmail['tenant.taylor@apartment.com'];   // A03 tenant
      const t4  = insertedUsersByEmail['tenant.thomas@apartment.com'];   // B01 tenant
      const t5  = insertedUsersByEmail['tenant.white@apartment.com'];    // B02 tenant
      const t6  = insertedUsersByEmail['tenant.harris@apartment.com'];   // C01 tenant
      const t7  = insertedUsersByEmail['tenant.martin@apartment.com'];   // C02 tenant

      // Helper – insert one complaint row
      const insertComplaint = (userId, category, subjectTitle, description, priority, status, assignedStaffId, createdAt) =>
        pool.query(
          `INSERT INTO complaints (user_id, category, subject_title, description, priority, status, assigned_staff_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, category, subjectTitle, description, priority, status, assignedStaffId || null, createdAt]
        );

      // ── 20 Seed Complaints ──────────────────────────────────────────────────
      await insertComplaint(r1,  'Plumbing',       'Burst Pipe in Bathroom',          'There is a burst pipe under the sink in the main bathroom causing water to flood the floor.', 'emergency', 'emergency',   maintAlexId,  '2026-07-01 08:15:00');
      await insertComplaint(t1,  'Electrical',     'Power Outage in Unit A01',         'The entire unit lost power after the last storm. Circuit breaker keeps tripping when reset.',  'high',      'in_progress', maintChiefId, '2026-07-03 10:30:00');
      await insertComplaint(r2,  'Elevator',       'Elevator Making Grinding Noise',   'The Block A elevator makes a loud grinding noise and shudders between floors 2 and 3.',       'high',      'in_progress', staffId,      '2026-07-05 14:00:00');
      await insertComplaint(t2,  'Noise',          'Late Night Noise from Neighbours', 'Loud music and parties every weekend past midnight from the unit directly above A02.',         'medium',    'pending',     null,         '2026-07-07 22:45:00');
      await insertComplaint(r3,  'Plumbing',       'Slow Draining Shower',            'Shower in master bathroom drains very slowly and causes standing water after 5 minutes.',      'low',       'resolved',    maintAlexId,  '2026-06-20 09:00:00');
      await insertComplaint(t3,  'HVAC',           'Air Conditioner Not Cooling',      'The split AC unit in the bedroom stopped producing cold air. Only blows warm air at full power.', 'high',   'resolved',    maintChiefId, '2026-06-22 13:30:00');
      await insertComplaint(r4,  'Security',       'Main Entrance Door Lock Broken',   'The electronic lock on the Block A main entrance does not latch properly. Anyone can push it open.', 'emergency', 'in_progress', staffSarahId, '2026-07-10 07:00:00');
      await insertComplaint(t4,  'Cleanliness',   'Garbage Chute Blocked on Floor 2', 'Garbage chute on floor 2 Block B is blocked causing odour and overflow onto the corridor.',  'medium',    'in_progress', staffSarahId, '2026-07-12 11:00:00');
      await insertComplaint(r5,  'Electrical',     'Corridor Lights Flickering',       'The hallway lights on floors 1 and 2 of Block B flicker constantly and turn off randomly.',   'medium',    'pending',     null,         '2026-07-14 16:20:00');
      await insertComplaint(r6,  'Plumbing',       'Water Pressure Too Low',           'Water pressure in Block B unit B02 is critically low, making showers nearly impossible.',     'medium',    'resolved',    maintAlexId,  '2026-06-28 08:45:00');
      await insertComplaint(t5,  'Pest Control',   'Cockroach Infestation in Kitchen', 'Large number of cockroaches seen in the kitchen and bathroom, likely from neighbouring units.', 'high',   'pending',     null,         '2026-07-15 19:00:00');
      await insertComplaint(r7,  'Structural',     'Ceiling Crack in Living Room',     'A visible crack has appeared across the living room ceiling stretching approximately 60 cm.',   'high',    'in_progress', maintChiefId, '2026-07-08 10:00:00');
      await insertComplaint(r8,  'HVAC',           'Ventilation Fan Not Working',      'The ventilation fan in the bathroom stopped working. There is now mould forming on the ceiling.', 'medium', 'resolved',  maintAlexId,  '2026-07-01 12:00:00');
      await insertComplaint(t6,  'Parking',        'Unauthorized Vehicle in My Slot',  'An unknown vehicle (plate WP-XYZ-9999) has been parked in my reserved slot P-C01 for 3 days.', 'medium', 'resolved',  staffId,      '2026-07-11 08:30:00');
      await insertComplaint(r9,  'Electrical',     'Power Socket Sparking',            'The power outlet near the kitchen counter in unit C01 is sparking when appliances are plugged in.', 'emergency', 'emergency', maintChiefId, '2026-07-16 06:50:00');
      await insertComplaint(t7,  'Noise',          'Construction Noise on Weekends',    'Loud drilling and hammering from a renovation in C05 continues on weekends from 7 AM.',        'low',       'pending',     null,         '2026-07-18 07:30:00');
      await insertComplaint(r10, 'Cleanliness',   'Swimming Pool Area Dirty',         'The pool area has not been cleaned for over a week. There is debris floating in the pool.',    'medium',    'in_progress', staffSarahId, '2026-07-17 09:00:00');
      await insertComplaint(r11, 'Internet',       'Common Area WiFi Down',            'The shared WiFi in the lobby and business center has been down for 48 hours with no response.', 'low',      'pending',     null,         '2026-07-19 14:00:00');
      await insertComplaint(r12, 'Structural',     'Balcony Railing Loose',            'The metal railing on the balcony of unit C04 is loose and wobbles. It is a safety hazard.',   'high',      'in_progress', maintChiefId, '2026-07-13 15:45:00');
      await insertComplaint(t1,  'Lift',           'Lift Doors Not Closing Properly',  'The Block A lift doors take over 30 seconds to close and sometimes reopen without being triggered.', 'medium', 'resolved', maintAlexId, '2026-07-06 17:00:00');

      console.log('  20 complaints & maintenance requests seeded.');
    } else {
      console.log(`  Skipped complaints seeding (${compCount[0].count} records already exist).`);
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
