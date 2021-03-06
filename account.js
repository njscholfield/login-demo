var mongoose = require('mongoose');
var formidable = require('formidable');
var bcrypt = require('bcrypt');
var nodemailer = require('nodemailer');


mongoose.connect(process.env.MONGO, {useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false, useUnifiedTopology: true}, function(err) {
  if(err) {
    console.log('ERROR connecting to: ' + process.env.MONGO + '. ' + err);
  } else {
    console.log ('Succeeded, connected to: ' + process.env.MONGO);
  }
});

var accountSchema = new mongoose.Schema({
  name: {
    first: { type: String, required: true },
    last: { type: String, required: true }
  },
  email: { type: String, required: true, index: { unique: true } },
  username: { type: String, required: true, index: { unique: true } },
  password: { type: String, required: true },
  reset: {
    allow: { type: Boolean, default: false },
    token: { type: String, default: '' },
    date: { type: Date, default: null }
  }
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
              var hasError = {};
              if(err) {
                console.log('Error saving account: ' + err);
                if(err.code === 11000) {
                  var temp = err.errmsg.split("$", 2)
                  temp = temp[1].split("_", 2);
                  result = 'The ' + temp[0] + ' you entered has already been taken';
                  if(temp[0] == 'email') {
                    hasError = {'inputEmail': 'has-error'};
                  } else {
                    hasError = {'inputUsername': 'has-error'};
                  }
                } else {
                  result = 'All fields are required';
                  for(var key in fields){
                    if(fields[key] == '') {
                      hasError[key] = 'has-error';
                    }
                  }
                }
                res.render('register', { username: '', data: fields, error: hasError, message: { 'type': 'text-danger', 'content': result } });
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
          res.render('login', { username: '', message: 'Username not found, try again!', error: { 'username': 'has-error'} });
        } else {
          bcrypt.compare(fields['loginPassword'], password, function(err, isMatch) {
            if(err) {
              console.log('Error checking password: ' + err);
            } else {
              if(isMatch) {
                req.session.username = fields['loginUsername'];
                res.render('myaccount', { username: req.session.username, message: {}, error: {} } );
              } else {
                res.render('login', { username: '', message: 'Incorrect password, try again!', error: { 'password': 'has-error'} });
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
                  account.updateOne({'username': req.session.username }, {$set: {'password': hash}}, function(err, result) {
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

exports.findAccount = function(req, res, user) {
  account.find({'username': user}).exec(function(err, result) {
    if(err) {
      console.log('Error retrieving user: ' + err);
    } else {
      if(result.length > 0) {
        result.forEach(function(resdoc) {
            res.render('user', { username: req.session.username, user: resdoc });
        });
      } else {
        res.render('error', { username: req.session.username, message: 'User could not be found' });
      }
    }
  });
}

exports.deleteAccount = function(req, res) {
  var form = formidable.IncomingForm();
  var password;

  form.parse(req, function(err, fields, files) {
    if(err) {
      console.log('Error parsing form: ' + err);
    } else {
      account.find({'username': req.session.username}, {password: 1}).exec(function(err, result) {
        if(err) {
          console.log('Error finding account: ' + err);
        } else {
          result.forEach(function(resdoc) {
            password = resdoc.password;
          });
          bcrypt.compare(fields.password, password, function(err, isMatch) {
            if(isMatch) {
              account.remove({username: req.session.username}, function(err, results) {
                if(err) {
                  console.log('Error deleting account: ' + err);
                  res.render('error', { username: req.session.username, message: 'Error deleting account' });
                } else {
                  req.session.destroy();
                  res.redirect('/');
                }
              });
            } else {
              res.render('myaccount', { message: {'type': 'text-danger', 'content': 'Incorrect Password, try again!'}, username: req.session.username, error: {} })
            }
          });
        }
      });
    }
  })
}

exports.forgotPassword = function(req, res) {
  var form = formidable.IncomingForm();
  var eDate = new Date();
  eDate.setHours(eDate.getHours() + 5);

  form.parse(req, function(err, fields, files) {
    if(err) { console.log('Error parsing form: ' + err); }
    else {
      account.find({'email': fields.email}).exec(function(err, result) {
        if(err) { console.log('Error searching: ' + err); }
        else {
          if(result.length > 0) {
            var hashToken = bcrypt.genSaltSync(12);
            account.updateOne({ 'email': fields.email }, {$set: { "reset": {"allow": true, "token": hashToken, "date": eDate } } }, function(err, result2) {
              if(err){ console.log('Error adding token: ' + err); }
              else {
                result.forEach(function(resdoc) {
                  var resetURL = 'https://login.noahscholfield.com/reset/' + resdoc._id + '?tkn=' + hashToken;
                  // implement nodemailer to email reset URL
                  var mailOptions = {
                    from: '"Noah Scholfield" <blog@noahscholfield.com>', // sender address
                    to: fields.email, // list of receivers
                    subject: 'Password Reset', // Subject line
                    text: 'Click the link to reset your password. ' + resetURL, // plaintext body
                    html: '<a href="' + resetURL + '">Click Here</a>' // html body
                  };
                  sendEmail(mailOptions);
                  res.render('forgot', { message: {'type': 'text-success', 'content': 'A password reset link has been emailed to you.'} } );
                });
              }
            });
          } else {
            res.render('forgot', { message: {'type': 'text-danger', 'content': 'Account not found!'} } );
          }
        }
      })
    }
  });
}

exports.resetPassword = function(req, res) {
  var form = formidable.IncomingForm();

  form.parse(req, function(err, fields, files) {
    if(err) { console.log('Error parsing form: ' + err); }
    else {
      account.find({_id: fields.id}).exec(function(err, result) {
        if(err) {
          console.log('Error finding account ' + err);
          res.render('error', {username: '', message: 'Error finding account. Link is invalid.' });
        } else {
          if(result.length > 0) {
            result.forEach(function(resdoc) {
              if(resdoc.reset.allow && resdoc.reset.date > Date.now() && resdoc.reset.token == fields.token) {
                if(verifyPassword(req, res, fields, 'reset')) {
                  bcrypt.hash(fields['newPassword1'], 12, function(err, hash) {
                    if(err) {
                      console.log('Error hashing newPassword: ' + err);
                    } else {
                      account.updateOne({_id: fields.id}, {$set: {'password': hash, 'reset.allow': false, 'reset.token': '', 'reset.date': null}}, function(err, result) {
                        if(err) {
                          console.log('Error updating new password: ' + err);
                        } else {
                          console.log('Update successful. Result: ' + result);
                          res.render('reset', { id: fields.id, token: fields.token, message: {'content': 'Password successfully changed!', 'type': 'text-success'}, error: {} });
                        }
                      });
                    }
                  });
                }
              } else {
                res.render('error', {username: '', message: 'Password reset link invalid or expired' });
              }
            });
          } else {
          res.render('error', {username: '', message: 'Account not found. Link is invalid.' });
          }
        }
      });
    }
  });
}

function verifyPassword(req, res, fields, page) {
  if(fields['newPassword1'].length < 8 || fields['newPassword1'].length > 72) {
    res.render(page, { id: fields.id, token: fields.token, username: req.session.username, data: fields, error: {'newPassword': 'has-error'}, message: {'type': 'text-danger', 'content': 'Password must be 8-72 characters'} });
    return false;
  } else if(fields['newPassword1'] != fields['newPassword2']) {
    res.render(page, { id: fields.id, token: fields.token, username: req.session.username, data: fields, error: {'newPassword': 'has-error'}, message: {'type': 'text-danger', 'content': 'Passwords do not match, try again!'} } );
    return false;
  } else {
    return true;
  }
}

function sendEmail(mailOptions) {
  var transporter = nodemailer.createTransport({
    service: 'zoho',
    auth: {
      user: 'blog@noahscholfield.com',
      pass: process.env.MAIL_PASSWORD
    }
  });

  transporter.sendMail(mailOptions, function(err, info) {
    if(err) { console.log('Error sending email: ' + err) }
    else {
      console.log('Email sent: ' + info.response);
    }
  });
}
