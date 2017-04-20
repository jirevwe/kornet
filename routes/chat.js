var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var Room = require('../models/room');
let _ = require('underscore')._;
let multer = require('multer');
const fs = require('fs');

let csrfProtection = csrf();

router.post('/chathistory', function(req, res, next) {
    let room = req.body.room;
    let chatHistory = req.body.chatHistory;
    console.log("details: ");
    Room.update({room_id: room.id}, {history: chatHistory}, function (err, result) {
        if (err) {
            return res.status(500);
        }
        console.log(result);
        //return res.status(200);
    });
   // return res.status(200);
});

router.post('/room-chat', isActivated, function(req, res, next) {
    var room_id = req.body.room_id;
    var chatHistory = req.body.chat_history;

    Room.findOne({'room_id':room_id}, function (err, room) {
        if(err){
            return done(room);
        }
        if(!room){
            req.flash('error', 'User does not exist');
            return res.redirect('/user/activate');
        }
        //
        // user.is_activated = 1;
        // user.save(function(err) {
        //     if (err)
        //         console.log('error');
        //     else
        //         console.log('success');
        // });
        // return res.redirect('/');
    });
    return res.status(200);
});

router.use(csrfProtection);

let storage = multer.diskStorage({
	destination: './public/uploads/room',
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

/* GET home page. */
router.get('/', isActivated, function(req, res, next) {
    //console.log(req.user);
    res.render('chat/index', {layout: false, user: req.user, csrfToken: req.csrfToken()});
});

router.post('/upload', isActivated, upload.single('attachment'), function(req, res, next){
    return res.status(200).send(req.file);
});

router.post('/uploads/delete', isActivated, function(req, res, next){
    let file = req.body.file;

    fs.exists('./public/uploads/room/'+file.originalname, (exists) => {
        if(exists){
            fs.unlink('./public/uploads/room/'+file.originalname, (err) => {
                if (err) {
                    console.log("error delete");
                    console.log(err);
                    return res.status(200);
                }
                console.log('successfully deleted');
            });
        }
    });
    return res.status(200);
});

router.post('/add-room', isActivated, function(req, res, next) {
    var room = req.body;
    console.log("room sent: "+room.id);

    if(room.password == ''){
        var newRoom =  new Room({
            name: room.name,
            room_id: room.id,
            creator: room.creator,
            members: room['members[]'],
            isDM: room.isDM,
            isPrivate: room.isPrivate
        });
        newRoom.save(function (err, result) {
            if(err){
                console.log(err);
            }

            console.log("room saved: "+newRoom.room_id);
            console.log("room password saved: "+newRoom.room_id);
            res.json(200);
        });

        //return res.send(200);
    }
    else {
        var ARoom =  new Room({});
        var newRoom2 =  new Room({
            name: room.name,
            room_id: room.id,
            creator: room.creator,
            members: room['members[]'],
            isDM: room.isDM,
            isPrivate: room.isPrivate,
            password: ARoom.encrypt(room.password)
        });
        newRoom2.save(function (err, result) {
            if(err){
                console.log(err);
            }
            console.log("room password saved: "+newRoom.room_id);
            return res.json(200);
        });

        //return res.send(200);
    }


});

router.post('/update-room', isActivated, function(req, res, next) {

    var newroom = req.body;
    console.log("update room: "+newroom.id);


    if(newroom.creator != req.user.id){
        console.log("not equal");
        var members = newroom['members[]'];
        //console.log(members);
        var isArray = _.isArray(members);
        console.log(isArray);
        if(isArray) {
            Room.update({room_id: newroom.id}, {$addToSet: {members: {$each: members}}}, function (err, result) {
                if (err)
                    console.log(err);
                else
                    console.log(result);
                return res.json(200);
            });
        }
    }

    //return res.send(200);
});


router.get('/room-members/:id', isActivated, function(req, res, next) {
    var room_id = req.params.id;

    Room.find({'room_id': room_id }).populate("members").exec(function(err,results){
        if(err){
            console.log(err);
        }
        let room = results[0];
        let members = room.members;
        console.log(members);
        res.json(members);
    });

});

router.get('/room-user/', isActivated, function(req, res, next) {
    return res.json(req.user);

});

router.get('/room-creator/:id', isActivated, function(req, res, next) {
    var room_id = req.params.id;
    Room.find({'room_id': room_id }).populate("creator").exec(function(err,results){
        if(err){
            console.log(err);
        }
        let room = results[0];
        let creator = room.creator;
        res.json(creator);
    });

});

router.get('/rooms', function(req, res, next) {

    Room.find({}, function(err, results){
        if(err){
            console.log(err);
        }
        console.log(results);
        return res.json(results);
    });

});

module.exports = router;

function isActivated(req, res, next){
    if(!req.isAuthenticated()){
        req.session.oldUrl = req.url;
        return res.redirect('/signin');
    }
    else if(req.user.name == req.user.phone_number && req.user.is_activated != 1 && req.isAuthenticated()){
        req.session.oldUrl = req.url;
        return res.redirect('/choose');
    }
    else if(req.user.is_activated != 1 && req.isAuthenticated()){
        req.session.oldUrl = req.url;
        return res.redirect('/activate');
    }
    return next();
}
