let express = require('express');
let router = express.Router();
let csrf = require('csurf');
let passport = require('passport');
let Order = require('../models/order');
let Cart = require('../models/cart');
let User = require('../models/user');
let Business = require('../models/business');
var utils = require('../utils/api');
let multer = require('multer');
let randomstring = require("randomstring");
let messagebird = require('messagebird')('oppA3GZBi0bjhGckAkaWcloUf');

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
        if(err) return done(user);
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
            if (err) console.log(err);
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
        res.render('index', {user: req.user});
    else
        res.render('index', {});
});

router.get('/is_admin',  function (req, res, next) {
    Business.findOne({'domain':req.user.user_domain}, function (err, business) {
        if (err) {
            //req.flash('error', 'Error getting business.');
            return res.json({result: "false"});
        }
        if (business){
            console.log(business.admin);
            console.log(req.user._id);
            if(""+req.user._id == ""+business.admin){
                return res.json({result: "true"});
            }
        }
        if (!business){
            //console.log(business);
            return res.json({result: "false"});
        }
        return res.json({result: "false"});
    });
});

router.get('/activate', utils.notActivated, function (req, res, next) {
    let messages = req.flash('error');
    res.render('user/activate', {phone:req.user.phone_number, csrfToken: req.csrfToken(), messages:messages, hasErrors:messages.length > 0});
});

router.post('/activate', utils.notActivated, function (req, res, next) {

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

router.get('/signup', utils.notLoggedIn,  function (req, res, next) {
    let messages = req.flash('error');
    res.render('user/signup', {csrfToken: req.csrfToken(), domain:'demo.kornet-test.com' ,messages:messages, hasErrors:messages.length > 0});
});

router.post('/signup', utils.notLoggedIn,  passport.authenticate('local.signup', { failureRedirect: '/signup', failureFlash: true }), function (req, res, next) {
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

router.get('/signin', utils.notLoggedIn, function (req, res, next) {
    let messages = req.flash('error');
    res.render('user/signin', {csrfToken: req.csrfToken(), messages:messages, hasErrors:messages.length > 0});
});

router.post('/signin', utils.notLoggedIn, passport.authenticate('local.signin', { failureRedirect: '/signin', failureFlash: true }), function (req, res, next) {
    if(req.user.name == req.user.phone_number || (req.user.user_domain == 'Business' && req.user.is_activated != 1) ){
        res.redirect('/choose');
    }
    else{
        if(req.session.oldUrl){
            let oldUrl = req.session.oldUrl;
            req.session.oldUrl = null;
            res.redirect(oldUrl);
        }
        else{
            res.redirect('/');
        }
    }
});

router.get('/profile', utils.isActivated, function (req, res, next) {
    let successMsg = req.flash('success')[0];
    res.render('user/profile', {successMsg: successMsg, noMessage: !successMsg, user: req.user, csrfToken: req.csrfToken()});
});


router.get('/forgot', utils.notLoggedIn, function (req, res, next) {
    let messages = req.flash('error');
    res.render('user/forgot', {csrfToken: req.csrfToken(), messages:messages, hasErrors:messages.length > 0});
});

router.get('/choose', utils.notActivated, function (req, res, next) {
    let messages = req.flash('error');
    let phone  = req.user.phone_number;
    res.render('user/choose', {csrfToken: req.csrfToken(), phone:phone, messages:messages, hasErrors:messages.length > 0});
});

router.get('/logout', function (req, res, next) {
    req.logout();
    res.redirect('/');
});

router.post('/sec_recovery', utils.notLoggedIn, function (req, res, next) {
    let user_id = req.body.user_id;
    //console.log(req.body.user_id);
    User.findOne({ $or: [ {'name':user_id}, {'phone_number':user_id} ] }, function (err, user) {
        if(err){

            return res.json({result: "error", message:"Error getting user"});
        }
        if(!user){

            return res.json({result: "error", message:"User not found"});
        }

        let question = user.security_question;

        return res.json({result: "success", user:user.name, question: question});
    });
});

router.post('/token_recovery', utils.notLoggedIn, function (req, res, next) {
    let user_id = req.body.user_id;

    User.findOne({ $or: [ {'name':user_id}, {'phone_number':user_id} ] }, function (err, user) {
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

            return res.json({result: "success", user:user.name});
        });
    });
});

router.post('/verify_token', utils.notLoggedIn, function (req, res, next) {
    let user_id = req.body.user_id;
    let reply_id = req.body.reply_id;
    console.log(req.body);
    User.findOne({'name':user_id}, function (err, user) {
        if(err){
            return res.json({result: "error", message:"Error getting user"});
        }
        if(!user){

            return res.json({result: "error", message:"User not found"});
        }
        if(!user.validateToken(reply_id)){

            return res.json({result: "error", message:"Wrong Token"});
        }

        return res.json({result: "success", user:user.name});
    });
});

router.post('/verify_sec_answer', utils.notLoggedIn, function (req, res, next) {
    let user_id = req.body.user_id;
    let reply_id = req.body.reply_id;
    console.log(req.body);
    User.findOne({'name':user_id}, function (err, user) {
        if(err){

            return res.json({result: "error", message:"Error getting user"});
        }
        if(!user){

            return res.json({result: "error", message:"User not found"});
        }
        if(!user.validateSecAnswer(reply_id)){

            return res.json({result: "error", message:"Wrong Answer"});
        }

        return res.json({result: "success", user:user.name});
    });
});

router.post('/change_pass', utils.notLoggedIn, passport.authenticate('local.change_pass', { failureRedirect: '/forgot', failureFlash: true }), function (req, res, next) {
        res.json({url: '/'});
});

router.post('/verify_user', utils.notActivated, passport.authenticate('local.verify_user', { failureRedirect: '/choose', failureFlash: true }), function (req, res, next) {
    if(req.session.oldUrl){
        let oldUrl = req.session.oldUrl;
        req.session.oldUrl = null;
        res.redirect(oldUrl);
    }
    else{
        res.redirect('/');
    }
});

// API ENDPOINTS
router.get('/contacts', utils.isActivated, function (req, res, next) {
    let user = req.user;
    let contacts = [];
    if (user.user_domain != undefined ){
        Business.find({'domain': user.user_domain}).populate("users", "id name email phone_number is_activated").exec(function(err, results){
            if(err){
                return res.json({result: "failed", contacts:[]});
            }
            let result = results[0];

            let contact1 = result.users;

            for(i in contact1){
                if(contact1[i].is_activated == 1 && contact1[i].name != user.name){
                    contacts.push(contact1[i]);
                }
            }

            //return res.json({result: "success", contacts:});
            User.find({'_id': user._id, 'is_activated': 1 }).populate("contacts", "_id name email phone_number is_activated").exec(function(err,results){
                if(err){
                    return res.json({result: "failed", contacts:[]});
                }

                let result = results[0];
                let contact2 = result.users;

                if(contact2 != null){
                    for(i in contact2){
                        if(contact2[i].is_activated == 1 && contact2[i].name != user.name){
                            contacts.push(contact1[i]);
                        }
                    }
                }
                return res.json({result: "success", contacts:contacts});
            });
        });
    }
    else{
        if(user.contacts != undefined){
            User.find({'_id': user._id, 'is_activated': 1 }).populate("contacts", "_id name email phone_number is_activated").exec(function(err,results){
                if(err){
                    return res.json({result: "failed", contacts:[]});
                }
                let result = results[0];
                let contact1 = result.contacts;

                for(i in contact1){
                    if(contact1[i].is_activated == 1 && contact1[i].name != user.name){
                        contacts.push(contact1[i]);
                    }
                }
                return res.json({result: "success", contacts:contacts});
            });
        }
       // return res.json({result: "success", contacts:[]});
    }

});

router.post('/contacts', utils.isActivated, function (req, res, next) {
    let user = req.user;
    let contacts = req.body.contacts;
    User.update({_id: user.id}, {$addToSet: {members: {$each: contacts}}}, function (err, result) {
        if (err)
            return res.json({result: "failed"});
        else
            return res.json({result: "success"});
    });
});

router.get('/download/:filename', utils.isActivated, function (req, res, next) {
    res.download('./tmp/' + req.params.filename, req.params.filename, function(err){
        if (err) console.log(err);
    });
});

module.exports = router;