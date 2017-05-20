var express = require('express');
var router = express.Router();
var utils = require('../utils/api');
let Wallet = require('../models/wallet');
let User = require('../models/user');
let Transaction = require('../models/transaction');
let async = require('async');
// var csrf = require('csrf');

// let csrfProtection = csrf();
// router.use(csrfProtection);

router.get('/', utils.isActivated, function (req, res, next) {
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
					res.render('wallet/index', {layout: 'auth_header', wallet: document });
				});
			});
		});
	}else{
		Wallet.findById(user.wallet, (err, wallet) => {
			res.render('wallet/index', {layout: 'auth_header', wallet: wallet });
		});
	}
});

router.get('/t/all', (req, res, next) => {
	Transaction.find({}, (err, transaction) => {
		if (err) console.log(err);
		res.send(transaction);
	});
});

router.get('/fund', utils.isActivated, function (req, res, next) {
	Wallet.findById(req.user.wallet, (err, wallet) => {
		res.render('wallet/fund', {layout: 'auth_header', wallet: wallet, user: req.user });
	});
});

router.get('/autocomplete/users', utils.isActivated, function (req, res, next) {
	User.find((err, users) => {
		let _users = [];
		for (let i = 0;i < users.length;i++) {
			if(users[i].wallet != undefined && users[i].name != req.user.name)
				_users.push(users[i].name);
		}
		res.send({ query: "Unit", suggestions: _users });
	});
});

router.get('/send', utils.isActivated, function (req, res, next) {
	Wallet.findById(req.user.wallet, (err, wallet) => {
		res.render('wallet/send', {layout: 'auth_header', wallet: wallet, user: req.user });
	});
});

router.get('/cashout', utils.isActivated, function (req, res, next) {
	let user = req.user;

	Wallet.findById(user.wallet, (err, document) => {
		utils.getBanks((error, banks) => {
			if (error) console.log(error);

			wallet = document;
			res.render('wallet/cashout', {layout: 'auth_header', wallet: wallet, banks: banks, user: user });
		});
	});
});

router.post('/send', utils.isActivated, function (req, res, next) {
	User.findOne({name: req.body.user}, (err, other_user) => {
		//save for this user
		let transaction = Transaction({
			transaction_type: 1,
			amount: req.body.amount,
			created_at: Date.now(),
			paid_at: Date.now(),
			reference: utils.generateTransactionReference(),
			from: req.user.name,
			to: other_user.name
		});

		transaction.save((err, result) => {
			Wallet.find((err, wallets) => {
				for(let i = 0; i < wallets.length ;i++){

					if(req.user.wallet.equals(wallets[i]._id)) {
						if(wallets[i].balance == null) wallets[i].balance = 0;

						wallets[i].balance -= result.amount;
						wallets[i].transactions.push(result._id);

						wallets[i].save((error, new_wallet) => {
							if(error) console.log(error);
							console.log('other user wallet saved');
						});
					}

					if(other_user.wallet.equals(wallets[i]._id)) {
						if(wallets[i].balance == null) wallets[i].balance = 0;
						
						wallets[i].balance += result.amount;
						wallets[i].transactions.push(result._id);
						
						wallets[i].save((error, new_wallet) => {
							if(error) console.log(error);
							console.log('other user wallet saved');
						});
					}
				}
			});
		});
		res.send({message: 'success'});
	});
});

router.post('/cashout', utils.isActivated, function (req, res, next) {
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

						// res.redirect('/wallet');
						res.send({message: 'success'});
					});
				});
			});
		});
	});
});

router.post('/create-transaction', utils.isActivated, function (req, res, next) {
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
			res.send({message: 'success'});
		}
	});
});

module.exports = router;