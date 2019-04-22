const db = require('./index');
const { processTorrent, validator } = require('./../util');

const insertMusicRelease = async (release, torrentFile) => {
  const client = await db.pool.connect();
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

    const processedTorrent = processTorrent(torrentFile);

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
    const musicReleaseRes = await db.insertMusicRelease(
      { musicId, releaseInfo: release.info, torrentId },
      client
    );

    const musicReleaseId = musicReleaseRes.rows[0].id;

    await db.commitTransaction(client);

    return {
      torrentId,
      musicId,
      musicReleaseId
    };
  } catch (e) {
    await db.rollbackTransaction(client);
    console.log(e);
    throw e;
    // return res.status(400).json({
    //   error: e
    // });
  } finally {
    client.release();
  }
};

module.exports = insertMusicRelease;
