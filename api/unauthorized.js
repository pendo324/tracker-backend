const express = require('express');

const app = express.Router();

app.all('*', (req, res, next) => {
  if (!req.session.currentUser) {
    res.sendStatus(401);
  }

  next();
});

module.exports = app;
