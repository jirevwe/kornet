
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({
  username: Schema.Types.String,
  password: Schema.Types.String,
  first_name: Schema.Types.String,
  last_name: Schema.Types.String,
  phone_number: Schema.Types.String,
  email:Schema.Types.String,
  date_of_birth: Schema.Types.Date,
  profile_image: Schema.Types.String,
  security_question: Schema.Types.Number,
  security_answer: Schema.Types.String,
  contacts: Schema.Types.Array,
  gender: Schema.Types.String,
  created_at: {type: Schema.Types.Date, default: Date.now},
  modified_at: {type: Schema.Types.Date, default: Date.now} 
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);