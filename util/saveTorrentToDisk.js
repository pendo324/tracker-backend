const fs = require('fs');

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

module.exports = saveToDisk;
