var mongoose = require('mongoose');
var express = require('express');
var formidable = require('formidable');
var bcrypt = require('bcrypt');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var app = express();

app.set('port', process.env.PORT || 4000);
app.set('view engine', 'ejs');
app.set('trust proxy');
app.use(session({store: new RedisStore({url: process.env.REDIS_URL}), secret: '1234567890QWERTY', resave: true,
  saveUninitialized: true,
  cookie: { secure: true }
}));

app.get('/', function(req, res) {
  res.render('register', { data: '', error: '', message: '' });
});

app.post('/', function(req, res) {
  registerNewAccount(req, res);
});

app.get('/accounts/', function(req, res) {
  account.find({}).exec(function(err, result) {
    if(err) {
      console.log('Error finding account ' + err);
    }
      console.log('req.session.username (render) = ' + req.session.username);
      res.render('accounts', { data: result, username: req.session.username });
  });
});

app.get('/login/', function(req, res) {
  if(req.session.username) {
    res.render('myaccount', { username: req.session.username });
  } else {
    res.render('login', { message: '', error: {} });
  }
});

app.post('/login/', function(req, res) {
  req.session.username = loginAttempt(req, res);
  console.log('post login: ' + req.session.username);
});

mongoose.connect(process.env.MONGOLAB_URI, function(err, res) {
  if(err) {
    console.log('ERROR connecting to: ' + process.env.MONGOLAB_URI + '. ' + err);
  } else {
    console.log ('Succeeded, connected to: ' + process.env.MONGOLAB_URI);
  }
});

var accountSchema = new mongoose.Schema({
  name: {
    first: { type: String, required: true },
    last: { type: String, required: true }
  },
  email: { type: String, required: true, index: { unique: true } },
  username: { type: String, required: true, index: { unique: true } },
  password: { type: String, required: true }
});
var account = mongoose.model('account', accountSchema);

function registerNewAccount(req, res) {
  var form = new formidable.IncomingForm();

  form.parse(req, function(err, fields, files) {
    //Should also implement username or email already taken warnings
    if(err) {
      console.log('Error parsing form: ' + err);
    } else if(fields['inputPassword'] != fields['inputPassword2']){
      res.render('register', { data: fields, error: 'has-error', message: "Passwords do not match, try again!" });
    } else {
      bcrypt.hash(fields['inputPassword'], 15, function(err, hash) {
        if(err) {
          console.log('Error hashing password: ' + err);
        } else {
          var newAcct = new account({
            name: { first: fields['inputFirst'], last: fields['inputLast']},
            email: fields['inputEmail'],
            username: fields['inputUsername'],
            password: hash
          });
          newAcct.save(function(err) {
            if(err) {
              console.log('Error saving account: ' + err);
            }
            req.session.username = fields['inputUsername'];
            console.log('req.session.username (assign) = ' + req.session.username);
            res.redirect('/accounts/');
          });
        }
      });
    }
  });
}

function loginAttempt(req, res) {
  var form = formidable.IncomingForm();
  var user;

  form.parse(req, function(err, fields, files) {
    if(err) {
      console.log('Error parsing form: ' + err);
    } else {
      account.find({'username': fields['loginUsername']}).exec(function(err, result) {
        var password;
        result.forEach(function(obj) {
          password = obj.password;
        });
        if(err || !password) {
          res.render('login', { message: 'Username not found, try again!', error: { 'username': 'has-error'} });
        } else {
          bcrypt.compare(fields['loginPassword'], password, function(err, isMatch) {
            if(err) {
              console.log('Error checking password: ' + err);
            } else {
              if(isMatch) {
                user = fields['loginUsername'];
                console.log('User (assign) = ' + user);
                res.render('myaccount', { username: user } );
              } else {
                res.render('login', { message: 'Incorrect password, try again!', error: { 'password': 'has-error'} });
              }
            }
          });
        }
      });
    }
  });
  console.log('User (return) = ' + user);
  return user;
}

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
