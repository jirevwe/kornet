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
var path = require('path');
const fs = require('fs');
var multer = require('multer');
var multerS3 = require('multer-s3')
var aws = require('aws-sdk');
aws.config.loadFromPath('./config.json');
var s3 = new aws.S3({});

var storage = multer.memoryStorage();
var upload = multer({
	dest: './uploads/',
	limits: {
		fileSize: 10240000 //10mb
	},
	storage: storage
}).single('attachment');

router.get('/', function(req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');

	return res.render('sendmail', { user: req.user });
});

//--------------- View Mailboxes -------------------//
router.get('/sent', function(req, res, next) {
	if (!req.isAuthenticated()) {
		return res.redirect('/');
	}
	var query = Mail.find({ mailbox: "Sent" });
	query.exec(function(err, docs) {
		res.render('mailbox', { messages: docs, mailbox: 'sent' });
	});
});

router.get('/inbox', function(req, res, next) {
	if (!req.isAuthenticated()) {
		return res.redirect('/');
	}
	var query = Mail.find({ mailbox: "Inbox" });
	query.exec(function(err, docs) {
		res.render('mailbox', { messages: docs, mailbox: 'inbox' });
	});
});

router.get('/drafts', function(req, res, next) {
	if (!req.isAuthenticated()) {
		return res.redirect('/');
	}

	var query = Mail.find({ mailbox: "Drafts" });
	query.exec(function(err, docs) {
		res.render('drafts', { messages: docs, mailbox: 'drafts' });
	});
});

router.get('/trash', function(req, res, next) {
	if (!req.isAuthenticated()) {
		return res.redirect('/');
	}

	var query = Mail.find({ mailbox: "Trash" });
	query.exec(function(err, docs) {
		res.render('trash', { messages: docs, mailbox: 'trash' });
	});
});
//--------------------------------------------------//


//--------------- Refresh Tasks -------------------//
router.get('/refresh/sent', function(req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');
	refresh('Sent', req.user, res);
});

router.get('/refresh/inbox', function(req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');
	refresh('Inbox', req.user, res);
});

router.get('/refresh/trash', function(req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');
	refresh('Trash', req.user, res);
});

router.get('/refresh/drafts', function(req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');
	refresh('Drafts', req.user, res);
});
//---------------------------------------------------------//


//----------------- Get One Mail Item ---------------------//
router.get('/reply/:id', function(req, res, next) {
	if (!req.isAuthenticated()) {
		return res.redirect('/');
	}
	Mail.findById(req.params.id, function(err, doc) {
		if (err) throw err;
		getAttachments(doc);
		res.render('reply', { user: req.user, messages: doc });
	});
});

router.get('/:id', function(req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');

	Mail.findById(req.params.id, function(err, mail) {
		if (err) throw err;
		getAttachments(mail);
		res.render('email', { message: mail });
	});
});

router.get('/trash/:id', function(req, res, next) {
	if (!req.isAuthenticated()) 
		return res.redirect('/');
	
	Mail.findById(req.params.id, function(err, doc) {
		if (err) throw err;
		getAttachments(doc);
		res.render('trash_item', { user: req.user, messages: doc });
	});
});

router.get('/edit/:id', function(req, res, next) {
	if (!req.isAuthenticated()) 
		return res.redirect('/');
	
	Mail.findById(req.params.id, function(err, doc) {
		if (err) throw err;
		getAttachments(doc);
		res.render('edit_draft', { user: req.user, messages: doc });
	});
});

router.get('/drafts/:id', function(req, res, next) {
	if (!req.isAuthenticated()) 
		return res.redirect('/');
	
	Mail.findById(req.params.id, function(err, doc) {
		if (err) throw err;
		getAttachments(doc);
		res.render('edit_draft', { user: req.user, messages: doc });
	});
});
//------------------------------------------------------------//

//----------------- Get Attachments Function ------------------//
function getAttachments(mail){
	var attachments = [];
	var imap = new Imap({
		user: 'ray@demo.kornet-test.com',
		password: 'raymond1',
		host: 'mail.kornet-test.com',
		port: 993,
		tls: true
	});

	imap.once('ready', function() {
		imap.openBox(mail.mailbox, false, function(err, box) {
			if (err) throw err;

			imap.seq.search([['FROM', mail.from.text], ['TO', mail.to.text], ['SUBJECT', mail.subject]], (err, uids) =>{
				if (err) throw err;

				var fetch = imap.seq.fetch(uids, { bodies: [''] });
				fetch.on('message', function(msg, seqno) {
					msg.on('body', function(stream, info) {
						simpleParser(stream, function(err, mail) {
							if (err) throw err;

							if (mail.messageId != undefined) {
								if(mail.attachments.length > 0){
									var att = mail.attachments[0];
									fs.mkdir('./uploads/' + mail.messageId, (err) => {
										fs.writeFile('./uploads/' + mail.messageId + "/" + att.filename, att.content, (err) => {
											if (err) throw err;
											console.log('It\'s saved!');
											attachments.push('./uploads/' + mail.messageId + "/" + att.filename);
											imap.end();
										});
									});
								}
							}
						});
					});
				});
			})
		});
	});
	imap.connect();
}
//------------------------------------------------------------//

//----------------- Refresh Function -------------------------//
function refresh(mailbox_name, user, res) {
	var messages = [];

	Mail.remove({ mailbox: mailbox_name }, function(err) {
		console.log('All ' + mailbox_name + ' Records Removed');
	});

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
			console.log(box.messages.total);
			if (box.messages.total == 0)
				res.redirect('/users/' + mailbox_name);
			else {
				var fetch = imap.seq.fetch('1:' + box.messages.total, { bodies: [''] });
				fetch.on('message', function(msg, seqno) {
					msg.on('body', function(stream, info) {
						
						simpleParser(stream, function(err, mail) {
							if (err) throw err;
							if (mail.messageId != undefined) {

								var saved_mail = new Mail({
									user: user.username,
									attachments: './uploads/' + mail.messageId,
									headers: mail.headers,
									html: mail.html,
									text: mail.text,
									textAsHtml: mail.textAsHtml,
									cc: mail.cc,
									bcc: mail.bcc,
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

								if(mail.attachments.length > 0){
									var att = mail.attachments[0];
									fs.mkdir('./uploads/' + mail.messageId, (err) => {
										fs.writeFile('./uploads/' + mail.messageId + "/" + att.filename, att.content, (err) => {
											if (err) throw err;
											console.log('It\'s saved!');
										});
									});
								}

								Mail.findOne({ messageId: saved_mail.messageId }, function(err, doc) {
									if (err) throw err;
									if (doc == null || doc == undefined) {
										saved_mail.save(function(err, number) {
											if (err) throw err;
											console.log('Mail Cached: ' + number.messageId);
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
					setTimeout((function() {
						res.redirect('/users/' + mailbox_name);
					}), 3000);
				});
			}
		}));
	});
	imap.connect();
	setTimeout((function() { imap.end(); }), 10000);
}
//----------------------------------------------------//

//--------------- Post (Send Mail) -------------------//
router.post('/send/:id', upload, function(req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');

	var subject = req.body.subject;
	var recipient = req.body.recipient;
	var content = req.body.content;
	var sender = req.body.sender;
	var cc = req.body.cc;
	var bcc = req.body.bcc;
	var file = req.file;

	var smtpConfig = {
		host: 'mail.kornet-test.com',
		port: 587,
		secure: false,
		logger: true,
		auth: {
			user: "ray@demo.kornet-test.com",
			pass: "raymond1"
		}
	};
	var sendmailer = mailer.createTransport(smtpTransport(smtpConfig));

	//check if this mail is a reply
	var reply = req.params.id == 0 ? '' : req.params.id;
	
	console.log(file);
	var mailOptions = {
		from: sender,
		sender: sender,
		to: recipient,
		html: content,
		text: content,
		cc: cc,
		bcc: bcc,
		inReplyTo: reply,
		subject: subject,
		attachments: [{ filename: file.originalname, content:file.buffer, contentType: file.mimetype, encoding: file.encoding }],
		date: new Date(Date.now())
	};

	var mail = composer(mailOptions);

	sendmailer.sendMail(mailOptions, function(err, res) {
		if (err) throw err;
		else console.log("Message sent: " + res.messageId);

		mail.build(function(err, message) {
			var imap = new Imap({
				user: 'ray@demo.kornet-test.com',
				password: 'raymond1',
				host: 'mail.kornet-test.com',
				port: 993,
				tls: true,
				debug: console.log
			});

			imap.once('ready', function() {
				imap.openBox('Sent', false, function(err, box) {
					if (err) throw err;
					imap.append(message, { mailbox: 'Sent', flags: ['Seen'], date: new Date(Date.now()) }, function(err) {
						if (err) throw err;
						console.log('Saved in Mailbox (Sent)');
						imap.end();
					});
				});
			});
			imap.connect();
		});
	});
	res.redirect('/');
});
//---------------------------------------------------------//

//-------------------- Post (Save Draft) ------------------//
router.post('/save/:id', upload, function(req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');

	var subject = req.body.subject;
	var recipient = req.body.recipient;
	var content = req.body.content;
	var sender = req.body.sender;
	var cc = req.body.cc;
	var bcc = req.body.bcc;
	var file = req.file;

	var smtpConfig = {
		host: 'mail.kornet-test.com',
		port: 587,
		secure: false,
		logger: true,
		auth: {
			user: "ray@demo.kornet-test.com",
			pass: "raymond1"
		}
	};

	//check if this mail is a reply
	var reply = req.params.id == 0 ? "" : req.params.id;
	console.log(file);
	var mailOptions = {
		from: sender,
		sender: sender,
		to: recipient,
		html: content,
		text: content,
		cc: cc,
		bcc: bcc,
		inReplyTo: reply,
		subject: subject,
		attachments: [{ filename: file.originalname, content:file.buffer, contentType: file.mimetype, encoding: file.encoding }],
		date: new Date(Date.now())
	};
	
	var mail = composer(mailOptions);
	mail.build(function(err, message) {
	
		var imap = new Imap({
			user: 'ray@demo.kornet-test.com',
			password: 'raymond1',
			host: 'mail.kornet-test.com',
			port: 993,
			tls: true,
			debug: console.log
		});
		
		imap.once('ready', function() {
			imap.openBox('Drafts', false, function(err, box) {
				if (err) throw(err);
				
				imap.append(message, { mailbox: 'Drafts', date: new Date(Date.now()) }, function(err) {
					if (err) throw(err);
					console.log('Saved in Drafts');
					imap.end();
				});
			});
		});
		imap.once('error', function(err) {
			console.log(err);
		});
		imap.once('end', function() {
			console.log('Connection ended');
		});
		imap.connect();
	});
	res.redirect('/users');
});
//------------------------------------------------//

module.exports = router;