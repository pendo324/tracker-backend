const crypto = require('crypto');
const bencode = require('bencode');

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

module.exports = processTorrent;
module.exports.hashTorrent = hashTorrent;
