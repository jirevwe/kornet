var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var govtSchema = new Schema({
    name: Schema.Types.String,
    address: Schema.Types.String,
    default_pass: {type: Schema.Types.String},
    domain: {type: Schema.Types.String, required: true, index: { unique: true }},
    tier: Schema.Types.String,
    users: [{ type : Schema.Types.ObjectId, ref: 'User' }],
    type: Schema.Types.String,
    staff_number: Schema.Types.String,
    rooms: [{ type : Schema.Types.ObjectId, ref: 'Room' }],
    admin:{ type: Schema.Types.ObjectId, ref:'User'},
    created_by: {type: Schema.Types.String, required: true},
    created_at: {type: Schema.Types.Date, default: Date.now},
    modified_at: {type: Schema.Types.Date, default: Date.now}
});

module.exports = mongoose.model('Govt', govtSchema);