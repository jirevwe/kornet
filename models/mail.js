
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Mail = new Schema({
  from: Schema.Types.String,
  to: Schema.Types.Array,
  body: Schema.Types.String,
  attachments: Schema.Types.Buffer,
  subject: Schema.Types.String,
  flags: {
      location: Schema.Types.Number,
      status: Schema.Types.Number,
      archive: Schema.Types.Boolean,
      important:Schema.Types.Boolean
  },
  linked_mail: Schema.Types.ObjectId,
  created_at: {type: Schema.Types.Date, default: Date.now},
  sent_at: {type: Schema.Types.Date, default: Date.now},
  recieved_at : {type: Schema.Types.Date, default: Date.now}
});

module.exports = mongoose.model('Mail', Mail);