const { Server } = require('bittorrent-tracker');
const express = require('express');
const db = require('../db');

const app = express.Router();

const server = new Server({
  udp: false,
  http: false,
  ws: false,
  stats: true,
  filter: (_infoHash, params, cb) => {
    console.log(params);
    cb(true);
  }
});

server
  .on('error', (err) => {
    console.log(err);
  })
  .on('listening', () => {
    console.log(`listening on http port:${server.http.address().port}`);
    console.log(`listening on udp port:${server.udp.address().port}`);
  });

const onHttpRequest = server.onHttpRequest.bind(server);

app.get('/:secret/announce', async (req, res) => {
  try {
    const result = await db.checkSecret(req.params.secret);
    console.log(result);
    onHttpRequest(req, res, { action: 'announce' });
  } catch (_err) {
    res.send(200);
  }
});

module.exports = app;
