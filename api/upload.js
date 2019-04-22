const fs = require('fs');
const express = require('express');
const multer = require('multer');
const bencode = require('bencode');
const crypto = require('crypto');
const db = require('./../db');
const validator = require('./validator');

const app = express.Router();

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
const processTorrent = (torrent) => {
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

const torrentUpload = upload.fields([{ name: 'torrent', maxCount: 1 }]);

app.post('/upload', torrentUpload, async (req, res) => {
  const release = JSON.parse(req.body.release);
  const client = await db.pool.connect();

  if (release.torrentType === 'music') {
    const musicReleaseTypes = (await db.getMusicReleaseTypes()).rows;
    const musicQualities = (await db.getMusicQualities()).rows;
    try {
      await validator.validateMusic({
        release,
        musicReleaseTypes,
        musicQualities
      });

      // valid if doesn't throw
      await Promise.all(release.artists.map(validator.validateArtist));

      await db.beginTransaction(client);

      let musicId = release.music;
      // insert music if necessary
      if (release.music instanceof Object) {
        // music comes with at least 1 associated artist
        // insert the artist(s) if they are not ids
        const artistsToInsert = release.artists.filter((artist) =>
          Object.prototype.hasOwnProperty.call(artist, 'name')
        );
        const artistIds = release.artists.filter((artist) =>
          Object.prototype.hasOwnProperty.call(artist, 'id')
        );
        const insertedArtists = await db.insertArtists(artistsToInsert, client);
        const artistsToLink = [...artistIds, ...insertedArtists];

        // insert music and assign it to musicId to be used to create the music_release
        const insertMusicRes = await db.insertMusic(
          {
            music: release.music,
            artistsToLink
          },
          client
        );
        musicId = insertMusicRes.rows[0].id;
      }

      const processedTorrent = processTorrent(req.files.torrent[0]);

      // insert torrent
      const torrentRes = await db.insertTorrent(
        {
          fileSize: processedTorrent.totalFileSize,
          originalFileName: processedTorrent.originalname,
          filePath: '/',
          files: processedTorrent.fileList,
          uploaderId: '01D91F1JSSW4X5DNKSVPD2J3EM'
        },
        client
      );

      const torrentId = torrentRes.rows[0].id;

      // insert music release
      await db.insertMusicRelease(
        { musicId, releaseInfo: release.info, torrentId },
        client
      );

      await db.commitTransaction(client);
    } catch (e) {
      await db.rollbackTransaction(client);
      console.log(e);
      return res.status(400).json({
        error: e
      });
    } finally {
      client.release();
    }
  } else if (release.torrentType === 'movie') {
    try {
      await validator.validateMovie({
        release
      });

      await db.beginTransaction(client);

      let movieId = release.movie;
      if (release.movie instanceof Object) {
        const movieRes = await db.insertMovie(
          {
            name: release.movie.name,
            description: release.movie.description,
            year: release.movie.year
          },
          client
        );

        movieId = movieRes.rows[0].id;
      }

      const processedTorrent = processTorrent(req.files.torrent[0]);

      // insert torrent
      const torrentRes = await db.insertTorrent(
        {
          fileSize: processedTorrent.totalFileSize,
          originalFileName: processedTorrent.originalname,
          filePath: '/',
          files: processedTorrent.fileList,
          uploaderId: '01D91F1JSSW4X5DNKSVPD2J3EM'
        },
        client
      );

      const torrentId = torrentRes.rows[0].id;

      await db.insertVideoRelease(
        {
          videoId: movieId,
          quality: release.info.quality,
          title: release.info.title,
          description: release.info.description,
          torrentId
        },
        client
      );

      await db.commitTransaction(client);
    } catch (e) {
      await db.rollbackTransaction(client);
      console.log(e);
      return res.status(400).json({
        error: e
      });
    } finally {
      client.release();
    }
  } else if (release.torrentType === 'tv') {
  } else if (release.torrentType === 'anime') {
  } else if (
    release.torrentType === 'software' ||
    release.torrentType === 'video-game'
  ) {
  } else {
    return res.sendStatus(400);
  }
  res.sendStatus(200);
});

module.exports = app;
