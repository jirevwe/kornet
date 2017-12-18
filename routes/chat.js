let express = require('express');
let router = express.Router();
let csrf = require('csurf');
let Room = require('../models/room');
let _ = require('underscore')._;
let multer = require('multer');
const fs = require('fs');
let utils = require('../utils/api');

let csrfProtection = csrf();

router.post('/chathistory', (req, res, next) => {
    let room = req.body.room;
    let chatHistory = req.body.chatHistory;
    console.log("chat history");
    console.log(chatHistory);

    Room.update({room_id: room.id}, {history: chatHistory})
        .then(room => {
            return res.send({message: 'success', result: room});
        })
        .catch(err => {
            console.log(err);
            return res.send({message: 'failed'});
        });
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
router.get('/', utils.isActivated, (req, res, next) => {
    //console.log(req.user);
    res.render('chat/index', {layout: false, utils:utils, user: req.user, csrfToken: req.csrfToken()});
});

router.post('/password', (req, res, next) => {
    let password = req.body.password;
    let pass = utils.getLong(password);

    return res.json({password:pass});
});

router.post('/upload', utils.isActivated, upload.single('attachment'), (req, res, next) =>{
    return res.status(200).send(req.file);
});

router.post('/uploads/delete', utils.isActivated, (req, res, next) =>{
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

router.post('/add-room', utils.isActivated, (r, s, n) => {
    let room = r.body;
    console.log("room sent: ");
    console.log(room);

    let password = room.password == '' ? null : utils.setLong(room.password);

    let newRoom =  new Room({
        name: room.name,
        room_id: room.id,
        creator: room.creator,
        members: room.members,
        isDM: room.isDM,
        isPrivate: room.isPrivate,
        password: password
    });
    newRoom.save()
        .then(room => {
            console.log("room saved: "+room.room_id);
            console.log("room password saved: "+room.room_id);
            return s.send({message: 'success', result: room });
        })
        .catch(err => {
            return s.send({message: 'failed', result: 'Room could not be saved'});
        });


});

router.post('/update-room', utils.isActivated, (r, s, n)  => {
    let room = r.body;

    if(room.creator != r.user.id){
        let members = room.members;
        let isArray = _.isArray(members);
        if(isArray) {
            Room.update({room_id: room.id}, {$addToSet: {members: {$each: members}}})
                .then(room => {
                    return s.send({message: 'success', result: room });
                })
                .catch(err => {
                    return s.send({message: 'failed', result: 'Room could not be updated'});
                });
        }
    }

});


router.get('/room-members/:id', utils.isActivated, function(req, res, next) {
    let room_id = req.params.id;

    Room.find({'room_id': room_id }).populate("members").exec(function(err,results){
        if(err){
            console.log(err);
            return res.send({});
        }
        let room = results[0];
        let members = room.members;
        //console.log(members);
        res.json(members);
    });

});

router.get('/enter-room/:id', utils.isActivated, function(req, res, next) {
    var room_id = req.params.id;
    var user = req.user;

    Room.update({'room_id': room_id}, {$addToSet: {members: user._id}}, function (err, result) {
        if (err)
            console.log(err);
        else
            console.log(result);
        return res.redirect('/chat');
    });
});

router.get('/room-user/', utils.isActivated, function(req, res, next) {
    return res.json(req.user);
});

router.get('/room-creator/:id', utils.isActivated, function(req, res, next) {
    var room_id = req.params.id;

    Room.find({'room_id': room_id }).populate("creator").exec(function(err,results){
        if(err){
            console.log(err);
        }
        if(results){
            console.log(results);
            let room = results[0];
            let creator = room.creator;
            return res.json(creator);
        }
       return res.json({});
    });

});

router.post('/room-creator', utils.isActivated, function(req, res, next) {

    let rooms_id = req.body.rooms;

    console.log("rooms id");
    console.log(rooms_id);

    Room.find({'room_id': {$in : rooms_id}}).populate("creator").exec(function(err,results){
        if(err){
            console.log(err);
        }
        if(results){
            console.log("room creator");
            console.log(results);

            return res.json({all_results:results});
        }
        return res.json({});
    });

});

router.get('/rooms', function(req, res, next) {

    Room.find({}, function(err, results){
        if(err){
            console.log(err);
        }
        //console.log(results);
        return res.json(results);
    });

});

router.post('/invite-members', utils.isActivated, function (req, res, next) {
    let user = req.user;
    let members = req.body.members;
    let room_id = req.body.room_id;

    utils.sendEmail(user, members, {subject: 'Chat room invite', body: user.name+' has invited you to join his chatroom <br> <a href="http://localhost:3000/chat/enter-room/'+room_id+'">click here</a>'}, (message) => {
        console.log(message);
    });

    return res.json({result:'success'});

});

module.exports = router;
