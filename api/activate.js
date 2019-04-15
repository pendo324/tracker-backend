const express = require('express');
const db = require('./../db');

const app = express.Router();

app.get('/activate/:code([a-zA-Z0-9]{64})', async (req, res) => {
  await db.query(
    'update users set activated=$1, activation_code=$2 where activation_code=$3',
    [true, null, req.params.code]
  );

  res.sendStatus(200);
});

module.exports = app;
