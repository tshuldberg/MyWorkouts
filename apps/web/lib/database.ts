import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { ALL_TABLES, CREATE_INDEXES } from './db/schema';
import { seedExerciseLibrary } from './db/seed';

export interface DatabaseAdapter {
  execute(sql: string, params?: unknown[]): void;
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): T[];
  transaction(fn: () => void): void;
}

const DB_DIR = path.join(process.cwd(), '.data');
const DB_PATH = path.join(DB_DIR, 'myworkouts.sqlite');

let _db: Database.Database | null = null;

function getRawDb(): Database.Database {
  if (_db) return _db;

  fs.mkdirSync(DB_DIR, { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  // Create tables
  for (const sql of ALL_TABLES) {
    _db.exec(sql);
  }
  for (const sql of CREATE_INDEXES) {
    _db.exec(sql);
  }

  // Seed exercise library
  const adapter = makeAdapter(_db);
  seedExerciseLibrary(adapter);

  return _db;
}

function makeAdapter(db: Database.Database): DatabaseAdapter {
  return {
    execute(sql: string, params?: unknown[]) {
      db.prepare(sql).run(...(params ?? []));
    },
    query<T = Record<string, unknown>>(sql: string, params?: unknown[]): T[] {
      return db.prepare(sql).all(...(params ?? [])) as T[];
    },
    transaction(fn: () => void) {
      db.transaction(fn)();
    },
  };
}

export function getDb(): DatabaseAdapter {
  const db = getRawDb();
  return makeAdapter(db);
}
