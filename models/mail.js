
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Mail = new Schema({
  user:Schema.Types.String,
  attachments: Schema.Types.Array,
  headers: Schema.Types.Mixed,
  html:Schema.Types.Mixed,
  text:Schema.Types.String,
  textAsHtml:Schema.Types.String,
  cc:Schema.Types.Mixed,
  bcc:Schema.Types.Mixed,
  mailbox:Schema.Types.String,
  messageId: Schema.Types.String,
  from: Schema.Types.Mixed,
  to: Schema.Types.Mixed,
  subject: Schema.Types.String,
  flags: {
      status: Schema.Types.String
  },
  seqNo: Schema.Types.Number,
  references: Schema.Types.String,
  "reply-to": Schema.Types.String,
  inReplyTo: Schema.Types.String,
  date: Schema.Types.Date
});

module.exports = mongoose.model('Mail', Mail);