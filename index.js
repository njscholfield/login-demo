var mongoose = require('mongoose');
var express = require('express');
var formidable = require('formidable');
var app = express();

app.set('port', process.env.PORT || 4000);
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
  res.render('index', {});
});

app.post('/', function(req, res) {
  processAllFieldsOfTheForm(req, res);
  setTimeout(function() {
    res.redirect('/accounts/');
  }, 500);
});

app.get('/accounts/', function(req, res) {
  account.find({}).exec(function(err, result) {
    if(err) {
      console.log('Error finding account ' + err);
    } else {
      res.render('accounts', { data: result });
    }
  });
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

var account = mongoose.model('Account', accountSchema);

function processAllFieldsOfTheForm(req, res) {
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {
      if(err) {
        console.log('Error parsing form: ' + err);
      } else {
        var newAcct = new account({
          name: { first: fields['inputFirst'], last: fields['inputLast']},
          email: fields['inputEmail'],
          username: fields['inputUsername'],
          password: fields['inputPassword']
        });
        newAcct.save(function(err) {if(err) console.log('Error saving account: ' + err)});
      }
    });
}

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
