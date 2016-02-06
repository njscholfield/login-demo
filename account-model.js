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

accountSchema.pre('save', function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  bcrypt.hash(this.password, 8, function(err, hash) {
    if(err) {
      console.log('Error hashing password: ' + err);
    } else {
      this.password = hash;
      console.log(hash);
      this.save();
    }
    next();
  });
});

module.exports = mongoose.model('account', accountSchema);
