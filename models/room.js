var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var roomSchema = new Schema({
    room_id: Schema.Types.String,
    creator: { type : Schema.Types.ObjectId, ref: 'User' },
    members: [{ type : Schema.Types.ObjectId, ref: 'User' }],
    history: Schema.Types.Mixed,
    is_private: Schema.Types.Number,
    password: Schema.Types.String,
    created_at: {type: Schema.Types.Date, default: Date.now},
    modified_at: {type: Schema.Types.Date, default: Date.now}
});

module.exports = mongoose.model('Room', roomSchema);

roomSchema.methods.encrypt = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(5), null);
};

roomSchema.methods.validatePassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};