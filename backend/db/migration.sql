-- Create Database if not exists
CREATE DATABASE IF NOT EXISTS apartment_management_system;
USE apartment_management_system;

-- Disable foreign key checks temporarily to handle drops if needed
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS bills;
DROP TABLE IF EXISTS notices;
DROP TABLE IF EXISTS facility_reservations;
DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS units;
DROP TABLE IF EXISTS parking_management;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Create users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff', 'maintenance', 'homeowner', 'tenant') NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'suspended') DEFAULT 'pending',
    owner_id INT NULL,
    owner_approved TINYINT(1) DEFAULT 0,
    full_name VARCHAR(255) NULL,
    nic_or_passport VARCHAR(100) NULL,
    phone_number VARCHAR(100) NULL,
    building_name VARCHAR(100) NULL,
    unit_number VARCHAR(100) NULL,
    vehicle_number VARCHAR(100) NULL,
    relationship_to_owner VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 2. Create units table (without parking_slot_id foreign key first)
CREATE TABLE units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    block_name VARCHAR(50) NOT NULL,
    floor_number INT NOT NULL,
    unit_number VARCHAR(50) NOT NULL,
    owner_id INT NULL,
    tenant_id INT NULL,
    parking_slot_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_block_floor_unit (block_name, floor_number, unit_number),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Create parking_management table
CREATE TABLE parking_management (
    id INT AUTO_INCREMENT PRIMARY KEY,
    unit_id INT NULL,
    slot_number VARCHAR(50) UNIQUE NOT NULL,
    type ENUM('permanent', 'guest') NOT NULL,
    guest_date DATE NULL,
    status ENUM('active', 'pending', 'approved', 'rejected') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
);

-- 4. Alter units table to add foreign key constraint for parking_slot_id
ALTER TABLE units 
ADD CONSTRAINT fk_unit_parking 
FOREIGN KEY (parking_slot_id) REFERENCES parking_management(id) ON DELETE SET NULL;

-- 5. Create complaints table
CREATE TABLE complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
    status ENUM('pending', 'in_progress', 'resolved') DEFAULT 'pending',
    assigned_staff_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_staff_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 6. Create facility_reservations table
CREATE TABLE facility_reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    facility_name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Create notices table
CREATE TABLE notices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. Create bills table
CREATE TABLE bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    unit_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('unpaid', 'paid') DEFAULT 'unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
);
