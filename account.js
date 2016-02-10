var mongoose = require('mongoose');
var formidable = require('formidable');
var bcrypt = require('bcrypt');


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

exports.getAllAccounts = function(req, res) {
  account.find({}).exec(function(err, result) {
    if(err) {
      console.log('Error finding account ' + err);
    }
      res.render('accounts', { data: result, username: req.session.username });
  });
}

exports.registerNewAccount = function(req, res) {
  var form = new formidable.IncomingForm();

  form.parse(req, function(err, fields, files) {
    //Should also implement username or email already taken warnings
    if(err) {
      console.log('Error parsing form: ' + err);
    } else {
      if(verifyPassword(req, res, fields, 'register')){
        bcrypt.hash(fields['newPassword1'], 12, function(err, hash) {
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
              var result;
              var hasError = {}
              if(err) {
                console.log('Error saving account: ' + err);
                if(err.code === 11000) {
                  var temp = err.errmsg.split("$", 2)
                  temp = temp[1].split("_", 2);
                  result = 'The ' + temp[0] + ' you entered has already been taken';
                  if(temp[0] == 'email') {
                    hasError = {'email': 'has-error'};
                  } else {
                    hasError = {'username': 'has-error'};
                  }
                } else {
                  result = 'All fields are required';
                }
                res.render('register', { data: fields, error: hasError, message: { 'type': 'text-danger', 'content': result } });
              } else {
                req.session.username = fields['inputUsername'];
                res.redirect('/login/');
              }
            });
          }
        });
      }
    }
  });
}

exports.loginAttempt = function(req, res) {
  var form = formidable.IncomingForm();

  form.parse(req, function(err, fields, files) {
    if(err) {
      console.log('Error parsing form: ' + err);
    } else {
      account.find({'username': fields['loginUsername']}, {password: 1}).exec(function(err, result) {
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
                req.session.username = fields['loginUsername'];
                res.render('myaccount', { username: req.session.username, message: {}, error: {} } );
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

exports.changePassword = function(req, res) {
  var form = formidable.IncomingForm();
  var password;

  form.parse(req, function(err, fields, files) {
    if(err) {
      console.log('Error parsing form: ' + err);
    } else {
      if(verifyPassword(req, res, fields, 'myaccount')) {
        account.find({'username': req.session.username}, {password: 1}).exec(function(err, result) {
          result.forEach(function(obj) {
            password = obj.password;
          });
          bcrypt.compare(fields['currentPassword'], password, function(err, isMatch) {
            if(isMatch) {
              bcrypt.hash(fields['newPassword1'], 12, function(err, hash) {
                if(err) {
                  console.log('Error hashing newPassword: ' + err);
                } else {
                  account.update({'username': req.session.username }, {$set: {'password': hash}}, function(err, result) {
                    if(err) {
                      console.log('Error updating new password: ' + err);
                    } else {
                      console.log('Update successful. Result: ' + result);
                      res.render('myaccount', { username: req.session.username, message: {'content': 'Password successfully changed!', 'type': 'text-success'}, error: {} });
                    }
                  });
                }
              });
            } else {
              res.render('myaccount', { username: req.session.username, message: {'content': 'Current password is incorrect, try again!', 'type': 'text-danger' }, error: {'currentPassword': 'has-error'} });
            }
          });
        });
      }
    }
  });
}

function verifyPassword(req, res, fields, page) {
  if(fields['newPassword1'].length < 8 || fields['newPassword1'] > 72) {
    res.render(page, { username: req.session.username, data: fields, error: {'newPassword': 'has-error'}, message: {'type': 'text-danger', 'content': 'Password must be 8-72 characters'} });
    return false;
  } else if(fields['newPassword1'] != fields['newPassword2']) {
    res.render(page, { username: req.session.username, data: fields, error: {'newPassword': 'has-error'}, message: {'type': 'text-danger', 'content': 'Passwords do not match, try again!'} } );
    return false;
  } else {
    return true;
  }
}
