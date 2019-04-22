const express = require('express');
const multer = require('multer');
const db = require('./../db');

const app = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

const torrentUpload = upload.fields([{ name: 'torrent', maxCount: 1 }]);
app.post('/upload', torrentUpload, async (req, res) => {
  const release = JSON.parse(req.body.release);
  const torrentFile = req.files.torrent[0];

  try {
    if (release.torrentType === 'music') {
      const {
        torrentId,
        musicId,
        musicReleaseId
      } = await db.createMusicRelease(release, torrentFile);
      return res.json({
        torrentId,
        musicId,
        musicReleaseId
      });
    }
    if (release.torrentType === 'movie') {
      const {
        torrentId,
        movieId,
        videoReleaseId
      } = await db.createMovieRelease(release, torrentFile);

      return res.json({
        torrentId,
        movieId,
        videoReleaseId
      });
    }
    if (release.torrentType === 'tv') {
      const { torrentId, tvId, videoReleaseId } = await db.createTVRelease(
        release,
        torrentFile
      );

      return res.json({
        torrentId,
        tvId,
        videoReleaseId
      });
    }
    if (release.torrentType === 'anime') {
      const {
        torrentId,
        animeId,
        videoReleaseId
      } = await db.createAnimeRelease(release, torrentFile);

      return res.json({
        torrentId,
        animeId,
        videoReleaseId
      });
    }
    if (release.torrentType === 'software') {
      const { torrentId, softwareId } = await db.createSoftwareRelease(
        release,
        torrentFile
      );

      return res.json({
        torrentId,
        softwareId
      });
    }
    if (release.torrentType === 'video-game') {
      const { torrentId, videoGameId } = await db.createVideoGameRelease(
        release,
        torrentFile
      );

      return res.json({
        torrentId,
        videoGameId
      });
    }
    return res.sendStatus(400);
  } catch (e) {
    return res.status(500).json({
      error: e
    });
  }
});

module.exports = app;
