const express = require('express');
const fs = require('fs');
const https = require('https');
const subdomain = require('express-subdomain');
const bodyParser = require('body-parser');

require('dotenv').config();

const app = express();

// SSL
const server = https.createServer(
  {
    key: fs.readFileSync('./keys/privkey.pem'),
    cert: fs.readFileSync('./keys/cert.pem')
  },
  app
);

// allows post data to be accessed in routes
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

server.listen(process.env.HTTPS_PORT, '0.0.0.0');
app.listen(process.env.HTTP_PORT, '0.0.0.0');

// set headers for all routes
app.all('/*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT');
  res.header('Access-Control-Allow-Headers', '*');

  next();
});

// login API route
app.use(subdomain('api', require('./api')));

app.use(subdomain('tracker', require('./tracker')));
