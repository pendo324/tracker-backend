const express = require('express');

const app = express.Router();

app.get('/logout', (req, res) => {
	req.session.destroy(err => {
		if (err) throw err;
		res.send(200);
	});
});

module.exports = app;
