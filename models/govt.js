var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var govtSchema = new Schema({
    name: Schema.Types.String,
    address: Schema.Types.String,
    tier: Schema.Types.String,
    members: [{ type : Schema.Types.ObjectId, ref: 'User' }],
    type: Schema.Types.String,
    rooms: [{ type : Schema.Types.ObjectId, ref: 'Room' }],
    admin:{ type: Schema.Types.ObjectId, ref:'User'},
    created_at: {type: Schema.Types.Date, default: Date.now},
    modified_at: {type: Schema.Types.Date, default: Date.now}
});

module.exports = mongoose.model('Govt', govtSchema);