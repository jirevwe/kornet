var request = require('request');

let SECRET_KEY = 'sk_test_4844e2650b69fd92f0af204275ca74b9f1d1336f';

function PayStack(SECRET_KEY){
	this.key = SECRET_KEY;
}

exports.createCustomer = function(){
	var options = {
		headers: {
			'Authorization': ' Bearer '.concat(SECRET_KEY),
			'Content-Type' : 'application/json',
			'cache-control': 'no-cache'
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
		//console.log(JSON.parse(body));
	});
}

exports.getCustomers = function(user, callback){
	var options = {
		headers: {
			'Authorization': ' Bearer '.concat(SECRET_KEY),
			'cache-control': 'no-cache'
		}
	};
	request.get('https://api.paystack.co/customer', options, (error, response, body)=> {
		if (error) console.log(error);
		
		let all_users = JSON.parse(body).data;
		let use = all_users.find((email) => {
			return this.email = user.email;
		});
		callback(use);
	});
}