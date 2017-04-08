var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var Room = require('../models/room');
let _ = require('underscore')._;
let multer = require('multer');
const fs = require('fs');

let csrfProtection = csrf();

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
router.get('/',isLoggedIn, function(req, res, next) {
    //console.log(req.user);
    res.render('chat/index', {layout: false, user: req.user, csrfToken: req.csrfToken()});
});

router.post('/upload', upload.single('attachment'), function(req, res, next){
    return res.status(200).send(req.file);
});

router.post('/uploads/delete', function(req, res, next){
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

router.post('/add-room', function(req, res, next) {
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
        });

        //return newRoom;
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
        });

        //return newRoom2;
    }

});

router.post('/update-room', function(req, res, next) {

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
            });
        }
    }

});


router.get('/room-members/:id', function(req, res, next) {
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

module.exports = router;

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.session.oldUrl = req.url;
    res.redirect('/signin');
}