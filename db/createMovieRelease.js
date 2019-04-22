const db = require('./index');
const { processTorrent, validator } = require('./../util');

const createMovieRelease = async (release, torrentFile) => {
  await validator.validateMovie({
    release
  });

  const client = await db.pool.connect();

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

  const videoReleaseRes = await db.insertVideoRelease(
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

  return {
    torrentId,
    movieId,
    videoReleaseId: videoReleaseRes.rows[0].id
  };
};

module.exports = createMovieRelease;
