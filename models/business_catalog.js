var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BusinessCatalog = new Schema({
    content: {type: Schema.Types.String},
	images: [{type: Schema.Types.String}]
});

module.exports = mongoose.model('BusinessCatalog', BusinessCatalog);