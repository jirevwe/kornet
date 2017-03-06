
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({
  username: String,
  email: String,
  password: String,
  created_at: {type: Date, default: Date.now}
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);