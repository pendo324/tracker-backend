const express = require('express');

const app = express.Router();

app.all('/logged', (req, res) => {
	const user = req.session.currentUser;
	res.send(user);
});

module.exports = app;
