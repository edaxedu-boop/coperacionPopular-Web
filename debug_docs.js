import Database from 'better-sqlite3';
const db = new Database('database.db');
const docs = db.prepare('SELECT * FROM documents').all();
console.log(JSON.stringify(docs, null, 2));
