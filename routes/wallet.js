var express = require('express');
var router = express.Router();
// var csrf = require('csrf');
var utils = require('../utils/api');
let Wallet = require('../models/wallet');
let Transaction = require('../models/transaction');
let www = require('../bin/www'); 

// let csrfProtection = csrf();
// router.use(csrfProtection);

router.get('/', isActivated, function (req, res, next) {
	let successMsg = req.flash('success')[0];
	let user = req.user;

	if(user.wallet == undefined){
		//create customer and recipient on paystack
		utils.createCustomer(user, (error, customer) => {
			if (error) console.log(error);

			let new_wallet = new Wallet(
				{ 
					open: false,
					balance: 0,
					customer_id: customer.customer_code
				});
			new_wallet.save((err, wallet) => {
				user.wallet = wallet;
				
				Wallet.update({ _id: wallet._id }, { open: true }, (err, doc) => {
					if(err) console.log(err);
				});

				user.save((err, _user) => {
					if(err) console.log(err);
				});

				Wallet.findById(user.wallet, (err, document) => {
					res.render('wallet/index', { wallet: document });
				});
			});
		});
	}else{
		let wallet = undefined; let transactions = [];
		Wallet.findById(user.wallet, (err, document) => {
			wallet = document;
			for(let i = 0; i < wallet.transactions.length; i++){
				Transaction.findById(wallet.transactions[i], (err, _transaction)=>{
					if (err) console.log(err);
					transactions.push(_transaction);
				});
			}
			res.render('wallet/index', { wallet: wallet, transactions: transactions });
		});
	}
});

router.get('/fund', isActivated, function (req, res, next) {
	let user = req.user;
	let wallet = undefined;

	Wallet.findById(user.wallet, (err, document) => {
		wallet = document;
		res.render('wallet/fund', { wallet: wallet, user: user });
	});
});

router.get('/cashout', isActivated, function (req, res, next) {
	let user = req.user;

	Wallet.findById(user.wallet, (err, document) => {
		utils.getBanks((error, banks) => {
			if (error) console.log(error);

			wallet = document;
			res.render('wallet/cashout', { wallet: wallet, banks: banks, user: user });
		});
	});
});

router.post('/cashout', isActivated, function (req, res, next) {
	let user = req.user;
	let options = req.body;

	utils.createRecipient(options, (error, response) => {
		if (error) console.log(error);
		let recipient = JSON.parse(response).data;

		// create the recipient
		if(wallet.recipient_id == undefined){
			Wallet.findById(user.wallet, (err, wallet) => {
				wallet.recipient_id = recipient.recipient_code;
				wallet.save((err, new_wallet) => {
					if (err) console.log(err);
				});
			});
		}
		
		let _options = {
			reason: 'Transfered money to bank account',
			amount: options.amount,
			recipient: recipient.recipient_code
		};

		utils.initTransfer(_options, (error, body) => {
			let transferStatus = JSON.parse(body).data;

			console.log(transferStatus);

			let transaction = Transaction({
				operation: 1,
				transaction_type: 2,
				amount: parseInt(transferStatus.amount, 10) / 100,
				created_at: transferStatus.created_at,
				paid_at: transferStatus.created_at,
				reference: transferStatus.transfer_code,
				channel: transferStatus.source
			});
			transaction.save((err, result) => {
				Wallet.findById(user.wallet, (err, wallet) => {
					if(err) console.log(err);

					if(wallet.balance == null)
						wallet.balance = 0;

					wallet.balance -= result.amount;
					wallet.transactions.push(result._id);
					
					wallet.save((error, new_wallet) => {
						if(error) console.log(error);

						res.redirect('/wallet');
					});
				});
			});
		});
	});
});

router.post('/create-transaction', isActivated, function (req, res, next) {
	let details = req.body.details;
	let user = req.user;

	utils.getTransaction(details.reference, (error, response) => {
		if (error) console.log(error);

		if(response == undefined) console.log('an error occured');
		else{
			let transaction = Transaction({
				amount: parseInt(response.amount, 10) / 100,
				operation: req.body.operation,
				transaction_type: req.body.transaction_type,
				created_at: response.created_at,
				paid_at: response.paid_at,
				reference: response.reference,
				channel: response.channel
			});
			transaction.save((err, result) => {
				Wallet.findById(user.wallet, (err, wallet) => {
					if(err) console.log(err);

					if(wallet.balance == null)
						wallet.balance = 0;

					wallet.balance += result.amount;
					wallet.transactions.push(result._id);
					
					wallet.save((error, new_wallet) => {
						if(error) console.log(error);
					});
				});
			});
		}
	});
});

module.exports = router;

function notActivated(req, res, next){
	if(req.user && req.user.is_activated != 1 && req.isAuthenticated()){
		return next();
	}
	res.redirect('/');
}

function isActivated(req, res, next){
	if(req.user && req.user.name == req.user.phone_number && req.user.is_activated != 1 && req.isAuthenticated()){
		req.session.oldUrl = req.url;
		res.redirect('/choose');
	}
	else if(req.user && req.user.is_activated != 1 && req.isAuthenticated()){
		req.session.oldUrl = req.url;
		res.redirect('/activate');
	}
	else if(!req.isAuthenticated()){
		req.session.oldUrl = req.url;
		res.redirect('/signin');
	}
	return next();
}

function notLoggedIn(req, res, next){
	if(!req.isAuthenticated())
		return next();
	res.redirect('/');
}