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

	var questions = [
					"What is the first name of the person you kissed",
					"In what city or town does your nearest sibling live",
					"What is the name of your primary school",
					"Where did you write your first Jamb examination",
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

	User.register(user, user.password, function(err, account) {
		if (err) {
			throw err;
			return res.render("register", {info: "Sorry. That username already exists. Try again."});
		}
		passport.authenticate('local')(req, res, function () {
			return res.redirect('/');
		});
	});
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

module.exports = router;
