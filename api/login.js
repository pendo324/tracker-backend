const express = require('express');
const db = require('./../db.js');
const bcrypt = require('bcrypt');

const app = express.Router();

app.post('/login', (req, res) => {
  db.query('select username, account_id, password_hash from tracker.user where username=$1', [req.body.username]).then(result => {
  	if (bcrypt.compareSync(req.body.password, result.rows[0].password_hash)) {
      req.session.currentUser = {
        username: req.body.username,
        id: result.rows[0].account_id
      };

      req.session.save(function(err) {
        res.send();
      });
  	}
  }).catch(err => {
  	console.log(err);
		res.sendStatus(404);
  });
});

module.exports = app;
