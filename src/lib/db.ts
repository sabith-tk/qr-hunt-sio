import Database from 'better-sqlite3';
import path from 'path';

// Construct the path to the database file
const dbPath = path.join(process.cwd(), 'database.sqlite');

let db: Database.Database;

export function getDb() {
  if (!db) {
    db = new Database(dbPath, { verbose: console.log });
  }
  return db;
}
