const express = require('express');
const multer = require('multer');
const bencode = require('bencode');
const cyrpto = require('crypto');
const db = require('./../db.js');
const _ = require('lodash');

const app = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `/home/justin/torrents/${(new Date).getMonth()}`);
  },
  filename: (req, file, cb) => {
    cb(null, file.hash);
  }
});

const fileFilter = (req, file, cb) => {
  file.hash = hashTorrent(stripTrackers(file.buffer));
  cb(null, true);
};

const upload = multer({ storage, fileFilter });

const stripTrackers = torrentBuffer => {
  const torrent = bencode.decode(torrentBuffer);
  delete torrent.announce;
  return bencode.encode(torrent);
};

const hashTorrent = torrentBuffer => {
  const hash = crypto.createHash('sha256');
  const code = process.env.COOKIE_SECRET + torrentBuffer.toString() + Math.floor((new Date).getTime() / 1000).toString();
  hash.update(code);
  return hash.digest('hex');
};

const verifyAlbum = group => {
  const requiredFields = ['artist', 'album', 'year', 'release_type', 'format', 'bitrate', 'media'];
  const allowedFields = ['artist', 'album', 'year', 'release_type', 'format', 'bitrate', 'media'];

  const verifiedGroup = new Map();

  Object.entries(group).forEach(entry => {
    let key = entry[0];
    let value = entry[1];

    if (allowedFields.includes(key)) {
      verifiedGroup.set(key, value);
    }
  });

  requiredField.forEach(field => {
    if (!verifiedGroup.has(field)) {
      return Promise.reject(new Error('Missing required fields.'));
    }
  })

  return Promise.resolve(verifiedGroup);
};

const upTo = to => {
  let upToArray = [];
  for (let i = 1; i <= to; i++) {
    upToArray.push(`$${i}`);
  }
  return upToArray.toString();
};

const createGroup = group => {
  return verifyAlbum(group).then(verifiedGroup => {
    const keys = verifiedGroup.keys();
    const values = verifiedGroup.values();
    const length = verifiedGroup.size();

    return db.query(`insert into tracker.groups (${keys.toString()}) values (${upTo(length)}) return id`, values);
  });
};

const store = (torrent, group) => {
  return db.query('insert into tracker.torrents (hash, path, group) values ($1, $2, $3)', [torrent.hash, torrent.path, group]);
};

app.post('/upload', upload.fields([{ name: 'torrent', maxCount: 1 }]), (req, res) => {
  let group = req.body.group;
  if (typeof (group) !== 'Number') {
    createGroup(group).then(result => {
      group = result.rows[0].id;
    }).catch(err => {
      res.send(400);
    });
  }
  store(req.file, group).then(result => {
    const torrentId = result.rows[0].id;
    if (torrentId) {
      res.send(200, { id: torrentId });
    }
  });
});

module.exports = app;
