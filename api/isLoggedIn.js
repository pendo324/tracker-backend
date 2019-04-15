const fs = require('fs');
const express = require('express');
const jwt = require('jsonwebtoken');

const app = express.Router();

const cert = fs.readFileSync('./keys/cert.pem');

app.get('/logged', (req, res) => {
  if (typeof req.header('Authorization') === 'undefined') {
    return res.sendStatus(401);
  }
  const token = req.header('Authorization').split('Bearer ')[1];
  if (typeof token === 'undefined') {
    return res.sendStatus(401);
  }
  jwt.verify(token, cert, (err, decoded) => {
    if (err) {
      return res.sendStatus(401);
    }
    res.send(decoded);
  });
});

module.exports = app;
