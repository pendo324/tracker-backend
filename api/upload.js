const express = require('express');
const multer = require('multer');
const bencode = require('bencode');
const crypto = require('crypto');
const db = require('./../db.js');
const fs = require('fs');

const app = express.Router();

const verificationTypes = {
  group: {
    album: {
      required: ['artist', 'album', 'original_release_year'],
      allowed: ['artist', 'album', 'original_release_year'],
      errorMessage: 'Album group is missing information.'
    }
  },
  release: {
    album: {
      required: ['release_type', 'format', 'bitrate', 'media'],
      allowed: ['release_type', 'format', 'bitrate', 'media'],
      errorMessage: 'Album is missing information.'
    }
  }
};

/**
 * Saves torrent file to disk
 *
 * Saves torrent to the path defined in the .env file.
 * Also adds a path property to the torrent Object
 * 
 * @param  torrent: torrent Object
 * @return Promise<torrent | error>
 */
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

/**
 * Processes a torrent
 *
 * Removes trackers from torrent
 * Adds fileList and hash fields to the torrent
 * 
 * @param  torrent: torrent Object
 * @return Promise<torrent | error>
 */
const processTorrent = torrent => {
  const decodedTorrent = bencode.decode(torrent.buffer);
  delete decodedTorrent['announce'];

  torrent.fileList = [];
  torrent.totalFileSize = decodedTorrent.info.files.reduce((total, file) => {
    torrent.fileList.push({ fileName: file.path, fileSize: file.length });
    return total += file.length;
  }, 0);

  torrent.buffer = bencode.encode(decodedTorrent);
  torrent.hash = hashTorrent(torrent.buffer);

  return Promise.resolve(torrent);
};

const hashTorrent = torrentBuffer => {
  const hash = crypto.createHash('sha256');
  const code = process.env.COOKIE_SECRET + torrentBuffer.toString('utf8') + Math.floor((new Date).getTime() / 1000).toString();
  hash.update(code);
  return hash.digest('hex');
};

/**
 * Verifies an Object
 *
 * Object verified against an element of verificationTypes
 * Removes all extraneous fields on the input Object
 * Throws error if required fields are missing
 * 
 * @param  input: Object to be verified
 * @param  type: Field of the verificationTypes Object
 * @return Promise<Map<torrent> | error>
 */
const verify = (input, type) => {
  const required = type.required;
  const allowed = type.allowed;
  const errMsg = type.errorMessage || 'Missing required fields.';

  const verified = new Map();
  Object.entries(input).forEach(entry => {
    let key = entry[0];
    let value = entry[1];

    if (allowed.includes(key)) {
      verified.set(key, value);
    }
  });

  required.forEach(field => {
    if (!verified.has(field)) {
      return Promise.reject(new Error(errMsg));
    }
  });

  return Promise.resolve(verified);
};

const upTo = to => {
  let upToArray = [];
  for (let i = 1; i <= to; i++) {
    upToArray.push(`$${i}`);
  }
  return upToArray.toString();
};

/**
 * Gets the group_id that the input torrent should use
 *
 * Either uses the user provided group number or creates a new group if the
 * user provides one, or creates a new group from the user provided data
 * 
 * @param  group: group user input
 * @return Promise<number | error>
 */
const getGroup = group => {
  if (typeof (group) === 'number') {
    return Promise.resolve(group);
  }
  return verify(group, verificationTypes.group.album).then(verifiedGroup => {
    const keys = verifiedGroup.keys();
    const values = verifiedGroup.values();
    const length = verifiedGroup.size;

    return db.query(`insert into tracker.groups (${[...keys].toString()}) values (${upTo(length)}) returning id`,
      [...values]).then(result => {
        group = result.rows[0].id;
        return group;
      });
  });
};

/**
 * Stores a release to the database
 *
 * Verifies the releaseInfo and adds all of the metadata that is obtained from
 * the other functions
 * 
 * @param  torrent: slightly modified user inputted torrent
 * @param  group: group (user inputted id or new group id)
 * @param  releaseInfo: extra user provided data
 * @return Promise<number | error>
 */
const store = (torrent, group, releaseInfo) => {
  return verify(releaseInfo, verificationTypes.release.album).then(verifiedRelease => {
    // Add more information to the verified user input
    verifiedRelease.set('group_id', group);
    verifiedRelease.set('file_size', torrent.totalFileSize);
    verifiedRelease.set('original_file_name', torrent.originalname);
    verifiedRelease.set('file_path', torrent.path);
    verifiedRelease.set('files', JSON.stringify(torrent.fileList));

    const keys = verifiedRelease.keys();
    const values = verifiedRelease.values();
    const length = verifiedRelease.size;

    return db.query(`insert into tracker.torrents (${[...keys].toString()}) values (${upTo(length)}) returning id, group_id`,
      [...values]).then(result => {
        return {
          groupId: result.rows[0].group_id,
          torrentId: result.rows[0].id
        };
      });
  })
};

const torrentUpload = upload.fields([{ name: 'torrent', maxCount: 1 }]);

app.post('/upload', torrentUpload, (req, res) => {
  const torrent = req.files.torrent[0];
  const group = JSON.parse(req.body.group);
  const releaseInfo = JSON.parse(req.body.info);

  processTorrent(torrent).then(saveToDisk).then(torrent => {
    return getGroup(group).then(group => {
      return store(torrent, group, releaseInfo).then(output => {
        res.status(200).send(output);
      });
    });
  }).catch(err => {
    console.log(err);
    res.sendStatus(500);
  });
});

module.exports = app;
