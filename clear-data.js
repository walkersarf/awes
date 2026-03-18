const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_CONFIG = {
    host: 'localhost',
    user: 'awesbdco_pms',
    password: 'Minhaz@8528',
    database: 'awesbdco_pms'
};

const DB_JSON_PATH = path.join(__dirname, 'db.json');

const INITIAL_DB_JSON = {
  projects: [],
  leads: [],
  transactions: [],
  services: [],
  suppliers: [],
  contractors: [],
  partnerOrders: [],
  deliveries: [],
  users: [
    {
      id: "u1",
      name: "Administrator",
      username: "admin",
      role: "ADMIN",
      avatarInitials: "AD",
      isApproved: true,
      password: "admin123",
      email: "admin@aw.com"
    }
  ],
  productList: [
    "Traction Motor", "Guide Rails", "Steel Wire Rope", "Cabin Assembly", 
    "Control Panel", "Door Operator", "Landing Door", "LOP & COP", 
    "Traveling Cable", "Safety Gear"
  ],
  auditLogs: [],
  companySettings: {
    name: 'AW Engineering Solution',
    address: 'House #12, Road #4, Block-B, Banani, Dhaka-1213',
    phone: '+880 1700-000000',
    email: 'info@awengineering.com',
    website: 'www.awengineering.com',
    tagline: 'Professional Elevator & Escalator Services',
    invoicePrefix: 'INV',
    invoiceColor: '#10b981',
    printMargin: 'standard',
    invoiceFooter: 'Thank you for your business. Please make cheques payable to "AW Engineering Solution".'
  },
  rolesList: ["ADMIN", "PROJECT_MANAGER", "ACCOUNTANT", "SERVICE_ENGINEER"],
  capacityList: ["4 Person / 300 Kg", "6 Person / 450 Kg", "8 Person / 630 Kg", "10 Person / 800 Kg", "13 Person / 1000 Kg", "16 Person / 1250 Kg", "20 Person / 1600 Kg"],
  floorList: ["G+3", "G+4", "G+5", "G+6", "G+7", "G+8", "G+9", "G+10", "G+12", "G+15"]
};

async function clearData() {
    console.log("Starting data clearance process...");
    
    // 1. Reset db.json
    try {
        fs.writeFileSync(DB_JSON_PATH, JSON.stringify(INITIAL_DB_JSON, null, 2));
        console.log("SUCCESS: db.json has been reset to initial state.");
    } catch (err) {
        console.error("ERROR: Failed to reset db.json:", err.message);
    }

    // 2. Clear MySQL Tables
    let connection;
    try {
        connection = await mysql.createConnection(DB_CONFIG);
        console.log("Connected to MySQL database.");
        
        const tablesToClear = [
            '_projects', '_leads', '_transactions', '_services', 
            '_suppliers', '_contractors', '_partner_orders', '_deliveries', 
            '_audit_logs'
        ];

        for (const table of tablesToClear) {
            try {
                // Ignore foreign keys for truncation
                await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
                await connection.query(`TRUNCATE TABLE \`${table}\``);
                await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
                console.log(`- Truncated table: ${table}`);
            } catch (err) {
                console.log(`- Skipped table ${table} (might not exist): ${err.message}`);
            }
        }

        // Handle the users table separately to keep the 'admin'
        try {
            await connection.query("DELETE FROM `_users` WHERE JSON_EXTRACT(data, '$.username') != 'admin'");
            console.log(`- Cleared all non-admin users from _users table.`);
        } catch (err) {
            console.log(`- Error clearing users table: ${err.message}`);
        }

        console.log("SUCCESS: MySQL database has been cleared.");

    } catch (err) {
        console.error("ERROR: MySQL connection failed, assuming db.json only mode.", err.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
    
    console.log("Data clearance complete!");
}

clearData();
