const express = require('express');
const db = require('./../db.js');

const app = express.Router();

app.get('/blogPosts/:amount', (req, res) => {
	db.query('select * from tracker.blogposts limit $1', [req.params.amount]).then(result => {
		res.json(result.rows.map((post, index) => {
			return { title: post.title, content: post.content, timestamp: post.time };
		}));
	});
});

module.exports = app;
