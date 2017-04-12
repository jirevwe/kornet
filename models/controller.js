var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var controllerSchema = new Schema({
    name: Schema.Types.String,
    email: Schema.Types.String,
    password: {type: Schema.Types.String, required: true},
    created_by: {type: Schema.Types.String, required: true},
    created_at: {type: Schema.Types.Date, default: Date.now},
    modified_at: {type: Schema.Types.Date, default: Date.now}
});

controllerSchema.methods.encrypt = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(5), null);
};

controllerSchema.methods.validatePassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('Controller', controllerSchema);