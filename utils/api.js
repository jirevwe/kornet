var request = require('request');
var utils =  require('./api');
let Business = require('../models/business');
let Government = require('../models/govt');

/* ------------------------  PAYSTACK STUFF --------------------------- */
let SECRET_KEY = 'sk_test_4844e2650b69fd92f0af204275ca74b9f1d1336f';

exports.createCustomer = function(user, callback){
	var options = {
		headers: {
			'Authorization': 'Bearer '.concat(SECRET_KEY),
			'Content-Type' : 'application/json'
		},
		body: JSON.stringify({
			first_name: user.first_name,
			last_name: user.last_name,
			email: user.email,
			phone: user.phone_number
		})
	};
	request.post('https://api.paystack.co/customer', options, (error, response, body)=> {
		callback(error, JSON.parse(body).data);
	});
}

/**
 * params
 * 		- account number
 * 		- bank code
 * 		- first name
 * 		- last name
 * 		- amount
 */
exports.createRecipient = function(params, callback){
	var options = {
		headers: {
			'Authorization': 'Bearer '.concat(SECRET_KEY),
			'Content-Type' : 'application/json'
		},
		body: JSON.stringify({
			type: "nuban",
			name: params.first_name + " " + params.last_name,
			account_number: params.account_number,
			bank_code: params.bank_code,
			currency: "NGN"
		})
	};
	request.post('https://api.paystack.co/transferrecipient', options, (error, response, body)=> {
		callback(error, body);
	});
}

exports.initTransfer = function(params, callback){
	var options = {
		headers: {
			'Authorization': 'Bearer '.concat(SECRET_KEY),
			'Content-Type' : 'application/json'
		},
		body: JSON.stringify({
			source: "balance",
			currency: 'NGN',
			reason: params.reason,
			amount: params.amount,
			recipient: params.recipient
		})
	};
	request.post('https://api.paystack.co/transfer', options, (error, response, body)=> {
		callback(error, body);
	});
}

exports.getCustomers = function(user, callback){
	var options = {
		headers: {
			'Authorization': 'Bearer '.concat(SECRET_KEY)
		}
	};
	request.get('https://api.paystack.co/customer', options, (error, response, body)=> {
		let all_users = JSON.parse(body).data;
		let use = all_users.find(() => {
			return this.email = user.email;
		});
		callback(error, use);
	});
}

exports.getTransaction = function(reference, callback){
	var options = {
		headers: {
			'Authorization': ' Bearer '.concat(SECRET_KEY)
		}
	};
	request.get('https://api.paystack.co/transaction', options, (error, response, body)=> {
		let all_transactions = JSON.parse(body).data;
		let transaction = all_transactions.find(() => {
			return this.reference = reference;
		});
		callback(error, transaction);
	});
}

exports.getBanks = function(callback){
	var options = {
		headers: {
			'Authorization': 'Bearer '.concat(SECRET_KEY)
		}
	};

	request.get('https://api.paystack.co/bank', options, (error, response, body) => {
		if (body != undefined){
			let all_banks = JSON.parse(body).data;
			callback(error, all_banks);
		}
		else{
			callback(error, null);
		}
	});
}

/* --------------------------- END PAYSTACK STUFF ------------------------------- */

/* ------------------------------  MAIL STUFF ----------------------------------- */
/**
 * options
 *  	-subject
 * 		-body
 * 
 * utils.sendEmail(user, ['mail@mail.com'], {subject: 'invite stuff', body: 'we wanna invite you to do awesome stuff for us'}, (message) => {
 * 		console.log(message);
 * });
 */
exports.sendEmail = function(user, emails, options, callback){
	let mailer = require("nodemailer");
	let smtpTransport = require('nodemailer-smtp-transport');
	let Imap = require('imap');
	let composer = require('mailcomposer');

	if(user == undefined)
		callback('User Object is not set')

	if(emails == undefined && !Array.isArray(emails))
		callback("Emails have not been set");

	if(utils.hasOwnProperty(options, 'subject') && utils.hasOwnProperty(options, 'subject')){
		for(let i = 0;i < emails.length;i++){
			let email = emails[i];

			if(utils.validateEmail(email)){
				let smtpConfig = {
					host: 'mail.kornet-test.com',
					port: 587,
					secure: false,
					logger: true,
					auth: {
						user: user.email,
						pass: utils.getLong(user.long_text)
					}
				};
				let sendmailer = mailer.createTransport(smtpTransport(smtpConfig));

				let mailOptions = {
					from: user.email,
					sender: user.email,
					to: emails[i],
					html: options.body || 'No Body',
					text: options.body || 'No Body',
					subject: options.subject || 'No Subject',
					date: new Date(Date.now())
				};

				let mail = composer(mailOptions);
				sendmailer.sendMail(mailOptions, function (err, sentMessageInfo) {
					if (err) console.log(err);
					else console.log("Message sent: " + sentMessageInfo.messageId);

					mail.build(function (err, message) {
						let imap = new Imap({
							user: user.email,
							password: utils.getLong(user.long_text),
							host: 'mail.kornet-test.com',
							port: 993,
							tls: true
						});

						imap.once('ready', function () {
							imap.openBox('Sent', false, function (err, box) {
								if (err) console.log(err);
								imap.append(message, { mailbox: 'Sent', flags: ['Seen'], date: new Date(Date.now()) }, function (err) {
									if (err) console.log(err);
									imap.end();
									console.log('Saved in Mailbox (Sent)');
								});
							});
						});
						imap.connect();
					});
				});
			}
			else{
				console.log(email + " is malformed");
			}
		}
		callback("DONE");
	}
}
/* ------------------------------ END MAIL STUFF ----------------------------------- */

exports.generateTransactionReference = function(){
	//T463309364588305
	for (var text = '', possible = '0123456789', i = 0; 15 > i; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
	return 'T'.concat(text);
}

exports.validateEmail = function(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

exports.hasOwnProperty = function(obj, prop) {
    var proto = obj.__proto__ || obj.constructor.prototype;
    return (prop in obj) &&
        (!(prop in proto) || proto[prop] !== obj[prop]);
}

exports.getLong = function (encrypted) {
	let Crypto = require('crypto-js');
	let decrypted = Crypto.AES.decrypt(encrypted, "$2a$05$d92IUG5ZHIpU0f8fvQitvOut05tuZdD4rDp5RF8BC/7zdFvUqBk52");
	return decrypted.toString(Crypto.enc.Utf8);
}

exports.notActivated = function(req, res, next){
	if(req.user && req.user.is_activated != 1 && req.isAuthenticated()){
		return next();
	}
	res.redirect('/');
}

exports.isActivated = function(req, res, next){
	if(req.user && req.user.name == req.user.phone_number && req.user.is_activated != 1 && req.isAuthenticated()){
		req.session.oldUrl = req.url;
		return res.redirect('/choose');
	}
	else if(req.user && req.user.is_activated != 1 && req.isAuthenticated()){
		req.session.oldUrl = req.url;
        return res.redirect('/activate');
	}
	else if(!req.isAuthenticated()){
		req.session.oldUrl = req.url;
        return res.redirect('/signin');
	}
	return next();
}

exports.notLoggedIn = function(req, res, next){
	if(!req.isAuthenticated())
		return next();
	res.redirect('/');
}

exports.isAdminBusiness = function(req, res, next){
    Business.findOne({'domain':req.user.user_domain}, function (err, business) {
        if (err) {
            //req.flash('error', 'Error getting business.');
            res.redirect('/');
        }
        if (business){
            console.log(business.admin);
            console.log(req.user._id);
            if(""+req.user._id == ""+business.admin){
                return next();
            }
        }
        if (!business){
            //console.log(business);
            res.redirect('/');
        }
        res.redirect('/');
    });
}

exports.isAdminGovernment = function(req, res, next){
    Government.findOne({'domain':req.user.user_domain}, function (err, government) {
        if (err) {
            //req.flash('error', 'Error getting business.');
            return res.json({result: "false"});
        }
        if (government){
            console.log(government.admin);
            console.log(req.user._id);
            if(""+req.user._id == ""+government.admin){
                return res.json({result: "true"});
            }
        }
        if (!government){
            //console.log(business);
            return res.json({result: "false"});
        }
        return res.json({result: "false"});
    });
}

exports.setLong = function(cleartext){
    let Crypto = require('crypto-js');
    return Crypto.AES.encrypt(cleartext, "$2a$05$d92IUG5ZHIpU0f8fvQitvOut05tuZdD4rDp5RF8BC/7zdFvUqBk52");
}