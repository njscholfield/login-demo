var mongoose = require('mongoose');
var express = require('express');
var app = express();
var data;

app.set('port', process.env.PORT || 4000);
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
  account.find({}).exec(function(err, result) {
    if(err) {
      console.log('Error finding account ' + err);
    } else {
      res.render('index', { data: JSON.stringify(result, undefined, 2) });
    }
  });
});

mongoose.connect(process.env.MONGOLAB_URI, function(err, res) {
  if(err) {
    console.log('ERROR connecting to: ' + process.env.MONGOLAB_URI + '. ' + err);
  } else {
    console.log ('Succeeded connected to: ' + process.env.MONGOLAB_URI);
  }
});

var accountSchema = new mongoose.Schema({
  name: {
    first: { type: String, required: true },
    last: { type: String, required: true }
  },
  username: { type: String, required: true, index: { unique: true } },
  password: { type: String, required: true }
});

var account = mongoose.model('Account', accountSchema);

var noahScholfield = new account({
  name: { first: 'Noah', last: 'Scholfield'},
  username: 'njscholfield',
  password: 'password'
});

noahScholfield.save(function (err) {if (err) console.log ('Error on save!')});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
