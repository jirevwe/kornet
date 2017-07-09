var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs'); 

var userSchema = new Schema({
    name: Schema.Types.String,
    password: {type: Schema.Types.String, required: true},
    first_name: Schema.Types.String,
    last_name: Schema.Types.String,
    phone_number: {type: Schema.Types.String, required: true, index: { unique: true }},
    network_provider: {type: Schema.Types.String, required: true},
    email: {type: Schema.Types.String, required: true},
    address: Schema.Types.String,
    next_of_kin: Schema.Types.String,
    next_of_kin_number: Schema.Types.String,
    country: Schema.Types.String,
    state: Schema.Types.String,
    date_of_birth: {type: Schema.Types.Date, default: Date.now},
    long_text:{type: Schema.Types.String, required:true},
    profile_image: Schema.Types.String,
    security_question: Schema.Types.String,
    security_answer: Schema.Types.String,
    contacts: [{ type : Schema.Types.ObjectId, ref: 'User' }],
    gender: Schema.Types.String,
    security_token: {type: Schema.Types.String, required:true},
    is_activated: {type: Schema.Types.String, default: 0},
    user_type: Schema.Types.String,
    user_domain: Schema.Types.String,
    wallet: { type: Schema.Types.ObjectId, ref:'Wallet'},
    created_at: {type: Schema.Types.Date, default: Date.now},
    modified_at: {type: Schema.Types.Date, default: Date.now}
});

userSchema.methods.encrypt = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(5), null);
};

userSchema.methods.validatePassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

userSchema.methods.validateToken = function (token) {I
    return bcrypt.compareSync(token, this.security_token);
};

userSchema.methods.validateSecAnswer = function (answer) {
    return bcrypt.compareSync(answer, this.security_answer);
};
module.exports = mongoose.model('User', userSchema);