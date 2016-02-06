var mongoose = require('mongoose');
var express = require('express');
var formidable = require('formidable');
var app = express();

app.set('port', process.env.PORT || 4000);
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
  res.render('index', { data: '', error: '', message: '' });
});

app.post('/', function(req, res) {
  var success = processAllFieldsOfTheForm(req, res);
  console.log('Value after return: ' + success);
  if(success) {
    setTimeout(function() {
      res.redirect('/accounts/');
    }, 500);
  }
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
    var succeeded = true;

    form.parse(req, function(err, fields, files) {
      if(err) {
        console.log('Error parsing form: ' + err);
      } else if(fields['inputPassword'] != fields['inputPassword2']){
        succeeded = false;
        console.log('Value after assignment: ' + succeeded);
        res.render('index', { data: fields, error: 'has-error', message: "Passwords do not match, try again!" });
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
    console.log('Value before being returned: ' + succeeded);
    return succeeded;
}

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
