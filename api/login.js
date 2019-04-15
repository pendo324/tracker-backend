const { readFileSync } = require('fs');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./../db');

const app = express.Router();
const privateKey = readFileSync('./keys/privkey.pem');

app.post('/login', async (req, res) => {
  try {
    const result = await db.query(
      'select username, account_id, password_hash from users where username=$1',
      [req.body.username]
    );

    if (bcrypt.compareSync(req.body.password, result.rows[0].password_hash)) {
      const token = jwt.sign(
        {
          username: req.body.username,
          id: result.rows[0].account_id
        },
        privateKey,
        {
          algorithm: 'RS256'
        }
      );

      res.json({
        token
      });
    }
  } catch (err) {
    console.log(err);
    res.sendStatus(404);
  }
});

module.exports = app;
