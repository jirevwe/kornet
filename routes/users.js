var express = require('express');
var router = express.Router();
var mailer = require("nodemailer");
var smtpTransport = require('nodemailer-smtp-transport');
var Imap = require('imap');
var inspect = require('util').inspect;
var simpleParser = require("mailparser").simpleParser;
var async = require('async');
var composer = require('mailcomposer');
var Mail = require('../models/mail');

router.get('/', function(req, res, next) {
	if(!req.isAuthenticated())
		return res.redirect('/');

	return res.render('sendmail', {user: req.user});
});

router.get('/sent', function(req, res, next){
	if(!req.isAuthenticated()){
		return res.redirect('/');
	}
	var query = Mail.find({mailbox: "Sent"});
	query.exec(function (err, docs) {
		res.render('mailbox', { messages: docs, mailbox: 'sent'  });
	});
});

router.get('/inbox', function(req, res, next){
	if(!req.isAuthenticated()){
		return res.redirect('/');
	}
	var query = Mail.find({mailbox: "Inbox"});
	query.exec(function (err, docs) {
		res.render('mailbox', { messages: docs, mailbox: 'inbox' });
	});
});

router.get('/refresh/sent', function(req, res, next){
	if(!req.isAuthenticated())
		return res.redirect('/');
	refresh('Sent', req.user, res);
});

router.get('/refresh/inbox', function(req, res, next){
	if(!req.isAuthenticated())
		return res.redirect('/');
	refresh('Inbox', req.user, res);
});

router.get('/reply/:id', function(req, res, next){
	if(!req.isAuthenticated()){
		return res.redirect('/');
	}
	Mail.findById(req.params.id, function(err, doc){
		if (err) throw err;
		res.render('reply', { user: req.user, messages: doc });
	});
});

router.get('/:id', function(req, res, next){
	if(!req.isAuthenticated())
		return res.redirect('/');
	Mail.findById(req.params.id, function(err, doc){
		if (err) throw err;
		res.render('email', { message: doc });
	});
});

router.get('/drafts', function(req, res, next){
	if(!req.isAuthenticated()){
		return res.redirect('/');
	}
	
	refresh('Drafts', req.user, res);
});

router.get('/trash', function(req, res, next){
	if(!req.isAuthenticated()){
		return res.redirect('/');
	}
	
	refresh('Trash', req.user, res);
});

router.get('/trash/:id', function(req, res, next){
	if(!req.isAuthenticated()){
		return res.redirect('/');
	}
	Mail.findById(req.params.id, function(err, doc){
		if (err) throw err;
		imap.once('ready', function() {
			imap.openBox(mailbox_name, true, (function(err, box) {
				if (err) throw err;

			}));
		});

		res.redirect('/');
	});
});

function refresh(mailbox_name, user, res){
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
		imap.openBox(mailbox_name, true, (function(err, box) {
			if (err) throw err;
			var fetch = imap.seq.fetch('1:' + box.messages.total, { bodies: [''] });
			fetch.on('message', function(msg, seqno) {
				msg.on('body', function(stream, info) {
					mails.push(stream);
					simpleParser(stream, function(err, mail){
						if (err) throw err;
						if(mail.subject != undefined){
							var saved_mail = new Mail({
								user: user.username,
								attachments: mail.attachments,
								headers: mail.headers,
								html: mail.html,
								text: mail.text,
								textAsHtml: mail.textAsHtml,
								cc: "",
								bcc: "",
								mailbox: mailbox_name,
								messageId: mail.messageId,
								from: mail.from,
								to: mail.to,
								subject: mail.subject,
								flags: { status: "" },
								references: "",
								date: mail.date
							});
							
							messages.push({ message_id: saved_mail._id, subject: mail.subject, from: mail.from.text, date: mail.date });
							
							Mail.findOne({ messageId: saved_mail.messageId }, function(err, doc){
								if (err) throw err;
								if(doc == null || doc == undefined){
									saved_mail.save(function(err, number){
										if(err) throw err;
										console.log('Mail Saved');
									});
								}
							});
						}
					});
				});
			});
			fetch.once('error', function(err) {
				throw err;
			});
			fetch.once('end', function(err) {
				imap.end();
				setTimeout((function()
				 {
					 res.redirect('/users/' + mailbox_name);
				}), 3000);
			});
		}));
	});
	imap.connect();
}

router.post('/send/:id', function(req, res, next) {
	var subject = req.body.subject;
	var recipient = req.body.recipient;
	var content = req.body.content;
	var sender = req.body.sender;
	var cc = req.body.cc;
	var bcc = req.body.bcc;

	var mailOptions = {
		from: sender, // sender address
		to: recipient, // list of receivers
		subject: subject, // Subject line
		text: content, // plaintext body
		cc: cc,
		bcc: bcc,
		html: "<p>" + content + "</p> " // html body
	};

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
			else console.log("Message sent: " + res.messageId);
			
			var mail = composer({
				from: '"Raymond Tukpe" <ray@demo.kornet-test.com>',
				sender: sender,
				to: recipient,
				body: content,
				cc: cc,
				bcc: bcc,
				inReplyTo: req.params.id,
				html:  "<div>" + content + "</div> ",
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
