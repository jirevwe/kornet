var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var businessSchema = new Schema({
    name: {type: Schema.Types.String, required: true},
    address: {type: Schema.Types.String, required: true},
    users: [{ type : Schema.Types.ObjectId, ref: 'User' }],
    domain: {type: Schema.Types.String, required: true},
    rooms: [{ type : Schema.Types.ObjectId, ref: 'Room' }],
    admin:{ type: Schema.Types.ObjectId, ref:'User'},
    created_at: {type: Schema.Types.Date, default: Date.now},
    modified_at: {type: Schema.Types.Date, default: Date.now}
});

module.exports = mongoose.model('Business', businessSchema);