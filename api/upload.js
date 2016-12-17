const express = require('express');
const multer = require('multer');
const cyrpto = require('crypto');
const db = require('./../db.js');
const _ = require('lodash');

const app = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `/home/justin/torrents/${(new Date).getMonth()}`);
  },
  filename: (req, file, cb) => {
    cb(null, file.hash);
  }
});

const hashTorrent = (torrentBuffer) => {

};