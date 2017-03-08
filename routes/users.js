var express = require('express');
var router = express.Router();
var mailer = require("nodemailer");

/* GET users listing. */
router.get('/', function(req, res, next) {
  if(!req.isAuthenticated()) res.redirect('/');
  res.render('sendmail', {user: req.user});
});

router.post('/send', function(req, res, next) {
  var subject = req.body.subject;
  var recipient = req.body.recipient;
  var content = req.body.content;

  var mailOptions = {
    from: req.user.email, // sender address
    to: "raymond@test.com", // list of receivers
    subject: subject, // Subject line
    text: content, // plaintext body
    html: "<p>" + content + "</p> " // html body
  }

let smtpConfig = {
    host: 'localhost',
    port: 2525,
    secure: false, // upgrade later with STARTTLS
    logger: true
};

var sender = mailer.createTransport(smtpConfig);

sender.sendMail(mailOptions,  function(err, res){
  if(err) throw  err;
  else console.log("Message sent: " + response.message);
});

  res.redirect('/');
});

module.exports = router;
