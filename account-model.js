var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var accountSchema = new mongoose.Schema({
  name: {
    first: { type: String, required: true },
    last: { type: String, required: true }
  },
  email: { type: String, required: true, index: { unique: true } },
  username: { type: String, required: true, index: { unique: true } },
  password: { type: String, required: true }
});

accountSchema.methods.hashPassword = function (inputPsw) {
  bcrypt.hash(inputPsw, 8, function(err, hash) {
    if(err) {
      console.log('Error hashing password: ' + err);
    } else {
      return hash;
    }
  });
}

module.exports = mongoose.model('account', accountSchema);
