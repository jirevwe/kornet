var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SecurityQuestion = new Schema({
    index:Schema.Types.Number,
    question:Schema.Types.String
});

module.exports = SecurityQuestion;