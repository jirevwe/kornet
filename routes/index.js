var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models/user');

router.get('/', function(req, res, next) {
	res.render('index', { user : req.user });
});

router.get('/ping', function(req, res){
	res.send('pong!');
});

router.get('/register', function(req, res, next) {
	if(req.isAuthenticated()){
		res.redirect('/')
	}
	res.render('register');
});

router.post('/register', function(req, res) {
	User.register(new User({ username : req.body.username }), req.body.password, function(err, account) {
		 if (err) {
					return res.render("register", {info: "Sorry. That username already exists. Try again."});
			}
			passport.authenticate('local')(req, res, function () {
				res.redirect('/');
			});
	});
});

router.get('/login', function(req, res) {
	if(req.isAuthenticated()){
		res.redirect('/')
	}
	res.render('login');
});

router.post('/login', passport.authenticate('local', { successRedirect: "/", failureRedirect: "/login" }));

router.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
});

module.exports = router;
