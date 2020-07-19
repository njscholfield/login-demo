var express = require('express');
var redis = require('redis');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var account = require('./account.js');
var app = express();

app.set('trust proxy');
var client = redis.createClient(process.env.REDIS_URL);
app.use(session({ store: new RedisStore({ client }), secret: process.env.SESSION_SECRET, resave: true, saveUninitialized: true }));
app.set('port', process.env.PORT);
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
  req.session.test = 'This is a username';
  res.render('register', { username: req.session.username, data: {}, error: {}, message: {} });
});

app.post('/', function(req, res) {
  account.registerNewAccount(req, res);
});

app.get('/about/', function(req, res) {
  res.render('about', { username: req.session.username });
});

app.get('/test/', function(req, res) {
  console.log('/test/' + req.session.test);
  if(req.session.test) {
    res.write(req.session.test);
  } else {
    res.write('Error: test value has no value.');
  }
  res.end();
});

app.get('/accounts/', function(req, res) {
  account.getAllAccounts(req, res);
});

app.get('/login/', function(req, res) {
  if(req.session.username) {
    res.render('myaccount', { username: req.session.username, message: {}, error: {} });
  } else {
    res.render('login', { username: '', message: '', error: {} });
  }
});

app.post('/login/', function(req, res) {
  if(req.session.username) {
    account.changePassword(req, res);
  } else {
    account.loginAttempt(req, res);
  }
});

app.get('/logout/', function(req, res) {
  req.session.destroy();
  res.redirect('/login/');
});

app.get('/user/:username', function(req, res) {
  account.findAccount(req, res, req.params.username);
});

app.post('/delete-account/', function(req, res) {
  account.deleteAccount(req, res);
});

app.get('/forgot/', function(req, res) {
  res.render('forgot', { message: {} } );
});

app.post('/forgot/', function(req, res) {
  account.forgotPassword(req, res);
});

app.get('/reset/:id', function(req, res) {
  res.render('reset', { error: {}, message: {}, id: req.params.id, token: req.query.tkn } );
});

app.post('/reset/', function (req, res) {
  account.resetPassword(req, res);
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
