var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var Room = require('../models/room');

var csrfProtection = csrf();

router.use(csrfProtection);

/* GET home page. */
router.get('/',isLoggedIn, function(req, res, next) {
    console.log(req.user);
    res.render('chat/index', {layout: false, user: req.user, csrfToken: req.csrfToken()});
});

router.post('/add-room', function(req, res, next) {
    var room = req.body;
    console.log(room.name);
    console.log(room['members[]']);
});

router.post('/add-user-to-room', function(req, res, next) {
    var room = req.body;

    console.log(room);
    console.log(room.name);
    console.log(room['members[]']);
});

router.post('/get-room-members', function(req, res, next) {
    var users = req.body['users[]'];
    Room.find({'members': {'$in': users} },(err,result)=>{
        if(err){
            console.log(err);
        }
        console.log(result);
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