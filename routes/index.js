var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var passport = require('passport');
var Order = require('../models/order');
var Cart = require('../models/cart');
var User = require('../models/user');

var csrfProtection = csrf();

router.use(csrfProtection);


router.use('/', function (req, res, next) {
    next();
});

router.get('/', function (req, res, next) {
    if(req.user)
        res.render('index', {layout: false, user: req.user});
    else
        res.render('index', {layout: false});

});

router.get('/download/:filename', function (req, res, next) {
	res.download('./tmp/' + req.params.filename, req.params.filename, function(err){
		if (err) console.log(err);
	});
});

router.get('/activate', function (req, res, next) {
    var messages = req.flash('error');
    res.render('user/activate', {csrfToken: req.csrfToken(), messages:messages, hasErrors:messages.length > 0});
});

router.post('/activate',  function (req, res, next) {

    User.findOne({'email':req.user.email}, function (err, user) {
        if(err){
            return done(user);
        }
        if(!user){
            req.flash('error', 'User does not exist');
            return res.redirect('/user/activate');
        }
        if(!user.validateToken(req.body.token)){
            req.flash('error', 'Wrong Token');
            return res.redirect('/user/activate');
        }
        user.is_activated = 1;
        user.save(function(err) {
            if (err)
                console.log('error');
            else
                console.log('success');
        });
        return res.redirect('/');
    });

});

router.get('/signup', function (req, res, next) {
    var messages = req.flash('error');
    res.render('user/signup', {csrfToken: req.csrfToken(), domain:'demo.kornet-test.com' ,messages:messages, hasErrors:messages.length > 0});
});

router.post('/signup', passport.authenticate('local.signup', { failureRedirect: '/signup', failureFlash: true }), function (req, res, next) {
    if(req.user.is_activated == 0){
        res.redirect('/activate');
    }
    else{
        if(req.session.oldUrl){
            var oldUrl = req.session.oldUrl;
            req.session.oldUrl = null;
            res.redirect(oldUrl);
        }else{
            res.redirect('/');
        }

    }
});

router.get('/signin', function (req, res, next) {
    var messages = req.flash('error');
    res.render('user/signin', {csrfToken: req.csrfToken(), messages:messages, hasErrors:messages.length > 0});
});

router.post('/signin', passport.authenticate('local.signin', { failureRedirect: '/signin', failureFlash: true }), function (req, res, next) {
    if(req.session.oldUrl){
        var oldUrl = req.session.oldUrl;
        req.session.oldUrl = null;
        res.redirect(oldUrl);
    }
    else{
        res.redirect('/profile');
    }
});

router.get('/profile', function (req, res, next) {
    Order.find({user: req.user}, function (err, orders) {
        if(err){
            return res.write('Error!!');
        }
        var cart;
        orders.forEach(function (order) {
            cart = new Cart(order.cart);
            order.items = cart.generateArray();
        });
        res.render('user/profile', {orders: orders});
    });
});

router.get('/logout', function (req, res, next) {
    req.logout();
    res.redirect('/');
});

module.exports = router;

function isLoggedIn(req, res, next){
    if(req.isAuthenticated())
        return next();
    req.session.oldUrl = req.url;
    res.redirect('/');
}

function isActivated(req, res, next){
    if(req.user.is_activated == 1)
        return next();
    req.session.oldUrl = req.url;
    res.redirect('/activate');
}

function notLoggedIn(req, res, next){
    if(!req.isAuthenticated())
        return next();
    res.redirect('/');
}