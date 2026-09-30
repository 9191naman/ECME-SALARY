import Database from 'better-sqlite3';
export type DB = Database.Database;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS employees (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name  TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  country    TEXT NOT NULL,
  department TEXT NOT NULL,
  job_title  TEXT NOT NULL,
  salary     INTEGER NOT NULL CHECK (salary > 0),
  hire_date  TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_emp_country ON employees(country);
CREATE INDEX IF NOT EXISTS idx_emp_dept ON employees(department);
CREATE INDEX IF NOT EXISTS idx_emp_name ON employees(full_name);
`;

export function openDb(file = ':memory:'): DB {
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);
  return db;
}
