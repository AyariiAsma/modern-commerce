import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFile = process.env.DB_FILE || 'database/ecommerce.db';
const dbPath = path.resolve(__dirname, '..', dbFile);

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database connection failed:', err.message);
    } else {
        console.log(`Connected to SQLite database at: ${dbPath}`);
        // Enable foreign key support
        db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
            if (pragmaErr) {
                console.error('Failed to enable foreign keys pragma:', pragmaErr.message);
            }
        });
    }
});

export const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                console.error(`DB Query Error: ${sql} | Params: ${JSON.stringify(params)}`, err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

export const queryOne = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                console.error(`DB QueryOne Error: ${sql} | Params: ${JSON.stringify(params)}`, err);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

export const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                console.error(`DB Run Error: ${sql} | Params: ${JSON.stringify(params)}`, err);
                reject(err);
            } else {
                resolve({ lastID: this.lastID, changes: this.changes });
            }
        });
    });
};

export default db;
