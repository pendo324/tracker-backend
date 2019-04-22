const { ulid } = require('ulid');
const { Pool } = require('pg');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  ssl: false
};

const pool = new Pool(config);

// pool.query('truncate users');

const query = (text, values) => {
  return pool.query(text, values);
};

const checkSecret = (secret) => {
  return pool.query('select * from users where secret = $1', [secret]);
};

const checkTorrent = (hash) => {
  return pool.query('select * from torrents where hash = $1', [hash]);
};

const getMusicReleaseTypes = () => {
  return pool.query('select * from music_release_types');
};

const getMusicQualities = () => {
  return pool.query('select * from music_qualities');
};

const pg = pool.client;

const isUlid = ({ test }) => {
  if (!(test instanceof String)) {
    return false;
  }

  if (test.length !== 26) {
    return false;
  }

  return true;
};

const getMusic = (musicId) => {
  if (isUlid({ test: musicId })) {
    return pool.query('select * from music where id = $1', [musicId]);
  }
  return Promise.reject(new Error('Supplied value is not a valid ID.'));
};

const insertArtists = async (artists, client) => {
  const clientOrPool = typeof client === 'undefined' ? pool : client;
  const ids = artists.map(() => ulid());
  const names = artists.map((artist) => artist.name);
  const descriptions = artists.map((artist) => artist.description);

  try {
    await clientOrPool.query(
      'insert into artists (id, name, description) select * from unnest ($1::text[], $2::text[], $3::text[]) returning id',
      [ids, names, descriptions]
    );

    return artists.map((artist, index) => {
      return {
        id: ids[index],
        primary: artist.primary
      };
    });
  } catch (e) {
    console.log(e);
  }
};

const insertMusic = async ({ music, artistsToLink }, client) => {
  const clientOrPool = typeof client === 'undefined' ? pool : client;
  const musicId = ulid();
  const musicRes = await clientOrPool.query(
    'insert into music (id, title, description, year, music_release_id) values ($1, $2, $3, $4, $5) returning id',
    [
      musicId,
      music.title,
      music.description,
      music.year,
      music.musicReleaseType
    ]
  );

  // link linked artists
  const artistIds = artistsToLink.map((artist) => artist.id);
  const musicIds = artistsToLink.map(() => musicId);
  const artistPrimaries = artistsToLink.map((artist) => artist.primary);
  await clientOrPool.query(
    'insert into music_artists (music_id, artist_id, is_primary) select * from unnest ($1::text[], $2::text[], $3::boolean[])',
    [musicIds, artistIds, artistPrimaries]
  );
  return musicRes;
};

const insertMusicRelease = ({ musicId, torrentId, releaseInfo }, client) => {
  const clientOrPool = typeof client === 'undefined' ? pool : client;
  const musicReleaseId = ulid();
  clientOrPool.query(
    'insert into music_releases (id, encoding, quality, music_id, torrent_id, title, description) values ($1, $2, $3, $4, $5, $6, $7)',
    [
      musicReleaseId,
      releaseInfo.encoding,
      releaseInfo.quality,
      musicId,
      torrentId,
      releaseInfo.title,
      releaseInfo.description
    ]
  );
};

const insertTorrent = (
  { fileSize, originalFileName, filePath, files, uploaderId },
  client
) => {
  const clientOrPool = typeof client === 'undefined' ? pool : client;
  return clientOrPool.query(
    'insert into torrents (id, file_size, original_file_name, file_path, files, uploader_id) values ($1, $2, $3, $4, $5, $6) returning id',
    [
      ulid(),
      fileSize,
      originalFileName,
      filePath,
      JSON.stringify(files),
      uploaderId
    ]
  );
};

const getMovie = (movieId) => {
  if (isUlid({ test: movieId })) {
    return pool.query('select * from movies where id = $1', [movieId]);
  }
  return Promise.reject(new Error('Supplied value is not a valid ID.'));
};

const insertMovie = ({ name, description, year }, client) => {
  const clientOrPool = typeof client === 'undefined' ? pool : client;
  return clientOrPool.query(
    'insert into movies (id, name, description, year) values ($1, $2, $3, $4) returning id',
    [ulid(), name, description, year]
  );
};

const insertVideoRelease = (
  { videoId, quality, title, description, torrentId },
  client
) => {
  const clientOrPool = typeof client === 'undefined' ? pool : client;
  return clientOrPool.query(
    'insert into video_releases (id, video_id, quality, title, description, torrent_id) values ($1, $2, $3, $4, $5, $6) returning id',
    [ulid(), videoId, quality, title, description, torrentId]
  );
};

const beginTransaction = (client) => client.query('begin');

const commitTransaction = (client) => client.query('commit');

const rollbackTransaction = (client) => client.query('rollback');

module.exports = {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  query,
  checkSecret,
  checkTorrent,
  getMusicQualities,
  getMusicReleaseTypes,
  pg,
  getMusic,
  insertArtists,
  insertMusic,
  insertMusicRelease,
  insertTorrent,
  getMovie,
  insertMovie,
  insertVideoRelease,
  pool
};
