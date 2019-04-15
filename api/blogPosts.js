const express = require('express');
const db = require('./../db');

const app = express.Router();

app.get('/blogPosts/:amount', async (req, res) => {
  const result = await db.query('select * from blogposts limit $1', [
    req.params.amount
  ]);

  return res.json(
    result.rows.map((post) => {
      return {
        title: post.title,
        content: post.content,
        timestamp: post.time
      };
    })
  );
});

module.exports = app;
