const express = require('express');
const db = require('./../db');

const app = express.Router();

app.get('/activate/:code([a-zA-Z0-9]{64})', async (req, res) => {
  await db.query('delete from activation_codes where activation_code = $1', [
    req.params.code
  ]);

  res.sendStatus(200);
});

module.exports = app;
