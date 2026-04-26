const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'spaccioalert',
  user: 'postgres',
  password: 'Milano2026',
});

module.exports = pool;