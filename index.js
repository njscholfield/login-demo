var mongoose = require('mongoose');
var express = require('express');
var formidable = require('formidable');
var account = require('./account-model.js');
var app = express();

app.set('port', process.env.PORT || 4000);
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
  res.render('index', { data: '', error: '', message: '' });
});

app.post('/', function(req, res) {
  processAllFieldsOfTheForm(req, res);
});

app.get('/accounts/', function(req, res) {
  account.find({}).exec(function(err, result) {
    if(err) {
      console.log('Error finding account ' + err);
    }
      res.render('accounts', { data: result });
  });
});

mongoose.connect(process.env.MONGOLAB_URI, function(err, res) {
  if(err) {
    console.log('ERROR connecting to: ' + process.env.MONGOLAB_URI + '. ' + err);
  } else {
    console.log ('Succeeded, connected to: ' + process.env.MONGOLAB_URI);
  }
});

function processAllFieldsOfTheForm(req, res) {
  var form = new formidable.IncomingForm();

  form.parse(req, function(err, fields, files) {
    //Should also implement username or email already taken warnings
    if(err) {
      console.log('Error parsing form: ' + err);
    } else if(fields['inputPassword'] != fields['inputPassword2']){
      res.render('index', { data: fields, error: 'has-error', message: "Passwords do not match, try again!" });
    } else {
      fields['inputPassword'] = account.hashPassword(fields['inputPassword']);
      var newAcct = new account({
        name: { first: fields['inputFirst'], last: fields['inputLast']},
        email: fields['inputEmail'],
        username: fields['inputUsername'],
        password: fields['inputPassword']
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

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
