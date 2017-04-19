var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var paystack = require('../config/paystack');
let Wallet = require('../models/wallet');
let www = require('../bin/www'); 

let csrfProtection = csrf();
router.use(csrfProtection);

router.get('/', isActivated, function (req, res, next) {
    let successMsg = req.flash('success')[0];
    let user = req.user;

    if(user.wallet == undefined){
        let new_wallet = new Wallet({open: false, balance: 0});
        new_wallet.save((err, result) => {
            user.wallet = result._id;
            
            Wallet.update({ _id: result._id }, { open: true }, (err, doc) => {
                if(err) console.log(err);
            });
            
            user.save((err, _user) => {
                if(err) console.log(err);
            });
            
            //create customer/user on paystack
            paystack.createCustomer();
        });
    }else{
		let wallet, customer = undefined;
		Wallet.findById(user.wallet, (err, document) => {
			wallet = document;
			www.io.emit('wallet_details_to_client', { content: wallet.balance });
			console.log(wallet);
		});
		paystack.getCustomers(user, (use)=> {
			customer = use;
		});		
	}

    res.render('wallet/index', { csrfToken: req.csrfToken() });
});

module.exports = router;

function notActivated(req, res, next){
    if(req.user.is_activated != 1 && req.isAuthenticated()){
        return next();
    }
    res.redirect('/');
}

function isActivated(req, res, next){
    if(req.user.name == req.user.phone_number && req.user.is_activated != 1 && req.isAuthenticated()){
        req.session.oldUrl = req.url;
        res.redirect('/choose');
    }
    else if(req.user.is_activated != 1 && req.isAuthenticated()){
        req.session.oldUrl = req.url;
        res.redirect('/activate');
    }
    else if(!req.isAuthenticated()){
        req.session.oldUrl = req.url;
        res.redirect('/signin');
    }
    return next();
}

function notLoggedIn(req, res, next){
    if(!req.isAuthenticated())
        return next();
    res.redirect('/');
}