var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Wallet = new Schema({
	balance: { type: Schema.Types.Number, required: true, default: 0 },
	transactions: [{ type: Schema.Types.ObjectId, ref:'Transaction'}],
	bank_account: { account_number: Schema.Types.Number, bank_name: Schema.Types.String },
	open: { type: Schema.Types.Boolean, default: false, required:true },
	recipient_id: { type: Schema.Types.String },
	customer_id: { type: Schema.Types.String },
	created_at: {type: Schema.Types.Date, default: Date.now},
	modified_at: {type: Schema.Types.Date, default: Date.now}
});

module.exports = mongoose.model('Wallet', Wallet);