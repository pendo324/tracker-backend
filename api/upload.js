const fs = require('fs');
const express = require('express');
const multer = require('multer');
const bencode = require('bencode');
const crypto = require('crypto');
const { ulid } = require('ulid');
const db = require('./../db');

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
 * @param torrent - torrent object
 * @return {Promise<Object>} torrent object with path attached
 */
const saveToDisk = async (torrent) => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const path = `${process.env.TORRENT_DIR}${year}/${month}/${
    torrent.hash
  }.torrent`;

  await fs.promises.writeFile(path, Buffer.from(torrent.buffer));
  torrent.path = path;
  return torrent;
};

const storage = multer.memoryStorage();

const upload = multer({ storage });

const hashTorrent = (torrentBuffer) => {
  const hash = crypto.createHash('sha256');
  const code = `${process.env.SECRET}${torrentBuffer.toString(
    'utf8'
  )}${Math.floor(new Date().getTime() / 1000).toString()}`;
  hash.update(code);
  return hash.digest('hex');
};

/**
 * Processes a torrent
 *
 * Removes trackers from torrent
 * Adds fileList and hash fields to the torrent
 *
 * @param torrent - torrent object
 * @return {Object} torrent object with buffer and hash attached
 */
const processTorrent = async (torrent) => {
  const decodedTorrent = bencode.decode(torrent.buffer);
  delete decodedTorrent.announce;

  torrent.fileList = [];
  torrent.totalFileSize = decodedTorrent.info.files.reduce((total, file) => {
    torrent.fileList.push({ fileName: file.path, fileSize: file.length });
    total += file.length;
    return total;
  }, 0);

  torrent.buffer = bencode.encode(decodedTorrent);
  torrent.hash = hashTorrent(torrent.buffer);

  return torrent;
};

/**
 * Verifies an Object
 *
 * Object verified against an element of verificationTypes
 * Removes all extraneous fields on the input Object
 * Throws error if required fields are missing
 *
 * @param input - Object to be verified
 * @param type - Field of the verificationTypes object
 * @return {Promise<Map<torrent>>}
 */
const verify = async (input, type) => {
  const { required } = type;
  const { allowed } = type;
  const errMsg = type.errorMessage || 'Missing required fields.';

  const verified = new Map();
  Object.entries(input).forEach((entry) => {
    const key = entry[0];
    const value = entry[1];

    if (allowed.includes(key)) {
      verified.set(key, value);
    }
  });

  await Promise.all(
    required.map(async (field) => {
      if (!verified.has(field)) {
        throw new Error(errMsg);
      }
    })
  );

  return verified;
};

const upTo = (to, startAt = 1) => {
  const upToArray = [];
  for (let i = startAt; i <= to; i++) {
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
 * @param {Object} group - group user input
 * @return {Promise<number>} The group number associated with a torrent
 */
const getGroup = async (group) => {
  if (typeof group === 'number') {
    return group;
  }

  const verifiedGroup = verify(group, verificationTypes.group.album);
  const keys = verifiedGroup.keys();
  const values = verifiedGroup.values();
  const length = verifiedGroup.size;

  const res = await db.query(
    `insert into groups (${[...keys].toString()}) values (${upTo(
      length + 1
    )}) returning id`,
    [ulid(), ...values]
  );
  group = res.rows[0].id;
  return group;
};

/**
 * Stores a release to the database
 *
 * Verifies the releaseInfo and adds all of the metadata that is obtained from
 * the other functions
 *
 * @async
 * @param {Object} torrent - slightly modified user inputted torrent
 * @param {number} group - group (user inputted id or new group id)
 * @param {Object} releaseInfo - extra user provided data
 * @return {Promise<Object>} The data associated with a persisted torrent
 */
const store = async (torrent, group, releaseInfo) => {
  const verifiedRelease = await verify(
    releaseInfo,
    verificationTypes.release.album
  );
  // Add more information to the verified user input
  verifiedRelease.set('group_id', group);
  verifiedRelease.set('file_size', torrent.totalFileSize);
  verifiedRelease.set('original_file_name', torrent.originalname);
  verifiedRelease.set('file_path', torrent.path);
  verifiedRelease.set('files', JSON.stringify(torrent.fileList));

  const keys = verifiedRelease.keys();
  const values = verifiedRelease.values();
  const length = verifiedRelease.size;

  const res = await db.query(
    `insert into torrents (${[...keys].toString()}) values (${upTo(
      length + 1
    )}) returning id, group_id`,
    [ulid(), ...values]
  );
  return {
    groupId: res.rows[0].group_id,
    torrentId: res.rows[0].id
  };
};

const torrentUpload = upload.fields([{ name: 'torrent', maxCount: 1 }]);

app.post('/upload', torrentUpload, async (req, res) => {
  const incomingTorrent = req.files.torrent[0];
  const incomingGroup = JSON.parse(req.body.group);
  const releaseInfo = JSON.parse(req.body.info);

  try {
    const processedTorrent = processTorrent(incomingTorrent);
    const torrentWithPath = await saveToDisk(processedTorrent);
    const group = await getGroup(incomingGroup);
    const persistedTorrent = await store(torrentWithPath, group, releaseInfo);
    res.status(200).send(persistedTorrent);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

module.exports = app;
