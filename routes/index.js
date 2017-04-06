let express = require('express');
let router = express.Router();
let csrf = require('csurf');
let passport = require('passport');
let Order = require('../models/order');
let Cart = require('../models/cart');
let User = require('../models/user');
let multer = require('multer');
let randomstring = require("randomstring");
let messagebird = require('messagebird')(
    'oppA3GZBi0bjhGckAkaWcloUf'
);
let storage =   multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './public/uploads/user');
    },
    filename: function (req, file, callback) {
        let originalname = file.originalname;
        let extension = originalname.split(".");
        filename = Date.now() + '.' + extension[extension.length-1];
        callback(null, filename);
    }
});
let upload = multer({ storage : storage }).single('userPhoto');

router.post('/profile', upload, function (req, res, next) {

    User.findOne({'_id':req.user._id}, function (err, user) {
        if(err){
            return done(user);
        }
        if(!user){
            req.flash('error', 'User does not exist');
            return res.redirect('/profile');
        }

        if(req.file){
            console.log("req.file");
            console.log(req.file);
            user.profile_image = req.file.filename;
        }
        user.first_name = req.body.first_name;
        user.last_name = req.body.last_name;
        user.address = req.body.address;
        user.date_of_birth = req.body.date_of_birth;
        user.network_provider = req.body.network_provider;
        user.country = req.body.country;
        user.state = req.body.state;
        user.next_of_kin = req.body.next_of_kin;
        user.next_of_kin_number = req.body.next_of_kin_number;
        user.modified_at = new Date();
        user.save(function(err) {
            if (err)
                console.log('error');
            else
                console.log(user);
        });
        req.flash('success', 'Profile has been updated');
        return res.redirect('/profile');
    });
});


let csrfProtection = csrf();

router.use(csrfProtection);


router.use('/', function (req, res, next) {
    next();
});

router.get('/',  function (req, res, next) {
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


router.get('/activate', isActivated, function (req, res, next) {
    let messages = req.flash('error');
    res.render('user/activate', {csrfToken: req.csrfToken(), messages:messages, hasErrors:messages.length > 0});
});

router.post('/activate', isActivated, function (req, res, next) {

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

router.get('/signup', notLoggedIn,  function (req, res, next) {
    let messages = req.flash('error');
    res.render('user/signup', {csrfToken: req.csrfToken(), domain:'demo.kornet-test.com' ,messages:messages, hasErrors:messages.length > 0});
});

router.post('/signup', notLoggedIn,  passport.authenticate('local.signup', { failureRedirect: '/signup', failureFlash: true }), function (req, res, next) {
    if(req.user.is_activated == 0){
        res.redirect('/activate');
    }
    else{
        if(req.session.oldUrl){
            let oldUrl = req.session.oldUrl;
            req.session.oldUrl = null;
            res.redirect(oldUrl);
        }else{
            res.redirect('/');
        }

    }
});

router.get('/signin', notLoggedIn, function (req, res, next) {
    let messages = req.flash('error');
    res.render('user/signin', {csrfToken: req.csrfToken(), messages:messages, hasErrors:messages.length > 0});
});

router.post('/signin', notLoggedIn, passport.authenticate('local.signin', { failureRedirect: '/signin', failureFlash: true }), function (req, res, next) {
    if(req.session.oldUrl){
        let oldUrl = req.session.oldUrl;
        req.session.oldUrl = null;
        res.redirect(oldUrl);
    }
    else{
        res.redirect('/');
    }
});

router.get('/profile', isLoggedIn, function (req, res, next) {
    let successMsg = req.flash('success')[0];
    res.render('user/profile', {successMsg: successMsg, noMessage: !successMsg, user: req.user, csrfToken: req.csrfToken()});
});

router.get('/forgot', notLoggedIn, function (req, res, next) {
    let messages = req.flash('error');
    res.render('user/forgot', {csrfToken: req.csrfToken(), messages:messages, hasErrors:messages.length > 0});
});

router.get('/logout', function (req, res, next) {
    req.logout();
    res.redirect('/');
});

router.post('/sec_recovery', notLoggedIn, function (req, res, next) {
    let user_id = req.body.user_id;
    //console.log(req.body.user_id);
    User.findOne({ $or: [ {'email':user_id}, {'phone_number':user_id} ] }, function (err, user) {
        if(err){

            return res.json({result: "error", message:"Error getting user"});
        }
        if(!user){

            return res.json({result: "error", message:"User not found"});
        }

        let question = user.security_question;

        return res.json({result: "success", user:user.email, question: question});
    });
});

router.post('/token_recovery', notLoggedIn, function (req, res, next) {
    let user_id = req.body.user_id;

    User.findOne({ $or: [ {'email':user_id}, {'phone_number':user_id} ] }, function (err, user) {
        if(err){
            return res.json({result: "error", message:"Error getting user"});
        }
        if(!user){
            return res.json({result: "error", message:"User not found"});
        }
        let token = randomstring.generate({
            length: 5,
            charset: 'numeric'
        });
        console.log("your token is "+token);
        user.security_token = user.encrypt(token);

        user.save(function (err, result) {
            if(err){
                return done(err);
            }

            let params = {
                'originator': 'Kornet',
                'recipients': [
                    user.phone_number
                ],
                'body': 'Your Kornet verification code is: '+token
            };

            messagebird.messages.create(params, function (err, data) {
                if (err) {
                    return console.log(err);
                }
                console.log(data);
            });

            return res.json({result: "success", user:user.email});
        });
    });
});

router.post('/verify_token', notLoggedIn, function (req, res, next) {
    let user_id = req.body.user_id;
    let reply_id = req.body.reply_id;
    console.log(req.body);
    User.findOne({'email':user_id}, function (err, user) {
        if(err){
            return res.json({result: "error", message:"Error getting user"});
        }
        if(!user){

            return res.json({result: "error", message:"User not found"});
        }
        if(!user.validateToken(reply_id)){

            return res.json({result: "error", message:"Wrong Token"});
        }

        return res.json({result: "success", user:user.email});
    });
});

router.post('/verify_sec_answer', notLoggedIn, function (req, res, next) {
    let user_id = req.body.user_id;
    let reply_id = req.body.reply_id;
    console.log(req.body);
    User.findOne({'email':user_id}, function (err, user) {
        if(err){

            return res.json({result: "error", message:"Error getting user"});
        }
        if(!user){

            return res.json({result: "error", message:"User not found"});
        }
        if(!user.validateSecAnswer(reply_id)){

            return res.json({result: "error", message:"Wrong Answer"});
        }

        return res.json({result: "success", user:user.email});
    });
});

router.post('/change_pass', notLoggedIn, passport.authenticate('local.change_pass', { failureRedirect: '/forgot', failureFlash: true }), function (req, res, next) {
        res.json({url: '/'});
});

module.exports = router;

function isLoggedIn(req, res, next){
    if(req.isAuthenticated())
        return next();
    req.session.oldUrl = req.url;
    res.redirect('/');
}

function isActivated(req, res, next){
    if(req.user.is_activated != 1 && req.isAuthenticated())
        return next();
    res.redirect('/');
}

function notLoggedIn(req, res, next){
    if(!req.isAuthenticated())
        return next();
    res.redirect('/');
}