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
const SCHEMA_VERSION = 2;
const MAX_CACHED_STATEMENTS = 200;

let _db: Database.Database | null = null;
let _adapter: DatabaseAdapter | null = null;

function getRawDb(): Database.Database {
  if (_db) return _db;

  fs.mkdirSync(DB_DIR, { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  const currentVersion = Number(_db.pragma('user_version', { simple: true }) ?? 0);
  if (currentVersion < SCHEMA_VERSION) {
    for (const sql of ALL_TABLES) {
      _db.exec(sql);
    }
    for (const sql of CREATE_INDEXES) {
      _db.exec(sql);
    }

    const adapter = makeAdapter(_db);
    seedExerciseLibrary(adapter);
    _db.pragma(`user_version = ${SCHEMA_VERSION}`);
  }

  return _db;
}

function makeAdapter(db: Database.Database): DatabaseAdapter {
  const statementCache = new Map<string, Database.Statement>();

  const getStatement = (sql: string): Database.Statement => {
    const cached = statementCache.get(sql);
    if (cached) return cached;

    const statement = db.prepare(sql);
    statementCache.set(sql, statement);
    if (statementCache.size > MAX_CACHED_STATEMENTS) {
      const oldest = statementCache.keys().next().value;
      if (oldest) {
        statementCache.delete(oldest);
      }
    }
    return statement;
  };

  return {
    execute(sql: string, params?: unknown[]) {
      getStatement(sql).run(...(params ?? []));
    },
    query<T = Record<string, unknown>>(sql: string, params?: unknown[]): T[] {
      return getStatement(sql).all(...(params ?? [])) as T[];
    },
    transaction(fn: () => void) {
      db.transaction(fn)();
    },
  };
}

export function getDb(): DatabaseAdapter {
  if (_adapter) return _adapter;
  const db = getRawDb();
  _adapter = makeAdapter(db);
  return _adapter;
}
