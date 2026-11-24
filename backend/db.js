const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// PostgreSQL configuration
const pgPool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'acn_charging',
  user: process.env.PGUSER || process.env.USER || 'aryangautam',
  password: process.env.PGPASSWORD || '',
  max: 10,
  idleTimeoutMillis: 30000,
});

// SQLite fallback
const sqlitePath = path.resolve(__dirname, '../data/acn_charging.db');
const sqliteDb = new sqlite3.Database(sqlitePath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.warn('[DB] SQLite file not opened:', err.message);
  } else {
    console.log('[DB] SQLite database ready as fallback at:', sqlitePath);
  }
});

let usePostgres = true;

// Probe PostgreSQL on initialization
pgPool.query('SELECT COUNT(*) FROM charging_sessions')
  .then((res) => {
    console.log(`[DB] Connected successfully to PostgreSQL (acn_charging). Found ${res.rows[0].count} sessions.`);
    usePostgres = true;
  })
  .catch((err) => {
    console.warn('[DB] PostgreSQL connection check failed, using SQLite fallback:', err.message);
    usePostgres = false;
  });

/**
 * Universal SQL query executor
 * If PostgreSQL is active, runs with parameterized syntax ($1, $2)
 * If fallback to SQLite is needed, handles SQLite execution.
 */
async function query(sql, params = []) {
  if (usePostgres) {
    try {
      const res = await pgPool.query(sql, params);
      return res.rows;
    } catch (err) {
      console.error('[DB] PostgreSQL query error, trying SQLite fallback:', err.message);
    }
  }

  // Fallback to SQLite
  return new Promise((resolve, reject) => {
    // Convert PostgreSQL $1, $2 syntax to SQLite ? syntax
    let sqliteSql = sql;
    params.forEach((_, i) => {
      sqliteSql = sqliteSql.replace(new RegExp(`\\$${i + 1}`, 'g'), '?');
    });

    sqliteDb.all(sqliteSql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

module.exports = {
  query,
  pgPool
};
