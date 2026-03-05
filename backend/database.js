import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// In production use DATABASE_PATH env var (Railway persistent volume), else local file
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'ptapp.db')
const db = new Database(dbPath)

export function initDB() {
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS trainers (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      email         TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      is_admin      INTEGER NOT NULL DEFAULT 0,
      is_active     INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clients (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      trainer_id  INTEGER NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
      name        TEXT    NOT NULL,
      email       TEXT,
      birth_date  TEXT,
      notes       TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      name              TEXT    NOT NULL,
      muscle_group      TEXT    NOT NULL,
      secondary_muscles TEXT,
      equipment         TEXT,
      instructions      TEXT,
      is_custom         INTEGER NOT NULL DEFAULT 0,
      trainer_id        INTEGER REFERENCES trainers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workout_sessions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id   INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      trainer_id  INTEGER NOT NULL REFERENCES trainers(id),
      date        TEXT    NOT NULL,
      notes       TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS workout_sets (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id  INTEGER NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id),
      set_number  INTEGER NOT NULL,
      reps        INTEGER NOT NULL,
      weight_kg   REAL    NOT NULL,
      rpe         INTEGER CHECK(rpe BETWEEN 1 AND 10)
    );

    CREATE TABLE IF NOT EXISTS client_schedule (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id  INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
      UNIQUE(client_id, day_of_week)
    );

    CREATE INDEX IF NOT EXISTS idx_clients_trainer  ON clients(trainer_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_client  ON workout_sessions(client_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_trainer ON workout_sessions(trainer_id);
    CREATE INDEX IF NOT EXISTS idx_sets_session     ON workout_sets(session_id);
    CREATE INDEX IF NOT EXISTS idx_sets_exercise    ON workout_sets(exercise_id);
    CREATE INDEX IF NOT EXISTS idx_exercises_muscle ON exercises(muscle_group);
    CREATE INDEX IF NOT EXISTS idx_schedule_client  ON client_schedule(client_id);
    CREATE INDEX IF NOT EXISTS idx_schedule_day     ON client_schedule(day_of_week);
  `)

  // Migrations: safely add columns to existing databases
  const cols = db.prepare("PRAGMA table_info(trainers)").all().map(c => c.name)
  if (!cols.includes('is_admin')) {
    db.exec("ALTER TABLE trainers ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0")
  }
  if (!cols.includes('is_active')) {
    db.exec("ALTER TABLE trainers ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1")
  }

  // Migration: add duo_partner_id to clients
  const clientCols = db.prepare("PRAGMA table_info(clients)").all().map(c => c.name)
  if (!clientCols.includes('duo_partner_id')) {
    db.exec("ALTER TABLE clients ADD COLUMN duo_partner_id INTEGER REFERENCES clients(id)")
  }

  // Migration: add start_time to client_schedule
  const scheduleCols = db.prepare("PRAGMA table_info(client_schedule)").all().map(c => c.name)
  if (!scheduleCols.includes('start_time')) {
    db.exec("ALTER TABLE client_schedule ADD COLUMN start_time TEXT")
  }

  // Ensure the designated admin account is always admin
  const ADMIN_EMAIL = 'wibo.fikkert@gmail.com'
  db.prepare("UPDATE trainers SET is_admin = 1 WHERE email = ?").run(ADMIN_EMAIL)
}

export default db
