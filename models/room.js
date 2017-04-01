var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var roomSchema = new Schema({
    name: { type:String, required: true},
    room_id: { type:String, required: true, index: { unique: true }},
    creator: { type: Schema.Types.ObjectId, ref:'User'},
    members: [{ type: Schema.Types.ObjectId, ref:'User'}],
    history: Schema.Types.Mixed,
    isDM: { type:String, required: true},
    isPrivate: { type:String, required: true},
    password: { type:String},
    created_at: {type: Schema.Types.Date, default: Date.now},
    modified_at: {type: Schema.Types.Date, default: Date.now}
});

roomSchema.methods.encrypt = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(5), null);
};

roomSchema.methods.validatePassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('Room', roomSchema);

