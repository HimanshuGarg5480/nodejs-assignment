import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function openDb() {
  return open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });
}

async function setupDb() {
  const db = await openDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS cats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      breed TEXT NOT NULL
    )
  `);
}

export { openDb, setupDb };
