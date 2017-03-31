var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var Room = require('../models/room');

var csrfProtection = csrf();

router.use(csrfProtection);

/* GET home page. */
router.get('/',isLoggedIn, function(req, res, next) {
    //console.log(req.user);
    res.render('chat/index', {layout: false, user: req.user, csrfToken: req.csrfToken()});
});

router.post('/add-room', function(req, res, next) {
    var room = req.body;
    console.log(room);
    var newRoom =  new Room({
        name: room.name,
        room_id: room.id,
        creator: room.creator,
        //members: room['members[]'],
        isDM: room.isDM,
        isPrivate: room.isPrivate,
        password: newRoom.encrypt(room.password)
    });

    //console.error(err.stack);

    console.log(room);

    // newRoom.save(function (err, result) {
    //     if(err){
    //         console.log(err);
    //     }
    //
    //     console.log(result);
    // });

    return newRoom;
    //console.log(room['members[]']);
});

router.post('/add-user-to-room', function(req, res, next) {

    var newroom = req.body;

    Room.findOne({'room_id':room.id}, function (err, room) {
        console.log(room);
        if(err){
            console.log(err);
        }
        if(!room){
            console.log("room no dey");
        }
        room.members = newroom['members[]'];
        room.save(function(err, result) {
            if (err)
                console.log(err);
            else
                console.log(result);
        });
        return res.redirect('/');
    });

});

router.post('/get-room-members', function(req, res, next) {
    var users = req.body['users[]'];
    Room.find({'members': {'$in': users} },(err,result)=>{
        if(err){
            console.log(err);
        }
       // console.log("members "+result);
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