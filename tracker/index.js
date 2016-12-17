const Server = require('bittorrent-tracker').Server;
const db = require('../db.js');
const express = require('express');

const app = express.Router();

const server = new Server({
  udp: false,
  http: false,
  ws: false,
  stats: true,
  filter: (infoHash, params, cb) => {
    console.log(params);
    cb(true);
  }
});

server.on('error', err => {
  console.log(err);
}).on('listening', () => {
  console.log('listening on http port:' + server.http.address().port);
  console.log('listening on udp port:' + server.udp.address().port);
});

const onHttpRequest = server.onHttpRequest.bind(server);

app.get('/:secret/announce', (req, res) => {
  db.checkSecret(req.params.secret).then(result => {
    onHttpRequest(req, res, { action: 'announce' });
  }).catch(err => {
    res.send(200);
  })
});

module.exports = app;
