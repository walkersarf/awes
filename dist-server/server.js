"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function () { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function (o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function (o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const promise_1 = __importDefault(require("mysql2/promise"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const archiver_1 = __importDefault(require("archiver"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const DB_FILE = path_1.default.resolve(__dirname, "..", "db.json");
// In production, __dirname is dist-server, so we need to go up one level for the 'dist' folder
const clientDistPath = path_1.default.resolve(__dirname, '..', 'dist');
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
// --- Initial Data Structure (for Fallback) ---
const INITIAL_DATA = {
    projects: [],
    leads: [],
    transactions: [],
    services: [],
    suppliers: [],
    contractors: [],
    partnerOrders: [],
    deliveries: [],
    users: [
        { id: 'u1', name: 'Administrator', username: 'admin', role: 'ADMIN', avatarInitials: 'AD', isApproved: true, password: 'admin123', email: 'admin@aw.com' },
        { id: 'u2', name: 'Project Manager', username: 'pm', role: 'PROJECT_MANAGER', avatarInitials: 'PM', isApproved: true, password: 'password123', email: 'pm@aw.com' },
        { id: 'u3', name: 'Accountant', username: 'acc', role: 'ACCOUNTANT', avatarInitials: 'AC', isApproved: true, password: 'password123', email: 'accounts@aw.com' },
        { id: 'u4', name: 'Engineer', username: 'eng', role: 'SERVICE_ENGINEER', avatarInitials: 'EN', isApproved: true, password: 'password123', email: 'engineer@aw.com' },
    ],
    productList: ["Traction Motor", "Guide Rails", "Steel Wire Rope", "Cabin Assembly", "Control Panel", "Door Operator", "Landing Door", "LOP & COP", "Traveling Cable", "Safety Gear"],
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
    rolesList: ['ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT', 'SERVICE_ENGINEER'],
    capacityList: ["4 Person / 300 Kg", "6 Person / 450 Kg", "8 Person / 630 Kg", "10 Person / 800 Kg", "13 Person / 1000 Kg", "16 Person / 1250 Kg", "20 Person / 1600 Kg"],
    floorList: ["G+3", "G+4", "G+5", "G+6", "G+7", "G+8", "G+9", "G+10", "G+12", "G+15"]
};
// --- JSON DB Helpers ---
function readJSON() {
    if (!fs_1.default.existsSync(DB_FILE)) {
        fs_1.default.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2));
        return INITIAL_DATA;
    }
    const data = fs_1.default.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
}
function writeJSON(data) {
    fs_1.default.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}
// --- Database Connection ---
let pool = null;
let useSQL = false;
const DEFAULT_MAJOR_COMPONENTS = [
    'Traction Motor / Machine',
    'Control Panel (ARD + Inverter)',
    'Cabin / Car Enclosure',
    'Door Header \u0026 Operator',
    'Main Guide Rails',
    'Counter Weight Frame',
    'Main Rope / Belt',
    'Traveling Cable'
];
async function initDB() {
    try {
        pool = promise_1.default.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 5,
            queueLimit: 0,
            connectTimeout: 2000
        });
        await pool.query('SELECT 1');
        useSQL = true;
        console.log("Connected to MySQL successfully.");
        // Robust Schema Check & Creation
        const tables = [
            'projects', 'leads', 'transactions', 'services', 'suppliers',
            'contractors', 'partner_orders', 'deliveries', 'users', 'audit_logs',
            'company_settings', 'roles_list', 'capacity_list', 'floor_list', 'product_list',
            'material_list', 'spec_list'
        ];
        for (const table of tables) {
            // Create table structure if missing
            if (table.endsWith('_list')) {
                await pool.query(`CREATE TABLE IF NOT EXISTS ${table} (name VARCHAR(100) PRIMARY KEY)`);
            }
            else if (table === 'company_settings') {
                await pool.query(`CREATE TABLE IF NOT EXISTS company_settings (id INT PRIMARY KEY, data JSON)`);
            }
            else {
                await pool.query(`CREATE TABLE IF NOT EXISTS ${table} (id VARCHAR(50) PRIMARY KEY, data JSON)`);
            }
            // Ensure specific columns exist for indexing/foreign keys/Approvals
            if (!table.endsWith('_list') && table !== 'company_settings' && table !== 'audit_logs') {
                try {
                    await pool.query(`ALTER TABLE ${table} ADD COLUMN isApproved TINYINT(1) DEFAULT 1`);
                }
                catch (e) { }
                try {
                    await pool.query(`ALTER TABLE ${table} ADD COLUMN pendingUpdate JSON`);
                }
                catch (e) { }
                try {
                    await pool.query(`ALTER TABLE ${table} ADD COLUMN pendingDelete TINYINT(1) DEFAULT 0`);
                }
                catch (e) { }
                try {
                    await pool.query(`ALTER TABLE ${table} ADD COLUMN createdBy VARCHAR(50)`);
                }
                catch (e) { }
            }
            if (table === 'leads') {
                try {
                    await pool.query(`ALTER TABLE leads ADD COLUMN clientName VARCHAR(255) AFTER id`);
                }
                catch (e) { }
            }
            if (table === 'projects') {
                try {
                    await pool.query(`ALTER TABLE projects ADD COLUMN name VARCHAR(255) AFTER id`);
                }
                catch (e) { }
                // Add status and progress columns for faster filtering if missing
                try {
                    await pool.query(`ALTER TABLE projects ADD COLUMN status VARCHAR(50)`);
                }
                catch (e) { }
                try {
                    await pool.query(`ALTER TABLE projects ADD COLUMN progress INT DEFAULT 0`);
                }
                catch (e) { }
            }
            if (['suppliers', 'contractors'].includes(table)) {
                try {
                    await pool.query(`ALTER TABLE ${table} ADD COLUMN name VARCHAR(255) AFTER id`);
                }
                catch (e) { }
            }
            if (table === 'transactions' || table === 'services' || table === 'deliveries' || table === 'partner_orders') {
                try {
                    await pool.query(`ALTER TABLE ${table} ADD COLUMN projectId VARCHAR(50) AFTER id`);
                }
                catch (e) { }
            }
            if (table === 'partner_orders') {
                try {
                    await pool.query(`ALTER TABLE partner_orders ADD COLUMN partnerId VARCHAR(50) AFTER id`);
                }
                catch (e) { }
                try {
                    const [cols] = await pool.query(`SHOW COLUMNS FROM partner_orders LIKE 'projectId'`);
                    if (cols.length === 0) {
                        await pool.query(`ALTER TABLE partner_orders ADD COLUMN projectId VARCHAR(50) AFTER partnerId`);
                    }
                }
                catch (e) { }
            }
        }
    }
    catch (err) {
        console.warn("MySQL connection failed. Falling back to JSON storage (db.json).");
        console.warn("Reason:", err.message);
        useSQL = false;
    }
}
// --- Nodemailer Setup ---
// Use cPanel SMTP settings for better reliability
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'mail.awesbd.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true, // true for port 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || 'pms@awesbd.com',
        pass: process.env.SMTP_PASS || 'Minhaz@8528'
    },
    tls: {
        rejectUnauthorized: false
    }
});
// In-memory store for password reset codes
// Format: { 'email': { code: '123456', expires: Date.now() + 15 mins } }
const resetCodes = {};

// --- Audit Log Helper ---
// Helper to get a short name for the entity
function buildAuditDescription(method, collection, body) {
    const name = body.name || body.clientName || body.userName || body.productName || body.title || body.subject || null;
    const entityLabel = collection.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
    if (method === 'POST') return name ? `Created new ${entityLabel}: "${name}"` : `Created new ${entityLabel} record`;
    if (method === 'PUT') return name ? `Updated ${entityLabel}: "${name}"` : `Updated ${entityLabel} record`;
    if (method === 'DELETE') return name ? `Deleted ${entityLabel}: "${name}"` : `Deleted ${entityLabel} record`;
    return `${method} on ${entityLabel}`;
}

async function getUserName(userId) {
    if (!userId || userId === 'SYSTEM') return 'System';
    try {
        if (useSQL) {
            const [rows] = await pool.query('SELECT data FROM users WHERE id = ?', [userId]);
            if (rows.length > 0) {
                const parsed = typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data;
                return parsed.name || parsed.username || userId;
            }
        } else {
            const db = readJSON();
            const user = (db.users || []).find(u => u.id === userId);
            if (user) return user.name || user.username || userId;
        }
    } catch (e) { /* fallback */ }
    return userId;
}

async function logAudit(userId, action, collection, recordId, description) {
    const logId = 'AL' + Date.now() + Math.floor(Math.random() * 1000);
    const userName = await getUserName(userId);
    const logData = {
        userId: userId || 'SYSTEM',
        userName,
        action,
        entity: collection,
        recordId,
        details: description,
        timestamp: new Date().toISOString()
    };
    try {
        if (useSQL) {
            await pool.query('INSERT INTO audit_logs (id, data) VALUES (?, ?)', [logId, JSON.stringify(logData)]);
        } else {
            const db = readJSON();
            if (!db.auditLogs) db.auditLogs = [];
            db.auditLogs.unshift({ id: logId, ...logData });
            // keep the last 2000 logs max
            if (db.auditLogs.length > 2000) db.auditLogs.pop();
            writeJSON(db);
        }
    } catch (e) {
        console.error("Failed to write audit log:", e);
    }
}

// --- Audit Log Middleware ---
app.use("/api", (req, res, next) => {
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        if (req.path.includes('/login') || req.path.includes('/password') || req.path.includes('/forgot') || req.path.includes('/reset')) {
            return next();
        }

        const originalJson = res.json;
        const originalSend = res.send;

        const userId = req.headers['x-user-id'] || 'SYSTEM';
        const methodToAction = { 'POST': 'CREATE', 'PUT': 'UPDATE', 'DELETE': 'DELETE' };
        const action = methodToAction[req.method] || req.method;
        const pathParts = req.path.split('/').filter(Boolean);
        const collection = pathParts[0] || 'unknown';
        const recordId = pathParts[1] || (req.body && req.body.id) || null;
        // Build a sanitised body for description (strip password)
        const safeBody = { ...req.body };
        if (safeBody.password) delete safeBody.password;
        const description = buildAuditDescription(req.method, collection, safeBody);

        res.json = function (body) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                logAudit(userId, action, collection, recordId, description);
            }
            return originalJson.call(this, body);
        };
        res.send = function (body) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                logAudit(userId, action, collection, recordId, description);
            }
            return originalSend.call(this, body);
        };
    }
    next();
});

// --- API Routes ---
// --- Authentication & Password Recovery ---
// 1. Request Password Reset
app.post("/api/forgot-password", async (req, res) => {
    try {
        const { identifier } = req.body;
        if (!identifier)
            return res.status(400).json({ error: "Identifier required" });
        const data = readJSON();
        let users = data.users || [];
        if (useSQL) {
            const [rows] = await pool.query('SELECT * FROM users');
            users = rows.map(r => {
                const parsed = typeof r.data === 'string' ? JSON.parse(r.data) : r.data || {};
                return { id: r.id, ...parsed };
            });
        }
        const user = users.find(u => u.username?.toLowerCase() === identifier.toLowerCase() || (u.email && u.email.toLowerCase() === identifier.toLowerCase()));
        if (!user || !user.email) {
            return res.status(404).json({ error: "No user found with that username/email, or user has no email linked." });
        }
        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        // Store code with 15 minute expiration
        resetCodes[user.email.toLowerCase()] = {
            code,
            expires: Date.now() + (15 * 60 * 1000)
        };
        // Send Email
        const mailOptions = {
            from: `"AW Engineering PMS" <${process.env.SMTP_USER || 'pms@awesbd.com'}>`,
            to: user.email,
            subject: 'Password Reset Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #0f172a; text-align: center;">Password Reset Request</h2>
                    <p style="color: #475569; font-size: 16px;">Hello ${user.name},</p>
                    <p style="color: #475569; font-size: 16px;">We received a request to reset your password for the AW Engineering System. Your verification code is:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #10b981; background: #ecfdf5; padding: 15px 30px; border-radius: 8px; border: 2px dashed #10b981;">${code}</span>
                    </div>
                    <p style="color: #475569; font-size: 14px;">This code will expire in <b>15 minutes</b>. If you did not request this, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">AW Engineering Solution &bull; Automated Security Protocol</p>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
        res.json({ success: true, email: user.email });
    }
    catch (err) {
        console.error("Forgot Password Error:", err);
        res.status(500).json({
            error: "Failed to send recovery email.",
            details: err.message || "Unknown error",
            code: err.code || "SMTP_ERROR"
        });
    }
});
// 2. Compare Code and Reset Password
app.post("/api/reset-password", async (req, res) => {
    try {
        const { identifier, code, newPassword } = req.body;
        if (!identifier || !code || !newPassword)
            return res.status(400).json({ error: "Missing required fields" });
        const data = readJSON();
        let users = data.users || [];
        if (useSQL) {
            const [rows] = await pool.query('SELECT * FROM users');
            users = rows.map(r => {
                const parsed = typeof r.data === 'string' ? JSON.parse(r.data) : r.data || {};
                return { id: r.id, ...parsed };
            });
        }
        const user = users.find(u => u.username?.toLowerCase() === identifier.toLowerCase() || (u.email && u.email.toLowerCase() === identifier.toLowerCase()));
        if (!user || !user.email) {
            return res.status(404).json({ error: "User not found" });
        }
        const storedRecord = resetCodes[user.email.toLowerCase()];
        if (!storedRecord) {
            return res.status(400).json({ error: "No reset request found for this account. Please request a new code." });
        }
        if (Date.now() > storedRecord.expires) {
            delete resetCodes[user.email.toLowerCase()];
            return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
        }
        if (storedRecord.code !== code) {
            return res.status(400).json({ error: "Invalid verification code." });
        }
        // Code is correct, valid, not expired. Proceed with password change.
        if (useSQL) {
            await pool.query('UPDATE users SET data = JSON_SET(data, "$.password", ?) WHERE id = ?', [newPassword, user.id]);
        }
        else {
            const ind = data.users.findIndex((u) => u.id === user.id);
            if (ind !== -1) {
                data.users[ind].password = newPassword;
                writeJSON(data);
            }
        }
        // Clean up code
        delete resetCodes[user.email.toLowerCase()];
        res.json({ success: true });
    }
    catch (err) {
        console.error("Reset Password Error:", err);
        res.status(500).json({ error: "Failed to reset password." });
    }
});
// Helper: Generate SQL Dump string
async function generateSQLDump() {
    let dump = `-- PMS System Backup\n-- Generated: ${new Date().toISOString()}\n\n`;
    dump += `SET FOREIGN_KEY_CHECKS=0;\n\n`;
    const tables = [
        'projects', 'leads', 'transactions', 'services', 'suppliers',
        'contractors', 'partner_orders', 'deliveries', 'users', 'audit_logs',
        'company_settings', 'roles_list', 'capacity_list', 'floor_list', 'product_list',
        'material_list', 'spec_list'
    ];
    for (const table of tables) {
        // Drop then Create
        const [showCreate] = await pool.query(`SHOW CREATE TABLE ${table}`);
        dump += `DROP TABLE IF EXISTS \`${table}\`;\n`;
        dump += `${showCreate[0]['Create Table']};\n\n`;
        // Inserts
        const [rows] = await pool.query(`SELECT * FROM ${table}`);
        if (rows.length > 0) {
            dump += `INSERT INTO \`${table}\` VALUES \n`;
            const rowValues = rows.map((row) => {
                const values = Object.values(row).map(val => {
                    if (val === null)
                        return 'NULL';
                    if (typeof val === 'object')
                        return pool.escape(JSON.stringify(val));
                    return pool.escape(val);
                });
                return `(${values.join(',')})`;
            });
            dump += rowValues.join(',\n') + ';\n\n';
        }
    }
    dump += `SET FOREIGN_KEY_CHECKS=1;\n`;
    return dump;
}
// Specific DELETE for string lists (Moved UP to avoid generic route conflict)
app.delete("/api/:collection/value/:value", async (req, res) => {
    const collection = req.params.collection;
    const value = req.params.value;
    const tableName = collection.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
    try {
        if (useSQL) {
            await pool.query(`DELETE FROM ${tableName} WHERE name = ?`, [value]);
            res.status(204).send();
        }
        else {
            const db = readJSON();
            if (db[collection] && Array.isArray(db[collection])) {
                db[collection] = db[collection].filter((item) => item !== value);
                writeJSON(db);
                res.status(204).send();
            }
            else {
                res.status(404).json({ error: "Collection not found" });
            }
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- Specialized Routes (Must be BEFORE Generic Routes) ---
// 1. System Backup (Full Files + DB)
app.get("/api/backup", async (req, res) => {
    try {
        const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
        const filename = `PMS_Full_Backup_${new Date().toISOString().split('T')[0]}.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        archive.on('error', (err) => {
            throw err;
        });
        archive.pipe(res);
        // 1. Add DB Dump
        if (useSQL) {
            const sqlDump = await generateSQLDump();
            archive.append(sqlDump, { name: 'database_backup.sql' });
        }
        else {
            const dbJsonPath = path_1.default.resolve(process.cwd(), 'db.json');
            if (fs_1.default.existsSync(dbJsonPath)) {
                archive.file(dbJsonPath, { name: 'db.json' });
            }
        }
        // 2. Add Source Code (Excluding node_modules, etc.)
        const rootDir = process.cwd();
        archive.glob('**/*', {
            cwd: rootDir,
            ignore: [
                'node_modules/**',
                'dist/**',
                'dist-server/**',
                '.git/**',
                '*.zip',
                '*.log',
                '.env' // Sensitive, but usually needed for manual restore. Excluding for safety by default.
            ]
        });
        await archive.finalize();
    }
    catch (error) {
        console.error("Backup error:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to generate system backup: " + error.message });
        }
    }
});
// 2. Special route for company settings
app.get("/api/settings/company", async (req, res) => {
    try {
        if (useSQL) {
            const [rows] = await pool.query(`SELECT data FROM company_settings WHERE id = 1`);
            if (rows.length > 0) {
                res.json(typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data);
            }
            else {
                res.json({});
            }
        }
        else {
            const db = readJSON();
            res.json(db.companySettings);
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 3. Special route for bulk import leads
app.post("/api/leads/bulk", async (req, res) => {
    const newLeads = req.body;
    try {
        if (useSQL) {
            for (const lead of newLeads) {
                const { id, ...rest } = lead;
                await pool.query(`INSERT INTO leads (id, data) VALUES (?, ?)`, [id, JSON.stringify(rest)]);
            }
            res.status(201).json({ count: newLeads.length });
        }
        else {
            const db = readJSON();
            db.leads = [...db.leads, ...newLeads];
            writeJSON(db);
            res.status(201).json({ count: newLeads.length });
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Generic GET for collections
app.get("/api/:collection", async (req, res, next) => {
    const collection = req.params.collection;
    const userRole = req.headers['x-user-role'];
    // Guard against collision with special routes
    if (collection === 'backup' || collection === 'settings' || collection === 'leads/bulk')
        return next();
    const tableName = collection.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
    try {
        if (useSQL) {
            // Handle simple string lists (rolesList, capacityList, etc.)
            if (collection.endsWith('List')) {
                const [rows] = await pool.query(`SELECT name FROM ${tableName}`);
                return res.json(rows.map((r) => r.name));
            }
            let query = `SELECT * FROM ${tableName}`;
            const queryParams = [];
            // Filter by isApproved for non-admins (except users/audit_logs/settings/lists)
            const mainCollections = ['projects', 'leads', 'transactions', 'services', 'suppliers', 'contractors', 'partner_orders', 'deliveries'];
            if (userRole !== 'ADMIN' && mainCollections.includes(collection)) {
                query += ` WHERE (isApproved = 1 OR createdBy = ?)`;
                queryParams.push(req.headers['x-user-id']);
            }
            // Sort audit logs newest-first
            if (tableName === 'audit_logs') {
                query += ` ORDER BY JSON_UNQUOTE(JSON_EXTRACT(data, '$.timestamp')) DESC`;
            }
            const [rows] = await pool.query(query, queryParams);
            const data = rows.map((r) => {
                const parsed = r.data ? (typeof r.data === 'string' ? JSON.parse(r.data) : r.data) : {};
                // Priority: Column values override JSON values if they exist and are not null
                return {
                    ...parsed,
                    ...r,
                    isApproved: r.isApproved === 1,
                    pendingDelete: r.pendingDelete === 1,
                    pendingUpdate: r.pendingUpdate ? (typeof r.pendingUpdate === 'string' ? JSON.parse(r.pendingUpdate) : r.pendingUpdate) : parsed.pendingUpdate
                };
            });
            res.json(data);
        }
        else {
            const db = readJSON();
            let data = db[collection] || [];
            if (userRole !== 'ADMIN' && ['projects', 'leads', 'transactions', 'services', 'suppliers', 'contractors', 'partner_orders', 'deliveries'].includes(collection)) {
                data = data.filter((item) => item.isApproved === true || item.createdBy === req.headers['x-user-id']);
            }
            res.json(data);
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Generic POST for collections
app.post("/api/:collection", async (req, res, next) => {
    const collection = req.params.collection;
    const tableName = collection.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);

    const userRole = req.headers['x-user-role'];
    const mainCollections = ['projects', 'leads', 'transactions', 'services', 'suppliers', 'contractors', 'partner_orders', 'deliveries'];
    if (mainCollections.includes(collection)) {
        if (collection === 'leads' || userRole === 'ADMIN') {
            req.body.isApproved = true;
        } else {
            req.body.isApproved = false;
        }
    }

    try {
        if (useSQL) {
            // Handle simple string lists (rolesList, capacityList, etc.)
            if (collection.endsWith('List')) {
                let val = req.body;
                if (typeof req.body === 'object') {
                    val = req.body.value || req.body.name || req.body.role;
                }
                if (!val)
                    return res.status(400).json({ error: "Value is required" });
                await pool.query(`INSERT IGNORE INTO ${tableName} (name) VALUES (?)`, [val]);
                return res.status(201).json({ value: val });
            }
            const { id, ...rest } = req.body;
            if (!id)
                return res.status(400).json({ error: "ID is required" });
            const data = JSON.stringify(rest);
            // Dynamic Column Mapping
            const columns = ['id', 'data'];
            const values = [id, data];
            // 1. Approval \u0026 Creation Tracking
            if ('isApproved' in req.body) {
                columns.push('isApproved');
                values.push(req.body.isApproved ? 1 : 0);
            }
            if (req.headers['x-user-id']) {
                columns.push('createdBy');
                values.push(req.headers['x-user-id']);
            }
            // 2. Name Mapping
            const name = rest.name || rest.clientName || '';
            if (name) {
                if (collection === 'leads') {
                    columns.push('clientName');
                    values.push(name);
                }
                else if (['projects', 'suppliers', 'contractors'].includes(collection)) {
                    columns.push('name');
                    values.push(name);
                }
            }
            // 3. Foreign Key Mapping
            if (rest.projectId) {
                columns.push('projectId');
                values.push(rest.projectId);
            }
            if (rest.partnerId) {
                columns.push('partnerId');
                values.push(rest.partnerId);
            }
            // 4. Project Stats (Special)
            if (collection === 'projects') {
                if (rest.status) {
                    columns.push('status');
                    values.push(rest.status);
                }
                if (rest.progress !== undefined) {
                    columns.push('progress');
                    values.push(rest.progress);
                }
            }
            const placeholders = values.map(() => '?').join(', ');
            const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
            await pool.query(query, values);
            res.status(201).json(req.body);
        }
        else {
            const db = readJSON();
            // Auto-initialize collection if missing
            if (!db[collection]) {
                db[collection] = [];
            }
            if (Array.isArray(db[collection]) && (collection.endsWith('List'))) {
                const val = typeof req.body === 'object' ? req.body.value : req.body;
                if (val && !db[collection].includes(val))
                    db[collection].push(val);
            }
            else {
                db[collection].push(req.body);
            }
            writeJSON(db);
            res.status(201).json(req.body);
        }
    }
    catch (error) {
        console.error(`POST Error [${collection}]:`, error);
        res.status(500).json({ error: error.message || "Failed to save data" });
    }
});
// Generic PUT for collections
app.put("/api/:collection/:id", async (req, res, next) => {
    const collection = req.params.collection;
    const id = req.params.id;
    const userRole = req.headers['x-user-role'];
    const userId = req.headers['x-user-id'];
    if (collection === 'backup' || collection === 'settings' || collection === 'leads/bulk')
        return next();
    const tableName = collection.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
    try {
        if (useSQL) {
            if (collection === 'settings' && id === 'company') {
                const data = JSON.stringify(req.body);
                await pool.query(`INSERT INTO company_settings (id, data) VALUES (1, ?) ON DUPLICATE KEY UPDATE data = ?`, [data, data]);
                return res.json(req.body);
            }
            const { id: bodyId, ...rest } = req.body;
            if (userRole !== 'ADMIN') {
                // Fetch current record to preserve it and add pendingUpdate
                const [rows] = await pool.query(`SELECT data FROM ${tableName} WHERE id = ?`, [id]);
                if (rows.length > 0) {
                    const currentData = typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data;
                    const updatedData = {
                        ...currentData,
                        pendingUpdate: rest,
                        updatedBy: userId,
                        updatedAt: new Date().toISOString()
                    };
                    // Update both data JSON and pendingUpdate column for robust approval
                    await pool.query(`UPDATE ${tableName} SET data = ?, pendingUpdate = ? WHERE id = ?`, [JSON.stringify(updatedData), JSON.stringify(rest), id]);
                    return res.json(updatedData);
                }
            }
            // ADMIN logic or approved update
            // Aggressively clear pending states both in JSON payload and SQL columns
            rest.pendingUpdate = null;
            rest.pendingDelete = null;

            const updateData = JSON.stringify(rest);
            const updates = ['data = JSON_MERGE_PATCH(COALESCE(data, "{}"), ?)'];
            const params = [updateData];
            if ('isApproved' in rest) {
                updates.push('isApproved = ?');
                params.push(rest.isApproved ? 1 : 0);
            }

            updates.push('pendingUpdate = NULL');
            updates.push('pendingDelete = 0');
            if (collection === 'projects') {
                if (rest.status) {
                    updates.push('status = ?');
                    params.push(rest.status);
                    // --- PROJECT DELIVERY AUTOMATION ---
                    if (rest.status === 'Handover' || rest.status === 'Completed') {
                        try {
                            const [existingDeliveries] = await pool.query(`SELECT COUNT(*) as count FROM deliveries WHERE projectId = ?`, [id]);
                            const count = existingDeliveries[0].count;
                            console.log(`Checking automation for project ${id}. Existing deliveries: ${count}`);
                            if (count === 0) {
                                console.log(`Automating major components for project ${id}`);
                                for (const component of DEFAULT_MAJOR_COMPONENTS) {
                                    const compId = `D${Math.floor(Math.random() * 100000)}`;
                                    const compData = JSON.stringify({
                                        productName: component,
                                        category: 'PRODUCT',
                                        quantity: 1,
                                        deliveryDate: new Date().toISOString().split('T')[0],
                                        status: 'Delivered',
                                        remarks: 'Automatically added on project delivery'
                                    });
                                    await pool.query(`INSERT INTO deliveries (id, projectId, data, isApproved) VALUES (?, ?, ?, 1)`, [compId, id, compData]);
                                }
                                console.log(`Successfully added ${DEFAULT_MAJOR_COMPONENTS.length} components.`);
                            }
                        }
                        catch (autoError) {
                            console.error(`Project Automation Error for ${id}:`, autoError.message);
                        }
                    }
                }
                if (rest.progress !== undefined) {
                    updates.push('progress = ?');
                    params.push(rest.progress);
                }
            }
            params.push(id);
            await pool.query(`UPDATE ${tableName} SET ${updates.join(', ')} WHERE id = ?`, params);
            res.json(req.body);
        }
        else {
            const db = readJSON();
            if (collection === 'settings' && id === 'company') {
                db.companySettings = req.body;
                writeJSON(db);
                return res.json(db.companySettings);
            }
            if (db[collection]) {
                const index = db[collection].findIndex((item) => item.id === id);
                if (index !== -1) {
                    if (userRole !== 'ADMIN') {
                        db[collection][index] = {
                            ...db[collection][index],
                            pendingUpdate: req.body,
                            updatedBy: userId,
                            updatedAt: new Date().toISOString()
                        };
                    }
                    else {
                        db[collection][index] = { ...db[collection][index], ...req.body, pendingUpdate: null, pendingDelete: null };
                    }
                    writeJSON(db);
                    res.json(db[collection][index]);
                }
                else {
                    res.status(404).json({ error: "Item not found" });
                }
            }
            else {
                res.status(404).json({ error: "Collection not found" });
            }
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Generic DELETE for collections
app.delete("/api/:collection/:id", async (req, res, next) => {
    const collection = req.params.collection;
    const id = req.params.id;
    const userRole = req.headers['x-user-role'];
    const userId = req.headers['x-user-id'];
    const tableName = collection.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
    try {
        if (useSQL) {
            if (userRole !== 'ADMIN') {
                const [rows] = await pool.query(`SELECT data FROM ${tableName} WHERE id = ?`, [id]);
                if (rows.length > 0) {
                    const currentData = typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data;
                    const updatedData = {
                        ...currentData,
                        pendingDelete: true,
                        deletedBy: userId,
                        deletedAt: new Date().toISOString()
                    };
                    // Update both data JSON and pendingDelete column
                    await pool.query(`UPDATE ${tableName} SET data = ?, pendingDelete = 1 WHERE id = ?`, [JSON.stringify(updatedData), id]);
                    return res.status(202).json({ message: "Deletion request submitted for approval" });
                }
                return res.status(404).json({ error: "Item not found" });
            }
            await pool.query(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
            res.status(204).send();
        }
        else {
            const db = readJSON();
            if (db[collection]) {
                const index = db[collection].findIndex((item) => item.id === id);
                if (index !== -1) {
                    if (userRole !== 'ADMIN') {
                        db[collection][index] = {
                            ...db[collection][index],
                            pendingDelete: true,
                            deletedBy: userId,
                            deletedAt: new Date().toISOString()
                        };
                        writeJSON(db);
                        return res.status(202).json({ message: "Deletion request submitted for approval" });
                    }
                    db[collection] = db[collection].filter((item) => item.id !== id);
                    writeJSON(db);
                    res.status(204).send();
                }
                else {
                    res.status(404).json({ error: "Item not found" });
                }
            }
            else {
                res.status(404).json({ error: "Collection not found" });
            }
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- End of API Routes ---
// --- Vite Integration ---
async function startServer() {
    await initDB();
    if (process.env.NODE_ENV !== "production") {
        const { createServer: createViteServer } = await Promise.resolve().then(() => __importStar(require('vite')));
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    }
    else {
        app.use(express_1.default.static(clientDistPath));
        app.use((req, res) => {
            res.sendFile(path_1.default.resolve(clientDistPath, 'index.html'));
        });
    }
    // Export the app for testing or serverless environments (like Passenger)
    if (typeof require !== 'undefined' && require.main === module) {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    return app;
}
const serverApp = startServer();
exports.default = serverApp;
