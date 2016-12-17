const Pool = require('pg-pool');
const url = require('url');

const params = url.parse(process.env.DATABASE_URL);
const auth = params.auth.split(':');

const config = {
  user: auth[0],
  password: auth[1],
  host: params.hostname,
  port: params.port,
  database: params.pathname.split('/')[1],
  ssl: false
};

const pool = new Pool(config);

pool.query('truncate tracker.user');

module.exports.query = (text, values) => {
  return pool.query(text, values);
};

module.exports.checkSecret = (secret) => {
  return pool.query('select * from tracker.user where secret = $1', [secret]);
};

module.exports.checkTorrent = (hash) => {
  return pool.query('select * from tracker.torrents where hash = $1', [hash]);
};

module.exports.pg = pool.client;
