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

module.exports = mongoose.model('account', accountSchema);
