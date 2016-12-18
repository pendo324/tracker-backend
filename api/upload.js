const express = require('express');
const multer = require('multer');
const bencode = require('bencode');
const crypto = require('crypto');
const db = require('./../db.js');
const fs = require('fs');

const app = express.Router();

const util = require('util');

/*const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    console.log(util.inspect(file));

    cb(null, `${process.env.TORRENT_DIR}${year}/${month}/`);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.hash}.torrent`);
  }
});*/

const saveToDisk = torrent => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const path = `${process.env.TORRENT_DIR}${year}/${month}/${torrent.hash}.torrent`;

  return new Promise((resolve, reject) => {
    fs.writeFile(path, new Buffer(torrent.buffer), err => {
      if (err) {
        return reject(err);
      }
      torrent.path = path;
      return resolve(torrent);
    });
  });
};

const storage = multer.memoryStorage();

const upload = multer({ storage });

const stripTrackers = torrentBuffer => {
  const torrent = bencode.decode(torrentBuffer);
  delete torrent['announce'];
  return bencode.encode(torrent);
};

const hashTorrent = torrentBuffer => {
  const hash = crypto.createHash('sha256');
  const code = process.env.COOKIE_SECRET + torrentBuffer.toString('utf8') + Math.floor((new Date).getTime() / 1000).toString();
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

  requiredFields.forEach(field => {
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
    const length = verifiedGroup.size;

    return db.query(`insert into tracker.groups (${keys.toString()}) values (${upTo(length)}) return id`, values);
  });
};

const store = (torrent, group) => {
  return db.query('insert into tracker.torrents (hash, path, group) values ($1, $2, $3)', [torrent.hash, torrent.path, group]);
};

const torrentUpload = upload.fields([{ name: 'torrent', maxCount: 1 }]);

app.post('/upload', torrentUpload, (req, res) => {
  //app.post('/upload', upload.single('torrent'), (req, res) => {
  const torrent = stripTrackers(req.files.torrent[0].buffer);
  const group = JSON.parse(req.body.group);

  torrent.hash = hashTorrent(torrent.buffer);
  
  saveToDisk(torrent).then(torrent => {
    if (typeof (group) !== 'Number') {
      return createGroup(group).then(result => {
        group = result.rows[0].id;
        return group
      }).then(group => {
        return store(torrent, group).then(result => {
          const torrentId = result.rows[0].id;
          if (torrentId) {
            res.send(200, { id: torrentId });
          }
        });
      })
    }
  }).catch(err => {
    console.log(err);
    res.sendStatus(500);
  });
});

module.exports = app;
