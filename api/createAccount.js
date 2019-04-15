const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { ulid } = require('ulid');
const db = require('./../db');
const emailer = require('./emailer');

const app = express.Router();

const checkAccountExists = async (username, email) => {
  const result = await db.query(
    'select username from users where username=$1 or email=$2',
    [username, email]
  );
  if (result.rows.length > 0) {
    throw new Error('Invalid username/email.');
  }
};

const hashPassword = (password) => bcrypt.hashSync(password, 10);

const makeActivationCode = (username) => {
  const hash = crypto.createHash('sha256');
  const code = `${process.env.SECRET}${username}${Math.floor(
    new Date().getTime() / 1000
  ).toString()}`;
  hash.update(code);
  return hash.digest('hex');
};

app.post('/create', async (req, res) => {
  try {
    await checkAccountExists(req.body.username, req.body.email);
    const activationCode = makeActivationCode(req.body.username);
    try {
      await db.query(
        'insert into users (id, username, password_hash, email, activation_code, activated) values ($1, $2, $3, $4, $5, $6)',
        [
          ulid(),
          req.body.username,
          hashPassword(req.body.password),
          req.body.email,
          activationCode,
          false
        ]
      );
      res.sendStatus(200);
      emailer.sendActivationEmail(req.body.email, activationCode);
    } catch (err) {
      console.log(err);
      res.sendStatus(503);
    }
  } catch (err) {
    console.log(err);
    res.status(409);
    res.send('Invalid username/email.');
  }
});

module.exports = app;
