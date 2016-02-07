var mongoose = require('mongoose');
var express = require('express');
var formidable = require('formidable');
var bcrypt = require('bcrypt');
var app = express();

app.set('port', process.env.PORT || 4000);
app.set('view engine', 'ejs');

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
      res.render('accounts', { data: result });
  });
});

app.get('/login/', function(req, res) {
  res.render('login', { message: '', error: {} });
});

app.post('/login/', function(req, res) {
  loginAttempt(req, res);
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
      res.render('index', { data: fields, error: 'has-error', message: "Passwords do not match, try again!" });
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
            res.redirect('/accounts/');
          });
        }
      });
    }
  });
}

function loginAttempt(req, res) {
  var form = formidable.IncomingForm();

  form.parse(req, function(err, fields, files) {
    if(err) {
      console.log('Error parsing form: ' + err);
    } else {
      account.find({'username': fields['loginUsername']}).exec(function(err, result) {
        var password;
        result.forEach(function(obj) {
          password = obj.password;
        });
        if(result.toArray().length == 0) {
          res.render('/login/', { message: 'Username not found, try again!', error: { 'username': 'has-error'} });
        } else {
          bcrypt.compare(fields['loginPassword'], password, function(err, isMatch) {
            if(err) {
              console.log('Error checking password: ' + err);
            } else {
              if(isMatch) {
                res.redirect('/accounts/');
              } else {
                res.render('login', { message: 'Incorrect password, try again!', error: { 'password': 'has-error'} });
              }
            }
          });
        }
      });
    }
  });
}

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
