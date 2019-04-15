const Pool = require('pg-pool');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  ssl: false
};

const pool = new Pool(config);

// pool.query('truncate users');

module.exports.query = (text, values) => {
  return pool.query(text, values);
};

module.exports.checkSecret = (secret) => {
  return pool.query('select * from users where secret = $1', [secret]);
};

module.exports.checkTorrent = (hash) => {
  return pool.query('select * from torrents where hash = $1', [hash]);
};

module.exports.pg = pool.client;
