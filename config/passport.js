var passport = require('passport');
var User = require('../models/user');
var LocalStrategy = require('passport-local').Strategy;
var randomstring = require("randomstring");
var mysql = require('mysql');
var messagebird = require('messagebird')(
    'oppA3GZBi0bjhGckAkaWcloUf'
);

function maildirFolder(username) {
    let temp = username.substr(0,3);
    let res = temp[0] + '/' + temp[1] + '/' + temp[2] + '/' + username + '/';
    return res;
}

function ssha512(cleartext) {
    let passwordhasher = require('password-hasher');
    let hash = passwordhasher.createHash('ssha512', cleartext, new Buffer('83d88386463f0625', 'hex'));
    return passwordhasher.formatRFC2307(hash);
}

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

 passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
       done(err, user);
    });
 });

 passport.use('local.signup', new LocalStrategy({
     usernameField: 'email',
     passwordField: 'password',
     passReqToCallback: true
 },
     function (req, email, password, done) {
     //req.checkBody('username', 'Username cannot be empty').notEmpty();
     req.checkBody('email', 'Invalid email').notEmpty().isEmail();
     req.checkBody('password', 'Invalid password').notEmpty();
     req.checkBody('password', 'Password should be at least 8 characters').isLength({min:8});
     req.checkBody('password', 'Passwords do not match').equals(req.body.password2);
     var errors = req.validationErrors();
     if(errors){
         var messages = [];
         errors.forEach(function (error) {
            messages.push(error.msg);
         });

         return done(null, false, req.flash('error', messages));
     }
     User.findOne({ $or: [ {'username':req.body.username}, {'phone_number':req.body.phone} ] }, function (err, user) {
          if(err){
              return done(user);
          }
          if(user){
              return done(null, false, {message: 'Username/Password Has been taken.'});
          }

          var token = randomstring.generate({
             length: 5,
             charset: 'numeric'
          });
            console.log("your token is "+token);
          var newUser =  new User;

          newUser.username = req.body.username;
          newUser.email = email;
          newUser.phone_number = req.body.phone;
          newUser.gender = req.body.gender;
          newUser.password = newUser.encrypt(password);
          newUser.security_question = req.body.question;
          newUser.security_answer = req.body.answer;
          newUser.security_token = newUser.encrypt(token);


         var connection = mysql.createConnection({
             host     : 'mail.kornet-test.com',
             user     : 'root2',
             password : '00000',
             database : 'vmail',
             debug    : false
         });

         connection.connect();

         let values = [	req.body.username  + '@demo.kornet-test.com',
             ssha512(password),
             "",
             '/var/vmail',
             'vmail1',
             'demo.kornet-test.com/' + maildirFolder(req.body.username),
             1024,
             'demo.kornet-test.com',
             1,
             req.body.username,
             new Date(Date.now())
         ];

         connection.query('INSERT INTO mailbox (username, password, name, storagebasedirectory, storagenode, maildir, quota, domain, active, local_part, created) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
             values, function(err, results) {
                 if (err) console.log(err);
                 console.log(results);
             });

         let values2 = [ req.body.username + '@demo.kornet-test.com',
             req.body.username + '@demo.kornet-test.com',
             'demo.kornet-test.com',
             new Date(Date.now()),
             1];

         connection.query('INSERT INTO alias (address, goto, domain, created, active) VALUES (?,?,?,?,?)', values2, function(err, results) {
             if (err) console.log(err);
             console.log(results);
         });

         connection.end();


          newUser.save(function (err, result) {
              if(err){
                  return done(err);
              }

              var params = {
                  'originator': 'Kornet',
                  'recipients': [
                      req.body.phone
                  ],
                  'body': 'Your Kornet verification code is: '+token
              };

              messagebird.messages.create(params, function (err, data) {
                  if (err) {
                      return console.log(err);
                  }
                  console.log(data);
              });

              return done(null, newUser);
          });
     });
 }));

 passport.use('local.signin', new LocalStrategy({
     usernameField: 'email',
     passwordField: 'password',
     passReqToCallback: true
 }, function (req, email, password, done) {
     req.checkBody('email', 'Invalid email').notEmpty().isEmail();
     req.checkBody('password', 'Invalid password').notEmpty();
     var errors = req.validationErrors();
     if(errors){
         var messages = [];
         errors.forEach(function (error) {
             messages.push(error.msg);
         });

         return done(null, false, req.flash('error', messages));
     }

     User.findOne({'email':email}, function (err, user) {
         if(err){
             return done(user);
         }
         if(!user){
             return done(null, false, {message: 'User does not exist'});
         }
         if(!user.validatePassword(password)){
             return done(null, false, {message: 'Wrong Password'});
         }
         return done(null, user);
     });

 }));

passport.use('local.verifytoken', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, function (req, done) {
    req.checkBody(req.body.token, 'Invalid Token').isLength({min:5});
    req.checkBody(req.body.token, 'Token must be supplied').notEmpty();
    var errors = req.validationErrors();
    if(errors){
        var messages = [];
        errors.forEach(function (error) {
            messages.push(error.msg);
        });

        return done(null, false, req.flash('error', messages));
    }



}));