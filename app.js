const express = require('express');
const fs = require('fs');
const https = require('https');
const subdomain = require('express-subdomain');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

require('dotenv').config(); // load local .env file into process.ENV

const db = require('./db.js');
const secret = process.env.COOKIE_SECRET;
const ports = [80, 443];

const app = express();

// SSL
const server = https.createServer({
    key: fs.readFileSync('./keys/privkey.pem'),
    cert: fs.readFileSync('./keys/cert.pem')
  },
  app
);

// allows post data to be accessed in routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// cookieParser and session should use the same secret
app.use(cookieParser(secret));

app.use(session({
  store: new pgSession({
    pg : db.pg,
    conString : process.env.DATABASE_URL, 
    schemaName : 'tracker'
  }),
  rolling: false,
  resave: true,
  secret: secret,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
}));

server.listen(ports[1]);
app.listen(ports[0]);

// set headers for all routes
app.all('/*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', 'http://topkek.us:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT');
  res.header('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');

  next();
});

// login API route
app.use(subdomain('api', require('./api')));

app.use(subdomain('tracker', require('./tracker')));
