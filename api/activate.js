const db = require('./../db.js');
const express = require('express');

const app = express.Router();

app.get('/activate/:code([a-zA-Z0-9]{64})', (req, res) => {
  db.query('update tracker.user set activated=$1, activation_code=$2, where activation_code=$3',
    [true, null, req.params.code]).then(result => {
      res.send(200);
    });
});

module.exports = app;
