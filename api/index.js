const express = require('express');

const app = express.Router();

// routes
const createAccount = require('./createAccount.js');
const login = require('./login.js');
// const unauthorized = require('./unauthorized.js');
const logged = require('./isLoggedIn.js');
const activate = require('./activate.js');
const blogPosts = require('./blogPosts.js');
const upload = require('./upload.js');

app.use(login);
app.use(createAccount);
app.use(activate);
app.use(blogPosts);
// app.use(unauthorized);
app.use(logged);
app.use(upload);

module.exports = app;
