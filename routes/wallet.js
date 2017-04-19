var express = require('express');
var router = express.Router();
// var csrf = require('csrf');
var paystack = require('../config/paystack');
let Wallet = require('../models/wallet');
let Transaction = require('../models/transaction');
let www = require('../bin/www'); 

// let csrfProtection = csrf();
// router.use(csrfProtection);

router.get('/', isActivated, function (req, res, next) {
	let successMsg = req.flash('success')[0];
	let user = req.user;

	if(user.wallet == undefined){
		let new_wallet = new Wallet({open: false, balance: 0});
		new_wallet.save((err, result) => {
			user.wallet = result._id;
			
			Wallet.update({ _id: result._id }, { open: true }, (err, doc) => {
				if(err) console.log(err);
			});

			user.save((err, _user) => {
				if(err) console.log(err);
			});

			//create customer/user on paystack
			paystack.createCustomer();

			let wallet, customer = undefined;
			Wallet.findById(user.wallet, (err, document) => {
				wallet = document;
				res.render('wallet/index', { wallet: wallet });
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

router.post('/create-transaction', isActivated, function (req, res, next) {
	let details = req.body.details;
	let user = req.user;

	paystack.getTransaction(details.reference, (response) => {
		if(response == undefined) console.log('an error occured');
		else{
			let transaction = Transaction({
				amount: response.amount,
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
	if(req.user.is_activated != 1 && req.isAuthenticated()){
		return next();
	}
	res.redirect('/');
}

function isActivated(req, res, next){
	if(req.user.name == req.user.phone_number && req.user.is_activated != 1 && req.isAuthenticated()){
		req.session.oldUrl = req.url;
		res.redirect('/choose');
	}
	else if(req.user.is_activated != 1 && req.isAuthenticated()){
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