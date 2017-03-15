var express = require('express');
var router = express.Router();
var mailer = require("nodemailer");
var smtpTransport = require('nodemailer-smtp-transport');

/* GET users listing. */
router.get('/', function(req, res, next) {
  if(!req.isAuthenticated()) res.redirect('/');
  res.render('sendmail', {user: req.user});
});

router.post('/send', function(req, res, next) {
  var subject = req.body.subject;
  var recipient = req.body.recipient;
  var content = req.body.content;
  var sender = req.body.sender;

  var mailOptions = {
    from: sender, // sender address
    to: recipient, // list of receivers
    subject: subject, // Subject line
    text: content, // plaintext body
    html: "<p>" + content + "</p> " // html body
  }

var smtpConfig = {
    host: 'mail.kornet-test.com',
    port: 587,
    secure:false,
    logger: true,
    auth: {
        user: "ray@demo.kornet-test.com",
        pass: "raymond1"
    }
};

var sendmailer = mailer.createTransport(smtpTransport(smtpConfig));

sendmailer.sendMail(mailOptions,  function(err, res){
  if(err) throw  err;
  else console.log("Message sent: \n" + res);
});

  res.redirect('/');
});

module.exports = router;
