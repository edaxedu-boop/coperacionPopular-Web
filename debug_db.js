import Database from 'better-sqlite3';
const db = new Database('database.db');
console.log(db.prepare('PRAGMA table_info(news)').all());
console.log('--- DATA ---');
console.log(db.prepare('SELECT * FROM news LIMIT 1').get());
