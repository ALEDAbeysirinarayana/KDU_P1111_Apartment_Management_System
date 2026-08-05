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

    // ── PATCH: users.sub_role – staff sub-role column ────────────────────────
    console.log('[Patch] Adding users.sub_role column...');
    try {
      await pool.query(
        `ALTER TABLE users ADD COLUMN sub_role VARCHAR(50) NULL DEFAULT NULL AFTER role`
      );
      console.log('  users.sub_role column added.');
    } catch (e) {
      console.log('  users.sub_role already exists (skipping).');
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
      { email: 'homeowner@apartment.com',   password: 'OwnerPass123!',       role: 'homeowner',   status: 'approved', fullName: 'Amila Perera', building: 'Block A', unit: 'A01', phone: '+94 77 301 0001', nic: 'NIC882001001V', vehicle: 'WP-CAB-1001' },

      // 20 Additional Seed Users
      // Additional Staff & Maintenance
      { email: 'staff.sarah@apartment.com', password: 'StaffPass123!',       role: 'staff',       status: 'approved', fullName: 'Kumari Silva', phone: '+94 77 111 2233' },
      { email: 'maint.alex@apartment.com',  password: 'MaintenancePass123!', role: 'maintenance', status: 'approved', fullName: 'Sunil Wickramasinghe', phone: '+94 77 222 3344' },

      // Additional Homeowners (11)
      { email: 'owner.smith@apartment.com',     password: 'OwnerPass123!', role: 'homeowner', status: 'approved', fullName: 'Dilani Fernando',       building: 'Block A', unit: 'A02', phone: '+94 77 301 0002', nic: 'NIC882001002V', vehicle: 'WP-CAB-1002' },
      { email: 'owner.johnson@apartment.com',   password: 'OwnerPass123!', role: 'homeowner', status: 'approved', fullName: 'Nuwan Rathnayake',   building: 'Block A', unit: 'A03', phone: '+94 77 301 0003', nic: 'NIC882001003V', vehicle: 'WP-CAB-1003' },
      { email: 'owner.williams@apartment.com',  password: 'OwnerPass123!', role: 'homeowner', status: 'approved', fullName: 'Chamari Weerasinghe',   building: 'Block A', unit: 'A04', phone: '+94 77 301 0004', nic: 'NIC882001004V', vehicle: 'WP-CAB-1004' },
      { email: 'owner.brown@apartment.com',     password: 'OwnerPass123!', role: 'homeowner', status: 'approved', fullName: 'Gamini Perera',    building: 'Block B', unit: 'B01', phone: '+94 77 302 0001', nic: 'NIC882002001V', vehicle: 'WP-CAB-2001' },
      { email: 'owner.jones@apartment.com',     password: 'OwnerPass123!', role: 'homeowner', status: 'approved', fullName: 'Nilanthi Silva',    building: 'Block B', unit: 'B02', phone: '+94 77 302 0002', nic: 'NIC882002002V', vehicle: 'WP-CAB-2002' },
      { email: 'owner.garcia@apartment.com',    password: 'OwnerPass123!', role: 'homeowner', status: 'approved', fullName: 'Sampath Jayawardena',    building: 'Block B', unit: 'B03', phone: '+94 77 302 0003', nic: 'NIC882002003V', vehicle: 'WP-CAB-2003' },
      { email: 'owner.miller@apartment.com',    password: 'OwnerPass123!', role: 'homeowner', status: 'approved', fullName: 'Anoma Bandara',     building: 'Block B', unit: 'B04', phone: '+94 77 302 0004', nic: 'NIC882002004V', vehicle: 'WP-CAB-2004' },
      { email: 'owner.davis@apartment.com',     password: 'OwnerPass123!', role: 'homeowner', status: 'approved', fullName: 'Lasantha Kumara',     building: 'Block C', unit: 'C01', phone: '+94 77 303 0001', nic: 'NIC882003001V', vehicle: 'WP-CAB-3001' },
      { email: 'owner.rodriguez@apartment.com', password: 'OwnerPass123!', role: 'homeowner', status: 'approved', fullName: 'Kanthi Jayasinghe',  building: 'Block C', unit: 'C02', phone: '+94 77 303 0002', nic: 'NIC882003002V', vehicle: 'WP-CAB-3002' },
      { email: 'owner.martinez@apartment.com',  password: 'OwnerPass123!', role: 'homeowner', status: 'approved', fullName: 'Ranjith Mendis',  building: 'Block C', unit: 'C03', phone: '+94 77 303 0003', nic: 'NIC882003003V', vehicle: 'WP-CAB-3003' },
      { email: 'owner.hernandez@apartment.com', password: 'OwnerPass123!', role: 'homeowner', status: 'approved', fullName: 'Dammika Rajapaksa',  building: 'Block C', unit: 'C04', phone: '+94 77 303 0004', nic: 'NIC882003004V', vehicle: 'WP-CAB-3004' },

      // Additional Tenants (7)
      { email: 'tenant.wilson@apartment.com',   password: 'TenantPass123!', role: 'tenant', status: 'approved', fullName: 'Chandana Kumara',     building: 'Block A', unit: 'A01', ownerEmail: 'homeowner@apartment.com',       relationship: 'Primary Tenant', phone: '+94 77 401 0001', nic: 'NIC991001001V' },
      { email: 'tenant.anderson@apartment.com', password: 'TenantPass123!', role: 'tenant', status: 'approved', fullName: 'Samanthi Weerakoon',  building: 'Block A', unit: 'A02', ownerEmail: 'owner.smith@apartment.com',     relationship: 'Tenant',         phone: '+94 77 401 0002', nic: 'NIC991001002V' },
      { email: 'tenant.taylor@apartment.com',   password: 'TenantPass123!', role: 'tenant', status: 'approved', fullName: 'Ruwan Dias',     building: 'Block A', unit: 'A03', ownerEmail: 'owner.johnson@apartment.com',   relationship: 'Family Member',  phone: '+94 77 401 0003', nic: 'NIC991001003V' },
      { email: 'tenant.thomas@apartment.com',   password: 'TenantPass123!', role: 'tenant', status: 'approved', fullName: 'Nalin Gunasekara',  building: 'Block B', unit: 'B01', ownerEmail: 'owner.brown@apartment.com',     relationship: 'Tenant',         phone: '+94 77 402 0001', nic: 'NIC991002001V' },
      { email: 'tenant.white@apartment.com',    password: 'TenantPass123!', role: 'tenant', status: 'approved', fullName: 'Dinesh Perera',    building: 'Block B', unit: 'B02', ownerEmail: 'owner.jones@apartment.com',     relationship: 'Roommate',       phone: '+94 77 402 0002', nic: 'NIC991002002V' },
      { email: 'tenant.harris@apartment.com',   password: 'TenantPass123!', role: 'tenant', status: 'approved', fullName: 'Jagath Wickramasinghe',   building: 'Block C', unit: 'C01', ownerEmail: 'owner.davis@apartment.com',     relationship: 'Tenant',         phone: '+94 77 403 0001', nic: 'NIC991003001V' },
      { email: 'tenant.martin@apartment.com',   password: 'TenantPass123!', role: 'tenant', status: 'approved', fullName: 'Sumithra Jayawardena',   building: 'Block C', unit: 'C02', ownerEmail: 'owner.rodriguez@apartment.com', relationship: 'Tenant',         phone: '+94 77 403 0002', nic: 'NIC991003002V' },

      // 10 Pending User Registrations (Awaiting Admin / Staff Approval)
      // Pending Homeowners (5)
      { email: 'pending.owner1@apartment.com', password: 'OwnerPass123!', role: 'homeowner', status: 'pending', fullName: 'Mahesh Weerasinghe', building: 'Block A', unit: 'A05', phone: '+94 77 501 0001', nic: 'NIC992001001V', vehicle: 'WP-CAB-5001' },
      { email: 'pending.owner2@apartment.com', password: 'OwnerPass123!', role: 'homeowner', status: 'pending', fullName: 'Kamala Perera',    building: 'Block A', unit: 'A06', phone: '+94 77 501 0002', nic: 'NIC992001002V', vehicle: 'WP-CAB-5002' },
      { email: 'pending.owner3@apartment.com', password: 'OwnerPass123!', role: 'homeowner', status: 'pending', fullName: 'Piyal Samarasinghe',    building: 'Block B', unit: 'B05', phone: '+94 77 502 0001', nic: 'NIC992002001V', vehicle: 'WP-CAB-5003' },
      { email: 'pending.owner4@apartment.com', password: 'OwnerPass123!', role: 'homeowner', status: 'pending', fullName: 'Nadeeka Bandara',   building: 'Block B', unit: 'B06', phone: '+94 77 502 0002', nic: 'NIC992002002V', vehicle: 'WP-CAB-5004' },
      { email: 'pending.owner5@apartment.com', password: 'OwnerPass123!', role: 'homeowner', status: 'pending', fullName: 'Chandrika Silva',       building: 'Block C', unit: 'C05', phone: '+94 77 503 0001', nic: 'NIC992003001V', vehicle: 'WP-CAB-5005' },

      // Pending Tenants (5)
      { email: 'pending.tenant1@apartment.com', password: 'TenantPass123!', role: 'tenant', status: 'pending', fullName: 'Sarath Gunasekara',       building: 'Block A', unit: 'A04', ownerEmail: 'owner.williams@apartment.com',  relationship: 'Tenant',        phone: '+94 77 601 0001', nic: 'NIC993001001V' },
      { email: 'pending.tenant2@apartment.com', password: 'TenantPass123!', role: 'tenant', status: 'pending', fullName: 'Menaka Jayawardena',     building: 'Block B', unit: 'B03', ownerEmail: 'owner.garcia@apartment.com',    relationship: 'Tenant',        phone: '+94 77 602 0001', nic: 'NIC993002001V' },
      { email: 'pending.tenant3@apartment.com', password: 'TenantPass123!', role: 'tenant', status: 'pending', fullName: 'Sujeewa Rathnayake', building: 'Block B', unit: 'B04', ownerEmail: 'owner.miller@apartment.com',     relationship: 'Roommate',      phone: '+94 77 602 0002', nic: 'NIC993002002V' },
      { email: 'pending.tenant4@apartment.com', password: 'TenantPass123!', role: 'tenant', status: 'pending', fullName: 'Lalith Kumara',      building: 'Block C', unit: 'C03', ownerEmail: 'owner.martinez@apartment.com', relationship: 'Tenant',        phone: '+94 77 603 0001', nic: 'NIC993003001V' },
      { email: 'pending.tenant5@apartment.com', password: 'TenantPass123!', role: 'tenant', status: 'pending', fullName: 'Kusum Fernando',   building: 'Block C', unit: 'C04', ownerEmail: 'owner.hernandez@apartment.com',relationship: 'Family Member', phone: '+94 77 603 0002', nic: 'NIC993003002V' }
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

    // 9. Seed Notices (15 records across all categories, priorities & statuses)
    console.log('Seeding notices...');
    const [noticeCount] = await pool.query('SELECT COUNT(*) AS count FROM notices');
    if (noticeCount[0].count === 0) {
      const adminId = insertedUsersByRole['admin'];
      const staffId = insertedUsersByRole['staff'];

      const notices = [
        // notice_id, title, content, category, created_by, created_at, expiry_date, priority, audience, status
        ['NOT-2024-001', 'Water Maintenance Shutdown',
          'Scheduled water supply shutdown for tank cleaning in Block A & B. Residents are advised to store water in advance. The maintenance will last from 9:00 AM to 3:00 PM.',
          'Utility', adminId, '2026-10-24', '2026-10-26', 'urgent', 'Block A, B', 'published'],

        ['NOT-2024-002', 'CCTV System Upgrade – Temporary Blind Spots',
          'Security cameras in the lobby, stairwells, and parking areas will be temporarily offline during the CCTV upgrade from October 28 to 30. Please report any incidents to the security desk directly.',
          'Security', adminId, '2026-10-25', '2026-10-31', 'high', 'All Residents', 'published'],

        ['NOT-2024-003', 'Elevator Maintenance – Block B',
          'The main elevator in Block B will be undergoing routine maintenance on November 2nd between 10:00 AM and 2:00 PM. Only the staircase will be accessible. We apologise for the inconvenience.',
          'Maintenance', staffId, '2026-10-28', '2026-11-02', 'medium', 'Block B', 'published'],

        ['NOT-2024-004', 'Halloween Community Party',
          'You are invited to the KDU Apartment Halloween Community Party on October 31st at 7:00 PM on the rooftop. Costumes are encouraged! Light refreshments will be served. RSVP at the management office.',
          'Event', adminId, '2026-10-27', '2026-11-01', 'low', 'All Residents', 'published'],

        ['NOT-2024-005', 'Annual General Meeting 2026',
          'Notice of the Annual General Meeting of the Homeowner Association. Agenda includes budget review, election of committee members, and proposed by-law amendments. All homeowners are required to attend.',
          'Event', adminId, '2026-11-01', '2026-11-15', 'high', 'Homeowners', 'scheduled'],

        ['NOT-2024-006', 'Fire Safety Drill – All Blocks',
          'A mandatory fire safety drill will be conducted on November 20th at 2:00 PM. All residents must evacuate via designated routes. The drill will last approximately 30 minutes. Please do not use elevators.',
          'Safety', adminId, '2026-11-05', '2026-11-20', 'urgent', 'All Residents', 'scheduled'],

        ['NOT-2024-007', 'Gym Equipment Upgrade',
          'New treadmills, resistance machines, and free weights have been installed in the Resident Gym (FAC-004). The gym will reopen on November 10th after floor resurfacing. Thank you for your patience.',
          'Amenity', staffId, '2026-11-07', '2026-11-30', 'low', 'All Residents', 'published'],

        ['NOT-2024-008', 'Revised Guest Parking Policy',
          'Effective December 1st, visitor parking requests must be submitted at least 24 hours in advance via the resident portal. Walk-in guest parking will no longer be permitted without prior approval.',
          'Policy', adminId, '2026-11-10', '2026-12-31', 'high', 'All Residents', 'published'],

        ['NOT-2024-009', 'Pest Control Treatment – Block C',
          'A professional pest control treatment will be carried out in Block C on November 15th between 8:00 AM and 12:00 PM. All residents in Block C must vacate their units during this period.',
          'Maintenance', staffId, '2026-11-11', '2026-11-16', 'high', 'Block C', 'scheduled'],

        ['NOT-2024-010', 'New Year Rooftop Celebration',
          'Ring in 2027 with your neighbours! The New Year Rooftop Celebration will be held on December 31st starting at 8:00 PM. Entry is free for all registered residents. Guest passes available at reception.',
          'Event', adminId, '2026-11-20', '2027-01-01', 'medium', 'All Residents', 'scheduled'],

        ['NOT-2024-011', 'Parking Lot Repainting – Block A',
          'The parking lot lines and numbering in Block A will be repainted on November 18th. Vehicles must be moved by 7:00 AM. Vehicles not moved will be towed at the owner\'s expense.',
          'Utility', staffId, '2026-11-14', '2026-11-18', 'medium', 'Block A', 'published'],

        ['NOT-2024-012', 'Swimming Pool Temporarily Closed',
          'The Main Swimming Pool (FAC-001) is temporarily closed for annual servicing and chemical balancing. Expected reopening is November 25th. The children\'s wading pool remains open.',
          'Amenity', adminId, '2026-11-18', '2026-11-25', 'medium', 'All Residents', 'published'],

        ['NOT-2023-142', 'New Gym Equipment Arrival',
          'Modern treadmill and weights added to the resident gym center. The gym is now open 24 hours for all approved residents.',
          'Amenity', adminId, '2026-09-15', '2026-09-30', 'low', 'Active Members', 'expired'],

        ['NOT-2023-101', 'Community Clean-Up Day – September',
          'Residents are invited to participate in the Community Clean-Up Day on September 5th at 9:00 AM. Gloves and cleaning supplies will be provided. Refreshments will be served after the event.',
          'Event', staffId, '2026-08-25', '2026-09-05', 'low', 'All Residents', 'expired'],

        ['NOT-2023-088', 'Internet Outage – Resolved',
          'The internet outage affecting common areas and select units between August 10–12 has been fully resolved. A new fibre line has been installed. Please contact management if you are still experiencing issues.',
          'Utility', adminId, '2026-08-12', '2026-08-20', 'medium', 'All Residents', 'archived'],
      ];

      for (const [noticeId, title, content, category, createdBy, createdAt, expiryDate, priority, audience, status] of notices) {
        await pool.query(
          `INSERT INTO notices (notice_id, title, content, category, created_by, created_at, expiry_date, priority, audience, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [noticeId, title, content, category, createdBy, createdAt, expiryDate, priority, audience, status]
        );
      }
      console.log('  15 notices seeded.');
    } else {
      console.log(`  Skipped notices seeding (${noticeCount[0].count} already exist).`);
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

    // 11. Seed Additional Facilities (5 more → total 8)
    console.log('Seeding additional facilities...');
    const [facCount2] = await pool.query('SELECT COUNT(*) AS count FROM facilities');
    if (facCount2[0].count <= 3) {
      await pool.query(`
        INSERT INTO facilities (facility_id, name, description, capacity, status) VALUES
        ('FAC-004', 'Resident Gym',          'Fully equipped fitness center with cardio & free weights',  30, 'available'),
        ('FAC-005', 'Multipurpose Hall',     'Spacious hall for events, parties, and gatherings',         80, 'available'),
        ('FAC-006', 'Kids Play Area',        'Safe indoor play zone with toys and foam flooring',         20, 'available'),
        ('FAC-007', 'Sauna & Steam Room',    'Relaxing sauna and steam room for residents',               8,  'maintenance'),
        ('FAC-008', 'Tennis Court',          'Hard-surface tennis court with floodlighting for night play', 4, 'available')
      `);
      console.log('  5 additional facilities seeded (total 8).');
    } else {
      console.log(`  Skipped extra facilities (already ${facCount2[0].count} records).`);
    }

    // 12. Seed Facility Reservation Requests (10 records)
    console.log('Seeding facility reservation requests...');
    const [frCount] = await pool.query('SELECT COUNT(*) AS count FROM facility_reservations');
    if (frCount[0].count === 0) {
      const fr = [
        // [user_email, facility_name, date, purpose, participants, notes, time_slot, status]
        ['homeowner@apartment.com',        'Main Swimming Pool',  '2026-08-10', 'Family swimming session',       4,  'Please keep lane 2 free.',          '08:00 AM – 10:00 AM', 'approved'],
        ['tenant.wilson@apartment.com',    'Resident Gym',        '2026-08-11', 'Personal workout',              1,  null,                                 '06:00 AM – 07:30 AM', 'approved'],
        ['owner.smith@apartment.com',      'Multipurpose Hall',   '2026-08-15', 'Birthday party for 50 guests', 50,  'Need tables and chairs arranged.',   '05:00 PM – 09:00 PM', 'pending'],
        ['owner.johnson@apartment.com',    'Business Center',     '2026-08-16', 'Client presentation meeting',    8,  'Projector needed.',                  '10:00 AM – 12:00 PM', 'pending'],
        ['tenant.anderson@apartment.com',  'Kids Play Area',      '2026-08-12', 'Playdate for kids',             10,  'Kids age 3–8.',                      '02:00 PM – 04:00 PM', 'approved'],
        ['owner.brown@apartment.com',      'Tennis Court',        '2026-08-14', 'Friendly match',                 4,  null,                                 '07:00 AM – 09:00 AM', 'approved'],
        ['owner.garcia@apartment.com',     'Multipurpose Hall',   '2026-08-20', 'Monthly homeowners meeting',    30,  'Microphone and PA system required.', '06:00 PM – 08:00 PM', 'pending'],
        ['tenant.taylor@apartment.com',    'Sauna & Steam Room',  '2026-08-13', 'Relaxation session',             2,  null,                                 '04:00 PM – 05:30 PM', 'rejected'],
        ['owner.jones@apartment.com',      'Main Swimming Pool',  '2026-08-18', 'Swimming lessons for children',  6,  'Children aged 5–12.',                '09:00 AM – 11:00 AM', 'pending'],
        ['owner.miller@apartment.com',     'Resident Gym',        '2026-08-09', 'Group workout session',          5,  'Yoga mats needed.',                  '05:30 AM – 07:00 AM', 'rejected'],
      ];

      for (const [email, facility, date, purpose, participants, notes, timeSlot, status] of fr) {
        const uid = insertedUsersByEmail[email];
        if (uid) {
          await pool.query(
            `INSERT INTO facility_reservations (user_id, facility_name, date, purpose, participants, notes, time_slot, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [uid, facility, date, purpose, participants, notes, timeSlot, status]
          );
        }
      }
      console.log('  10 facility reservation requests seeded.');
    } else {
      console.log(`  Skipped facility reservations (${frCount[0].count} already exist).`);
    }

    // 13. Seed Visitor / Guest Parking Booking Requests (10 records)
    console.log('Seeding visitor parking booking requests...');
    // Fetch unit IDs for resident emails we'll use
    const [unitRows] = await pool.query(`
      SELECT u.id AS unit_id, u.unit_number, u.owner_id, u.tenant_id
      FROM units u
    `);
    const unitByNumber = {};
    for (const row of unitRows) unitByNumber[row.unit_number] = row.unit_id;

    const guestParkingCount = await pool.query('SELECT COUNT(*) AS count FROM parking_management WHERE type = "guest" AND visitor_name IS NOT NULL');
    if (guestParkingCount[0][0].count === 0) {
      const guestBookings = [
        // [unit_number, slot_number, guest_date, visitor_name, visitor_vehicle, arrival_time, reason, status]
        ['A01', 'G-001', '2026-08-10', 'Sunil Perera',      'WP-JKL-1234', '09:00 AM', 'Parent visiting for the weekend',       'approved'],
        ['A02', 'G-002', '2026-08-11', 'Chandrika Weerasinghe',      'CP-MNO-5678', '10:30 AM', 'Friend visiting for a day trip',         'approved'],
        ['A03', 'G-003', '2026-08-12', 'Gamini Fernando',       'NW-PQR-9012', '08:00 AM', 'Service technician – appliance repair',  'pending'],
        ['B01', 'G-004', '2026-08-13', 'Menaka Jayawardena',      'WP-STU-3456', '11:00 AM', 'Relative staying for 2 nights',          'pending'],
        ['B02', 'G-005', '2026-08-14', 'Dilani Silva',      'CP-VWX-7890', '02:00 PM', 'Friend attending a birthday party',      'approved'],
        ['B03', 'G-006', '2026-08-15', 'Lalith Kumara',         'WP-YZA-1122', '12:00 PM', 'Doctor home visit',                      'pending'],
        ['B04', 'G-001', '2026-08-17', 'Ruwan Wickramasinghe',        'NW-BCD-3344', '04:00 PM', 'Moving furniture assistance',            'approved'],
        ['C01', 'G-002', '2026-08-18', 'Samanthi Perera',      'WP-EFG-5566', '09:30 AM', 'Catering for a private dinner',          'rejected'],
        ['C02', 'G-003', '2026-08-19', 'Nalin Bandara',    'CP-HIJ-7788', '01:00 PM', 'Tutor visiting for weekly lesson',       'pending'],
        ['C03', 'G-004', '2026-08-20', 'Nilanthi Fernando',      'WP-KLM-9900', '03:00 PM', 'Courier delivery – large parcels',      'pending'],
      ];

      for (const [unitNum, slot, gDate, vName, vVehicle, arrTime, reason, status] of guestBookings) {
        const unitId = unitByNumber[unitNum];
        if (unitId) {
          await pool.query(
            `INSERT INTO parking_management (unit_id, slot_number, type, guest_date, visitor_name, visitor_vehicle, arrival_time, reason, status)
             VALUES (?, ?, 'guest', ?, ?, ?, ?, ?, ?)`,
            [unitId, slot, gDate, vName, vVehicle, arrTime, reason, status]
          );
        }
      }
      console.log('  10 visitor parking booking requests seeded.');
    } else {
      console.log(`  Skipped visitor parking (already ${guestParkingCount[0][0].count} guest records).`);
    }

    // 14. Seed Bills & Payment Transactions (25 invoices + transactions)
    console.log('Seeding bills & payment transactions...');
    const [billCount] = await pool.query('SELECT COUNT(*) AS count FROM bills');
    if (billCount[0].count === 0) {

      // Build unit_id lookup from unit_number
      const [allUnits] = await pool.query('SELECT id, unit_number, owner_id, tenant_id FROM units');
      const unitIdMap   = {};   // unit_number → unit db id
      const unitUserMap = {};   // unit_number → resident user id (owner or tenant)
      for (const u of allUnits) {
        unitIdMap[u.unit_number]   = u.id;
        unitUserMap[u.unit_number] = u.tenant_id || u.owner_id;
      }

      // Bills data: [unit_number, amount, description, due_date, status, payment_method, paid_at]
      const bills = [
        // ── Fully PAID bills (historical – feed the monthly chart) ──────────
        ['A01', 18500, 'Monthly Maintenance Fee – March 2026',      '2026-03-05', 'paid', 'Bank Transfer',   '2026-03-04'],
        ['A02', 18500, 'Monthly Maintenance Fee – March 2026',      '2026-03-05', 'paid', 'Online Payment',  '2026-03-05'],
        ['A03', 18500, 'Monthly Maintenance Fee – April 2026',      '2026-04-05', 'paid', 'Card',            '2026-04-03'],
        ['B01', 19500, 'Monthly Maintenance Fee – April 2026',      '2026-04-05', 'paid', 'Bank Transfer',   '2026-04-05'],
        ['B02', 19500, 'Monthly Maintenance Fee – May 2026',        '2026-05-05', 'paid', 'Online Payment',  '2026-05-04'],
        ['C01', 21000, 'Monthly Maintenance Fee – May 2026',        '2026-05-05', 'paid', 'Card',            '2026-05-05'],
        ['A01', 18500, 'Monthly Maintenance Fee – June 2026',       '2026-06-05', 'paid', 'Bank Transfer',   '2026-06-04'],
        ['A02', 18500, 'Monthly Maintenance Fee – June 2026',       '2026-06-05', 'paid', 'Online Payment',  '2026-06-05'],
        ['B03', 19500, 'Monthly Maintenance Fee – June 2026',       '2026-06-05', 'paid', 'Cash',            '2026-06-03'],
        ['C02', 21000, 'Monthly Maintenance Fee – July 2026',       '2026-07-05', 'paid', 'Bank Transfer',   '2026-07-04'],
        ['A03', 18500, 'Monthly Maintenance Fee – July 2026',       '2026-07-05', 'paid', 'Card',            '2026-07-05'],
        ['B01', 19500, 'Monthly Maintenance Fee – July 2026',       '2026-07-05', 'paid', 'Online Payment',  '2026-07-03'],
        ['A01', 3500,  'Water Usage Surcharge – Q2 2026',           '2026-07-15', 'paid', 'Bank Transfer',   '2026-07-14'],
        ['B02', 4200,  'AC Servicing & Deep Cleaning – Unit B02',   '2026-07-20', 'paid', 'Online Payment',  '2026-07-19'],
        ['C03', 6500,  'Balcony Repair & Waterproofing – C03',      '2026-07-25', 'paid', 'Bank Transfer',   '2026-07-24'],

        // ── UNPAID – current month (not yet overdue) ────────────────────────
        ['A01', 18500, 'Monthly Maintenance Fee – August 2026',     '2026-08-10', 'unpaid', 'Bank Transfer',  null],
        ['A02', 18500, 'Monthly Maintenance Fee – August 2026',     '2026-08-10', 'unpaid', 'Bank Transfer',  null],
        ['B01', 19500, 'Monthly Maintenance Fee – August 2026',     '2026-08-10', 'unpaid', 'Bank Transfer',  null],
        ['C01', 21000, 'Monthly Maintenance Fee – August 2026',     '2026-08-10', 'unpaid', 'Bank Transfer',  null],
        ['C04', 21000, 'Monthly Maintenance Fee – August 2026',     '2026-08-10', 'unpaid', 'Bank Transfer',  null],

        // ── OVERDUE bills (past due_date, still unpaid) ──────────────────────
        ['B04', 19500, 'Monthly Maintenance Fee – June 2026',       '2026-06-05', 'unpaid', 'Bank Transfer',  null],
        ['C02', 21000, 'Monthly Maintenance Fee – June 2026',       '2026-06-05', 'unpaid', 'Bank Transfer',  null],
        ['A04', 18500, 'Monthly Maintenance Fee – July 2026',       '2026-07-05', 'unpaid', 'Bank Transfer',  null],
        ['B03', 5800,  'Plumbing Repair – Burst Pipe Unit B03',     '2026-07-20', 'unpaid', 'Bank Transfer',  null],
        ['C03', 2500,  'Pest Control Treatment Fee – Block C',      '2026-07-28', 'unpaid', 'Bank Transfer',  null],
      ];

      const insertedBills = [];
      for (let i = 0; i < bills.length; i++) {
        const [unitNum, amount, description, dueDate, status, payMethod, paidAt] = bills[i];
        const unitId = unitIdMap[unitNum];
        if (!unitId) { console.log(`  Skipped – unit ${unitNum} not found`); continue; }

        const invId = `INV-${String(i + 1).padStart(4, '0')}`;
        const [res] = await pool.query(
          `INSERT INTO bills (invoice_id, unit_id, amount, description, due_date, status, payment_method, paid_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [invId, unitId, amount, description, dueDate, status, payMethod, paidAt || null]
        );
        insertedBills.push({ id: res.insertId, invId, unitNum, unitId, amount, status, payMethod, paidAt, description });
      }
      console.log(`  ${insertedBills.length} bills inserted.`);

      // Create payment_transactions for every paid bill
      const paidBills = insertedBills.filter(b => b.status === 'paid');
      for (let i = 0; i < paidBills.length; i++) {
        const b = paidBills[i];
        const userId = unitUserMap[b.unitNum];
        if (!userId) continue;
        const txId = `TRX-SEED-${String(i + 1).padStart(4, '0')}`;
        await pool.query(
          `INSERT IGNORE INTO payment_transactions
             (transaction_id, bill_id, unit_id, user_id, amount, method, status, notes, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 'successful', ?, ?)`,
          [txId, b.id, b.unitId, userId, b.amount, b.payMethod, `Seed payment for ${b.invId}`, b.paidAt + ' 10:00:00']
        );
      }
      console.log(`  ${paidBills.length} payment transactions inserted.`);
    } else {
      console.log(`  Skipped bills seeding (${billCount[0].count} already exist).`);
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
