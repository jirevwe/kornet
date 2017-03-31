var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var roomSchema = new Schema({
    name: Schema.Types.String,
    room_id: Schema.Types.String,
    creator: Schema.Types.String,
    members: Schema.Types.Array,
    history: Schema.Types.Mixed,
    isDM: Schema.Types.String,
    isPrivate: Schema.Types.String,
    password: Schema.Types.String,
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

