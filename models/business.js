var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var businessSchema = new Schema({
    name: {type: Schema.Types.String, required: true, index: { unique: true }},
    address: {type: Schema.Types.String},
    default_pass: {type: Schema.Types.String},
    users: [{ type : Schema.Types.ObjectId, ref: 'User' }],
    domain: {type: Schema.Types.String, required: true, index: { unique: true }},
    rooms: [{ type : Schema.Types.ObjectId, ref: 'Room' }],
    admin:{ type: Schema.Types.ObjectId, ref:'User'},
    staff_number: Schema.Types.String,
    created_by: {type: Schema.Types.String, required: true},
    created_at: {type: Schema.Types.Date, default: Date.now},
    modified_at: {type: Schema.Types.Date, default: Date.now}
});

module.exports = mongoose.model('Business', businessSchema);