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
      'select username, id, password_hash, activated from users where username=$1',
      [req.body.username]
    );

    if (result.rows.length !== 1) {
      return res.status(500).send();
    }

    const userId = result.rows[0].id;

    const activatedRes = await db.query(
      'select id from activation_codes where user_id = $1',
      [userId]
    );

    if (activatedRes.rows.length > 0) {
      return res.status(403).json({
        error: 'User not activated'
      });
    }

    if (!result.rows[0].activated) {
      await db.query('update users set activated=$2 where id = $1', [
        userId,
        true
      ]);
    }

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
