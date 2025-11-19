const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { DB_PATH } = require('../db/database');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'db', 'migrations');

const ensureMigrationsTable = () => {
  const result = spawnSync('sqlite3', [DB_PATH, 'PRAGMA foreign_keys = ON; CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT DEFAULT CURRENT_TIMESTAMP);'], {
    encoding: 'utf-8',
  });
  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || 'Failed to ensure migrations table');
  }
};

const hasMigration = (name) => {
  const result = spawnSync('sqlite3', ['-json', DB_PATH, `SELECT name FROM _migrations WHERE name = '${name.replace(/'/g, "''")}';`], {
    encoding: 'utf-8',
  });
  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || 'Failed to check migration');
  }
  const output = result.stdout?.trim();
  if (!output) {
    return false;
  }
  const rows = JSON.parse(output);
  return rows.length > 0;
};

const applyMigration = (name, sql) => {
  const result = spawnSync('sqlite3', [DB_PATH], {
    encoding: 'utf-8',
    input: `PRAGMA foreign_keys = ON;\n${sql}\n`,
  });
  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || `Failed to apply migration ${name}`);
  }
  const insertResult = spawnSync('sqlite3', [DB_PATH, `INSERT INTO _migrations (name) VALUES ('${name.replace(/'/g, "''")}');`], {
    encoding: 'utf-8',
  });
  if (insertResult.status !== 0) {
    throw new Error(insertResult.stderr?.trim() || 'Failed to record migration');
  }
};

const main = () => {
  ensureMigrationsTable();
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();

  files.forEach(file => {
    if (hasMigration(file)) {
      console.log(`Skipping migration ${file}`);
      return;
    }
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
    applyMigration(file, sql);
    console.log(`Applied migration ${file}`);
  });
};

main();
