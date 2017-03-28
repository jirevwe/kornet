var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models/user');
var SecurityQuestion = require('../models/security_question');

router.get('/', function(req, res, next) {
	if(req.isAuthenticated())
		return res.redirect('/users');
	return res.render('index');
});

router.get('/ping', function(req, res){
	res.send('pong!');
});

router.get('/register', function(req, res, next) {
	if(req.isAuthenticated()){
		return res.redirect('/');
	}

	var mysql      = require('mysql');
	var connection = mysql.createConnection({
		host     : 'mail.kornet-test.com',
		user     : 'root2',
		password : '00000',
		database : 'vmail',
		debug    : false
	});

	connection.connect();

	// connection.query('SELECT * FROM mailbox', function(err, results, fields) {
	// 	if (err) console.log('Error while performing Query. \n' + err);
	// 	if(results.length > 0){
	// 		for(row in results){
	// 			for(data in results[row])
	// 			console.log(data + ": " + results[row][data]);
	// 		}
	// 	}
	// });

	connection.end();

	var questions = [
					"What is the first name of the person you kissed",
					"In what city or town does your nearest sibling live",
					"What is the name of your primary school",
					"Wherce did you write your first Jamb examination",
					"In what city does your closest family member live"
					];

	return res.render('register', {"questions": questions});
});

router.post('/register', function(req, res) {
	var user = new User({
		username: req.body.username,
		password: req.body.password,
		first_name: req.body.first_name,
		last_name: req.body.last_name,
		email: req.body.email,
		security_question: req.body.question,
		gender: req.body.gender,
		phone_number: req.body.question,
		security_answer: req.body.answer
	});

	var mysql      = require('mysql');
	var connection = mysql.createConnection({
		host     : 'mail.kornet-test.com',
		user     : 'root2',
		password : '00000',
		database : 'vmail',
		debug    : false
	});

	connection.connect();

	let values = [	user.username  + '@demo.kornet-test.com',
					ssha512(user.password),
					user.first_name + " " +user.last_name,
					'/var/vmail',
					'vmail1', 
					'demo.kornet-test.com/' + maildirFolder(user.username),
					1024,
					'demo.kornet-test.com',
					1,
					user.username,
					new Date(Date.now())
				];

	connection.query('INSERT INTO mailbox (username, password, name, storagebasedirectory, storagenode, maildir, quota, domain, active, local_part, created) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
	 	values, function(err, results) {
		if (err) console.log(err);
		console.log(results);
	});

	let values2 = [ user.username + '@demo.kornet-test.com',
					user.username + '@demo.kornet-test.com',
					'demo.kornet-test.com',
					new Date(Date.now()),
					1];

	connection.query('INSERT INTO alias (address, goto, domain, created, active) VALUES (?,?,?,?,?)', values2, function(err, results) {
		if (err) console.log(err);
		console.log(results);
	});

	connection.end();

	// User.register(user, user.password, function(err, account) {
	// 	if (err) {
	// 		throw err;
	// 		return res.render("register", {info: "Sorry. That username already exists. Try again."});
	// 	}
	// 	passport.authenticate('local')(req, res, function () {
	// 		return res.redirect('/');
	// 	});
	// });
	return res.redirect('/');
});

router.get('/login', function(req, res) {
	if(req.isAuthenticated()){
		return res.redirect('/');
	}
	return res.render('login');
});

router.post('/login', passport.authenticate('local', { successRedirect: "/", failureRedirect: "/login" }), function(req, res){
	if (!req.isAuthenticated()) {
		return res.render("login", {info: "Sorry. invalid credentials. Try again."});
	}
});

router.get('/logout', function(req, res) {
		req.logout();
		return res.redirect('/');
});

function maildirFolder(username) {
	let temp = username.substr(0,3);
	let res = temp[0] + '/' + temp[1] + '/' + temp[2] + '/' + username + '/';
	return res;
}

function ssha512(cleartext) {
	let passwordhasher = require('password-hasher');
	let hash = passwordhasher.createHash('ssha512', cleartext, new Buffer('83d88386463f0625', 'hex'));
	return passwordhasher.formatRFC2307(hash);
}

module.exports = router;
