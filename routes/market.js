var express = require('express');
var router = express.Router();
var Cart = require('../models/cart');
var Product = require('../models/product');
var Order = require('../models/order');

router.get('/', function(req, res, next) {
    var successMsg = req.flash('success')[0];
  Product.find(function (err, docs) {
    var productChunks = [];
    var chunkSize = 3;
    for(var i = 0; i < docs.length; i+=chunkSize){
      productChunks.push(docs.slice(i, i + chunkSize));
    }
      res.render('shop/index', { title: 'Shopping Cart', layout: 'marketplace_layout', products: productChunks, successMsg: successMsg, noMessage: !successMsg });
  });
});

router.get('/orders', function (req, res, next) {
    Order.find({user: req.user}, function (err, orders) {
        if(err){
            return res.write('Error!!');
        }
        var cart;
        orders.forEach(function (order) {
            cart = new Cart(order.cart);
            order.items = cart.generateArray();
        });
        res.render('shop/orders', {layout: 'marketplace_layout', orders: orders});
    });

});

router.get('/add-to-cart/:id', function(req, res, next) {
    var productID = req.params.id;
    var cart = new Cart(req.session.cart? req.session.cart : {});

    Product.findById(productID, function (err, product) {
        if(err){
            return res.redirect('/market');
        }
        cart.add(product, product.id);
        req.session.cart = cart;
        //console.log(req.session.cart);
        res.redirect('/market');
    });
});

router.get('/reduce/:id', function(req, res, next) {
    var productID = req.params.id;
    var cart = new Cart(req.session.cart? req.session.cart : {});

    cart.reduceByOne(productID);
    req.session.cart = cart;
    res.redirect('/market/shopping-cart');
});

router.get('/remove/:id', function(req, res, next) {
    var productID = req.params.id;
    var cart = new Cart(req.session.cart? req.session.cart : {});

    cart.remove(productID);
    req.session.cart = cart;
    res.redirect('/market/shopping-cart');
});

router.get('/shopping-cart', function(req, res, next) {
    if(!req.session.cart){
        return res.render('shop/shopping-cart', {layout: 'marketplace_layout', products: null});
    }
    var cart = new Cart(req.session.cart);
    res.render('shop/shopping-cart', {layout: 'marketplace_layout', products: cart.generateArray(), totalPrice:cart.totalPrice});

});

router.get('/checkout', isLoggedIn, function(req, res, next) {
    if(!req.session.cart){
        res.redirect('/market');
    }
    var cart = new Cart(req.session.cart);
    var errMsg = req.flash('error')[0];
    res.render('shop/checkout', {layout: 'marketplace_layout', total: cart.totalPrice, errMsg: errMsg, noError: !errMsg});
});

router.post('/checkout', function(req, res, next) {
    if(!req.session.cart){
        res.redirect('/market');
    }
    var cart = new Cart(req.session.cart);
    var stripe = require("stripe")(
        "sk_test_oEklV8QOS3R80QXCK1VzdWuv"
    );

    stripe.charges.create({
        amount: cart.totalPrice * 100,
        currency: "usd",
        source: req.body.stripeToken, // obtained with Stripe.js
        description: "Test Charge"
    }, function(err, charge) {
        if(err){
            req.flash('error', err.message);
            return res.redirect('/checkout');
        }
        var order = new Order({
            user: req.user,
            cart: cart,
            address: req.body.address,
            name: req.body.name,
            paymentID: charge.id
        });

        order.save(function (err, result) {
            if(err){
                var errMsg = 'Error processing your order, Pls contact an adminstrator.';
                res.render('shop/checkout', {layout: 'marketplace_layout', total: cart.totalPrice, errMsg: errMsg, noError: !errMsg});
            }
            req.flash('success', 'Successfully bought product!!');
            req.session.cart = null;
            res.redirect('/market');
        });

    });
});

module.exports = router;

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.session.oldUrl = req.url;
    res.redirect('/signin');
}