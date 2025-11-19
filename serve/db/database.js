const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const DB_PATH = path.join(__dirname, 'data.sqlite');

const ensureDatabaseFile = () => {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, '');
  }
};

ensureDatabaseFile();

const escapeValue = (value) => {
  if (value === null || typeof value === 'undefined') {
    return 'NULL';
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return `'${serialized.replace(/'/g, "''")}'`;
};

const buildSql = (sql, params = []) => {
  const trimmed = sql.trim();
  if (!params.length) {
    return trimmed.endsWith(';') ? trimmed : `${trimmed};`;
  }

  let paramIndex = 0;
  const finalSql = trimmed.replace(/\?/g, () => {
    if (paramIndex >= params.length) {
      throw new Error('SQL parameter count mismatch');
    }
    const formatted = escapeValue(params[paramIndex]);
    paramIndex += 1;
    return formatted;
  });

  if (paramIndex !== params.length) {
    throw new Error('SQL parameter count mismatch');
  }

  return finalSql.endsWith(';') ? finalSql : `${finalSql};`;
};

const runSql = (sql, { parseJson = false } = {}) => {
  const args = parseJson ? ['-json', DB_PATH, sql] : [DB_PATH];
  const options = parseJson ? {} : { input: sql };
  const result = spawnSync('sqlite3', args, {
    ...options,
    encoding: 'utf-8',
    stdio: parseJson ? 'pipe' : undefined,
  });

  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || 'SQLite execution failed');
  }

  if (!parseJson) {
    return null;
  }

  const output = result.stdout?.trim();
  if (!output) {
    return [];
  }

  return JSON.parse(output);
};

const query = (sql, params = []) => {
  const finalSql = buildSql(sql, params);
  return runSql(finalSql, { parseJson: true });
};

const queryOne = (sql, params = []) => {
  const rows = query(sql, params);
  return rows[0] || null;
};

const execute = (sql, params = []) => {
  const finalSql = buildSql(sql, params);
  runSql(finalSql);
};

module.exports = {
  DB_PATH,
  query,
  queryOne,
  execute,
};
