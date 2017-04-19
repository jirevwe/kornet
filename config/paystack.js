var request = require('request');

let SECRET_KEY = 'sk_test_4844e2650b69fd92f0af204275ca74b9f1d1336f';

function PayStack(SECRET_KEY){
	this.key = SECRET_KEY;
}

exports.createCustomer = function(){
	var options = {
		headers: {
			'Authorization': ' Bearer '.concat(SECRET_KEY),
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
		if (error) console.log(error);
	});
}

exports.getCustomers = function(user, callback){
	var options = {
		headers: {
			'Authorization': ' Bearer '.concat(SECRET_KEY)
		}
	};
	request.get('https://api.paystack.co/customer', options, (error, response, body)=> {
		if (error) console.log(error);
		
		let all_users = JSON.parse(body).data;
		let use = all_users.find(() => {
			return this.email = user.email;
		});
		callback(use);
	});
}

exports.initTransaction = function(user, req, callback){
	var options = {
		headers: {
			'Authorization': ' Bearer '.concat(SECRET_KEY),
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({amount: req.body.amount, email: user.email, callback_url: "http://localhost:3000/wallet" })
	};
	request.post('https://api.paystack.co/transaction/initialize', options, (error, response, body)=> {
		if (error) console.log(error);
		if(body != undefinded){
			let res = JSON.parse(body).data;
			callback(res.authorization_url);
		}
	});
}

exports.getTransaction = function(reference, callback){
	var options = {
		headers: {
			'Authorization': ' Bearer '.concat(SECRET_KEY)
		}
	};
	request.get('https://api.paystack.co/transaction', options, (error, response, body)=> {
		if (error) console.log(error);
		
		let all_transactions = JSON.parse(body).data;
		let transaction = all_transactions.find(() => {
			return this.reference = reference;
		});
		callback(transaction);
	});
}