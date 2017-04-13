let express = require('express');
let http = require("http");
let router = express.Router();
let Controller = require('../models/controller');
let Business = require('../models/business');
let User = require('../models/user');
let passport = require('passport');
const fs = require('fs');
let csrf = require('csurf');
let multer = require('multer');
let _ = require('underscore')._;
let randomstring = require("randomstring");


let storage = multer.diskStorage({
    destination: './public/uploads/business',
    filename: function(req, file, cb) {
        cb( null, file.originalname);
    }
});

let upload = multer({
    limits: {
        fileSize: 10240000
    },
    storage : storage
});
let users = [];

function user_add(user){
    users.push(user);
}

router.post('/business', upload.single('staff_file'), isLoggedIn, function (req, res, next) {
    let business_name = req.body.business_name;
    let domain_name = req.body.domain_name;
    let staff = req.body.staff;
    let staff_file = req.file.filename;
    let network_provider = req.body.network_provider;
    let created_by = req.session.controller;

    let numbers = [];


    let token = randomstring.generate({
        length: 5,
        charset: 'numeric'
    });
    console.log("your password is "+token);

        let loader = require('csv-load-sync');
        let csv = loader('./public/uploads/business/' + staff_file);
        //console.log(csv);
        _.map(csv, function (num, key) {
            numbers.push(_.toArray(num));
        });
        numbers = _.flatten(numbers);
        //console.log(numbers);
        count = 0;
        for (i = 0; i < numbers.length; i++) {
            let number = numbers[i];
            if (number.match("^0")) {
                number = number.replace("0", "+234");
                console.log(number);
            }
            if (number.match("^234")) {
                number = number.replace("234", "+234");
                console.log(number);
            }
            User.findOne({'phone_number': number}, function (err, user) {
                if (err) {
                    req.flash('error', 'Error getting user.');
                }
                if (user){
                    req.flash('error', '"'+number + '" has already been used.');
                    console.log(number + ' has already been used.');
                    count++;
                }
                else {

                    let newUser = new User;

                    newUser.email = 'none';
                    newUser.phone_number = number;
                    newUser.password = newUser.encrypt(token);
                    newUser.network_provider = network_provider;
                    newUser.user_type = 'Business';
                    newUser.user_domain = domain_name;
                    newUser.security_token = 'none';
                    newUser.long_text = 'none';

                    newUser.save(function (err, result) {
                        if (err) {
                            req.flash('error', 'Error creating user');
                            console.log(err);
                        }
                        console.log(newUser._id);
                        users.push(newUser._id);
                    });
                }
            });
        }
        console.log("count "+count);
        //console.log(users);
        // Business.findOne({ $or: [ {'name':business_name}, {'domain':domain_name} ] }, function (err, business) {
        //     if(err){
        //         req.flash('error', 'Error getting business.');
        //     }
        //     if(business){
        //         if(business.name == business_name){
        //             req.flash('error', '"'+business_name+'" Business name has been taken.');
        //         }
        //         if(business.domain == domain_name){
        //             req.flash('error', '"'+domain_name+'" Domain name has been taken.');
        //         }
        //     }else {
        //
        //         let newBusiness = new Business;
        //
        //         newBusiness.name = business_name;
        //         newBusiness.domain = domain_name;
        //         newBusiness.users = users;
        //         newBusiness.admin = users[0];
        //         newBusiness.staff_number = staff;
        //         newBusiness.created_by = created_by.name;
        //
        //         newBusiness.save(function (err, result) {
        //             if (err) {
        //                 req.flash('error', 'Error creating Business');
        //                 console.log(err);
        //             }
        //
        //             res.render('controller/final', {
        //                 layout: 'auth_header',
        //                 user: req.session.controller,
        //                 numbers: numbers,
        //                 pass: token,
        //                 admin: numbers[0]
        //             });
        //         });
        //     }
        //     res.redirect('/controller/');
        // });

});



let csrfProtection = csrf();
router.use(csrfProtection);

router.get('/', isLoggedIn, function (req, res, next) {
    let messages = req.flash('error');
    res.render('controller/index', {layout: 'auth_header', user: req.session.controller, csrfToken: req.csrfToken(),  messages:messages, hasErrors:messages.length > 0});
});

router.get('/signin', notLoggedIn, function (req, res, next) {
    let messages = req.flash('error');
    res.render('controller/signin', {layout: 'auth_header', csrfToken: req.csrfToken(), messages:messages, hasErrors:messages.length > 0});
});

router.post('/signin', notLoggedIn, function (req, res, next) {
    let email = req.body.email;
    let password = req.body.password;

    Controller.findOne({'email':email}, function (err, controller) {
        if(err){
            req.flash('error', 'Error getting user');
            return res.redirect('/controller/signin');
        }
        if(!controller){
            req.flash('error', 'User does not exist');
            return res.redirect('/controller/signin');
        }
        if(!controller.validatePassword(password)){
            req.flash('error', 'Wrong Password');
            return res.redirect('/controller/signin');
        }
        req.session.controller = controller;
        return res.redirect('/controller/');
    });
});

router.get('/create', notLoggedIn, function (req, res, next) {
    let messages = req.flash('error');
    res.render('controller/create', {layout: 'auth_header', csrfToken: req.csrfToken(), messages:messages, hasErrors:messages.length > 0});
});

router.post('/create', notLoggedIn, function (req, res, next) {
    let email = req.body.email;
    let name = req.body.name;
    let password = req.body.password;
    let password2 = req.body.password2;

    if(password != password2){
        req.flash('error', 'Passwords do not match');
        return res.redirect('/controller/create');
    }
    Controller.findOne({'email':req.body.email}, function (err, controller) {
        if(err){
            req.flash('error', 'Error getting controller.');
            return res.redirect('/controller/create');
        }
        if(controller){
            if(controller.email == req.body.email){
                req.flash('error', 'Email Has been taken.');
                return res.redirect('/controller/create');
            }
        }

        let newController =  new Controller;

        newController.email = email;
        newController.name = name;
        newController.password = newController.encrypt(password);
        newController.created_by = 'Jude';

        newController.save(function (err, result) {
            if(err){
                req.flash('error', 'Error creating user');
                console.log(err);
                return res.redirect('/controller/create');
            }

            req.session.controller= newController;
            //console.log(req.session.controller);
            return res.redirect('/controller/');
        });
    });
});


module.exports = router;


function isLoggedIn(req, res, next){
    //console.log(res.locals.controller);
    if(req.session.controller)
        return next();
    req.session.oldUrl = req.url;
    res.redirect('/controller/signin');
}

function notLoggedIn(req, res, next){
    if(!req.session.controller)
        return next();
    res.redirect('/controller/');
}