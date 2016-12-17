const express = require('express');
const db = require('./../db.js');
const bcrypt = require('bcrypt');
const emailer = require('./emailer');
const crypto = require('crypto');

const app = express.Router();

const checkAccountExists = (username, email) => {
  return db.query('select username from tracker.user where username=$1 or email=$2', [username, email]).then(result => {
    if (result.rows.length > 0) {
      return Promise.reject(new Error('Invalid username/email.'));
    }
    return Promise.resolve();
  });
};

const hashPassword = password => {
  return bcrypt.hashSync(password, 10);
};

const makeActivationCode = username => {
  const hash = crypto.createHash('sha256');
  const code = process.env.COOKIE_SECRET + username + Math.floor((new Date).getTime()/1000).toString();
  hash.update(code);
  return hash.digest('hex');
};

app.post('/create', (req, res) => {
  checkAccountExists(req.body.username, req.body.email).then(() => {
    const activationCode = makeActivationCode(req.body.username);
    db.query('insert into tracker.user (username, password_hash, email, activation_code) values ($1, $2, $3, $4)', 
              [req.body.username, hashPassword(req.body.password), req.body.email, activationCode]).then(result => { 
                res.sendStatus(200);
                emailer.sendActivationEmail(req.body.email, activationCode);
              }).catch(err => {
                console.log(err);
                res.sendStatus(503);
              });
  }).catch(err => {
    console.log(err);
    res.status(409);
    res.send('Invalid username/email.');
  });
});

module.exports = app;
