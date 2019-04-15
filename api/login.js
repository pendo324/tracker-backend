const { readFileSync } = require('fs');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./../db');

const app = express.Router();
const privateKey = readFileSync('./keys/privkey.pem');

app.post('/login', async (req, res) => {
  const requiredFields = ['username', 'password'];
  if (
    !requiredFields.every((rf) => Object.keys(req.body).find((k) => k === rf))
  ) {
    return res.status(403).json({
      error: 'Missing required field(s)'
    });
  }

  try {
    const result = await db.query(
      'select username, id, password_hash from users where username=$1',
      [req.body.username]
    );

    if (bcrypt.compareSync(req.body.password, result.rows[0].password_hash)) {
      const token = jwt.sign(
        {
          username: req.body.username,
          id: result.rows[0].id
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
