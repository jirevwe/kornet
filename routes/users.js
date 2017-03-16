var express = require('express');
var router = express.Router();
var mailer = require("nodemailer");
var smtpTransport = require('nodemailer-smtp-transport');
var Imap = require('imap');
var inspect = require('util').inspect;
var simpleParser = require("mailparser").simpleParser;
var async = require('async');
var composer = require('mailcomposer');

router.get('/', function(req, res, next) {
	if(!req.isAuthenticated())
		return res.redirect('/');

	return res.render('sendmail', {user: req.user});
});

router.get('/sent', function(req, res, next){

	var mails = [];
	var messages = [];
	
	var imap = new Imap({
		user: 'ray@demo.kornet-test.com',
		password: 'raymond1',
		host: 'mail.kornet-test.com',
		port: 993,
		tls: true
	});

	imap.once('ready', function() {
		imap.openBox('Sent', true, (function(err, box) {
			if (err) throw err;
			var fetch = imap.seq.fetch('1:' + box.messages.total, { bodies: ['HEADER.FIELDS (FROM SUBJECT TO)','TEXT'] });
			fetch.on('message', function(msg, seqno) {
				msg.on('body', function(stream, info) {
					mails.push(stream);
					simpleParser(stream, function(err, mail){
						if (err) throw err;
						if(mail.subject != undefined){
							// console.log("Subject: " + mail.subject + " from: " + mail.to.text);
							messages.push({ subject: mail.subject, from: mail.from.text });
						}
					});
				});
			});
			fetch.once('error', function(err) {
				throw err;
			});
			fetch.once('end', function(err) {
				// console.log('-----------Done fetching all messages!');
				// console.log('-----------Number of mails in inbox ' + mails.length);
				imap.end();
				res.render('mailbox', { messages: messages });
			});
		}));
	});
	imap.connect();
});

router.get('/inbox', function(req, res, next){

	var mails = [];
	var messages = [];
	
	var imap = new Imap({
		user: 'ray@demo.kornet-test.com',
		password: 'raymond1',
		host: 'mail.kornet-test.com',
		port: 993,
		tls: true
	});

	imap.once('ready', function() {
		imap.openBox('Inbox', true, (function(err, box) {
			if (err) throw err;
			var fetch = imap.seq.fetch('1:' + box.messages.total, { bodies: ['HEADER.FIELDS (FROM SUBJECT TO)','TEXT'] });
			fetch.on('message', function(msg, seqno) {
				msg.on('body', function(stream, info) {
					mails.push(stream);
					simpleParser(stream, function(err, mail){
						if (err) throw err;
						if(mail.subject != undefined){
							// console.log("Subject: " + mail.subject + " from: " + mail.to.text);
							messages.push({ subject: mail.subject, from: mail.from.text });
						}
					});
				});
			});
			fetch.once('error', function(err) {
				throw err;
			});
			fetch.once('end', function(err) {
				// console.log('-----------Done fetching all messages!');
				// console.log('-----------Number of mails in inbox ' + mails.length);
				imap.end();
				res.render('mailbox', { messages: messages });
			});
		}));
	});
	imap.connect();
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
		
		var mail = composer({
			from: '"Raymond Tukpe" <ray@demo.kornet-test.com>',
			sender: sender,
			to: recipient,
			body: content,
			html:  "<p>" + content + "</p> ",
			subject: subject,
			date: new Date(Date.now())
		});

		mail.build(function(err, message){
			var imap = new Imap({
			user: 'ray@demo.kornet-test.com',
				password: 'raymond1',
				host: 'mail.kornet-test.com',
				port: 993,
				tls: true
			});

			imap.once('ready', function() {
				imap.openBox('Sent', false, function(err, box) {
					if (err) throw err;
					imap.append(message, {mailbox: 'Sent', flags: ['Seen'], date: new Date(Date.now())}, function(err) {
						if (err) throw err;
						console.log('Saved in Mailbox');
						imap.end();
					});
				});
			});
		imap.connect();
		});
	});

	res.redirect('/');
});

module.exports = router;
