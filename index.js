var express = require('express');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var account = require('./account.js');
var app = express();

app.set('trust proxy');
app.use(session({ store: new RedisStore({url: process.env.REDIS_URL}), secret: process.env.SESSION_SECRET, resave: true, saveUninitialized: true }));
app.set('port', process.env.PORT || 4000);
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
  req.session.test = 'This is a username';
  res.render('register', { data: {}, error: {}, message: {} });
});

app.post('/', function(req, res) {
  account.registerNewAccount(req, res);
});

app.get('/test/', function(req, res) {
  console.log('/test/: ' + req.session.test);
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
    res.render('login', { message: '', error: {} });
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

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
