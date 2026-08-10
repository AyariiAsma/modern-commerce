import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { run, query } from '../../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initMigrationTable() {
    await run(`
        CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

async function runMigrations() {
    console.log('Starting database migrations...');
    await initMigrationTable();

    const migrationFiles = fs.readdirSync(__dirname)
        .filter(file => file.endsWith('.sql'))
        .sort();

    const executedMigrations = await query('SELECT name FROM migrations');
    const executedNames = executedMigrations.map(m => m.name);

    for (const file of migrationFiles) {
        if (executedNames.includes(file)) {
            console.log(`Migration ${file} already executed. Skipping.`);
            continue;
        }

        const filePath = path.join(__dirname, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        console.log(`Executing migration: ${file}...`);
        
        await new Promise((resolve, reject) => {
            db.exec(sql, async (err) => {
                if (err) {
                    console.error(`Error in migration ${file}:`, err.message);
                    reject(err);
                } else {
                    try {
                        await run('INSERT INTO migrations (name) VALUES (?)', [file]);
                        console.log(`Migration ${file} completed successfully.`);
                        resolve();
                    } catch (insertErr) {
                        reject(insertErr);
                    }
                }
            });
        });
    }

    console.log('All migrations completed.');
    db.close();
}

runMigrations().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
