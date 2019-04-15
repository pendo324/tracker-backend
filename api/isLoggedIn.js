const fs = require('fs');
const express = require('express');
const jwt = require('jsonwebtoken');

const app = express.Router();

const cert = fs.readFileSync('./keys/cert.pem');

app.all('/logged', (req, res) => {
  jwt.verify(
    req.header('Authorization').split('Bearer ')[1],
    cert,
    (err, decoded) => {
      if (err) {
        return res.sendStatus(401);
      }
      res.send(decoded);
    }
  );
});

module.exports = app;
