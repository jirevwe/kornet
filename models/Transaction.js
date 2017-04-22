var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Transaction = new Schema({
	amount: {type: Schema.Types.Number, required: true, default: 0},
	operation: Schema.Types.Number, // 0 => error, 1 => debit, 2: credit
	transaction_type: Schema.Types.Number, //0 => Bank -> Wallet, 1 => Wallet -> Wallet, 2 => Wallet -> Bank 
	created_at: {type: Schema.Types.Date, default: Date.now},
	paid_at: {type: Schema.Types.Date, default: Date.now},
	reference: Schema.Types.String,
	channel: Schema.Types.String,
	from: Schema.Types.String,
	to: Schema.Types.String
});

module.exports = mongoose.model('Transaction', Transaction);