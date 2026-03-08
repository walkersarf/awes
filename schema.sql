-- AW Engineering Solution - PMS Database Schema
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS company_settings (
    id INT PRIMARY KEY DEFAULT 1,
    data JSON NOT NULL
);

DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    data JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    clientName VARCHAR(255),
    data JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS leads (
    id VARCHAR(50) PRIMARY KEY,
    clientName VARCHAR(255) NOT NULL,
    data JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(50) PRIMARY KEY,
    projectId VARCHAR(50),
    data JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(50) PRIMARY KEY,
    projectId VARCHAR(50),
    data JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    data JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS contractors (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    data JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS partner_orders (
    id VARCHAR(50) PRIMARY KEY,
    partnerId VARCHAR(50),
    projectId VARCHAR(50),
    data JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS deliveries (
    id VARCHAR(50) PRIMARY KEY,
    projectId VARCHAR(50),
    data JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    data JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS product_list (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS roles_list (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS capacity_list (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS floor_list (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

-- Initial Admin User
INSERT IGNORE INTO users (id, data) 
VALUES ('u1', '{"name": "Administrator", "username": "admin", "role": "ADMIN", "avatarInitials": "AD", "isApproved": true, "password": "admin123", "email": "admin@aw.com"}');

-- Initial Lists
INSERT IGNORE INTO roles_list (name) VALUES ('ADMIN'), ('PROJECT_MANAGER'), ('ACCOUNTANT'), ('SERVICE_ENGINEER');
INSERT IGNORE INTO product_list (name) VALUES ('Traction Motor'), ('Guide Rails'), ('Steel Wire Rope'), ('Cabin Assembly'), ('Control Panel'), ('Door Operator'), ('Landing Door'), ('LOP & COP'), ('Traveling Cable'), ('Safety Gear');

SET FOREIGN_KEY_CHECKS = 1;
