let express = require('express');
let router = express.Router();
let mailer = require("nodemailer");
let smtpTransport = require('nodemailer-smtp-transport');
let Imap = require('imap');
let inspect = require('util').inspect;
let simpleParser = require("mailparser").simpleParser;
let async = require('async');
let composer = require('mailcomposer');
let Mail = require('../models/mail');
let path = require('path');
const fs = require('fs');
let multer = require('multer');
let www = require('../bin/www');

let storage = multer.memoryStorage();
let upload = multer({
	dest: './uploads/',
	limits: {
		fileSize: 10240000
	},
	storage: storage
}).single('attachment');

router.get('/', function (req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');
	return res.render('mail/sendmail', { user: req.user, layout: 'mail_layout' });
});

//--------------- View Mailboxes -------------------//
router.get('/sent', function (req, res, next) {
	if (!req.isAuthenticated()) {
		return res.redirect('/');
	}
	let query = Mail.find({ mailbox: "Sent" });
	query.exec(function (err, docs) {
		if (err) console.log(err);
		res.render('mail/mailbox', { messages: docs, mailbox: 'sent', layout: 'mail_layout' });
	});
});

router.get('/inbox', function (req, res, next) {
	if (!req.isAuthenticated()) {
		return res.redirect('/');
	}
	let query = Mail.find({ mailbox: "Inbox" });
	query.exec(function (err, docs) {
		if (err) console.log(err);
		res.render('mail/mailbox', { messages: docs, mailbox: 'inbox', layout: 'mail_layout' });
	});
});

router.get('/drafts', function (req, res, next) {
	if (!req.isAuthenticated()) {
		return res.redirect('/');
	}
	let query = Mail.find({ mailbox: "Drafts" });
	query.exec(function (err, docs) {
		if (err) console.log(err);
		res.render('mail/drafts', { messages: docs, mailbox: 'drafts', layout: 'mail_layout' });
	});
});

router.get('/trash', function (req, res, next) {
	if (!req.isAuthenticated()) {
		return res.redirect('/');
	}

	let query = Mail.find({ mailbox: "Trash" });
	query.exec(function (err, docs) {
		if (err) console.log(err);
		res.render('mail/trash', { messages: docs, mailbox: 'trash', layout: 'mail_layout' });
	});
});
//--------------------------------------------------//


//--------------- Refresh Tasks -------------------//
router.get('/refresh/sent', function (req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');
	refresh('Sent', req.user, res);
});

router.get('/refresh/inbox', function (req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');
	refresh('Inbox', req.user, res);
});

router.get('/refresh/trash', function (req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');
	refresh('Trash', req.user, res);
});

router.get('/refresh/drafts', function (req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');
	refresh('Drafts', req.user, res);
});
//---------------------------------------------------------//


//----------------- Get One Mail Item ---------------------//
router.get('/reply/:id', function (req, res, next) {
	if (!req.isAuthenticated()) {
		return res.redirect('/');
	}
	Mail.findById(req.params.id, function (err, mail) {
		if (err) throw err;
		// getAttachments(mail, req.user);
		res.render('mail/reply', { user: req.user, messages: mail, layout: 'mail_layout' });
	});
});

router.get('/:id', function (req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');

	Mail.findById(req.params.id, function (err, mail) {
		if (err) throw err;
		// getAttachments(mail, req.user);
		res.render('mail/email', { user: req.user, message: mail, layout: 'mail_layout' });
	});
});

router.get('/trash/:id', function (req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');

	Mail.findById(req.params.id, function (err, mail) {
		if (err) throw err;
		// getAttachments(mail, req.user);
		res.render('mail/trash_item', { user: req.user, messages: mail, layout: 'mail_layout' });
	});
});

router.get('/edit/:id', function (req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');

	Mail.findById(req.params.id, function (err, mail) {
		if (err) throw err;
		// getAttachments(mail, req.user);
		res.render('mail/edit_draft', { user: req.user, messages: mail, layout: 'mail_layout' });
	});
});

router.get('/drafts/:id', function (req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');

	Mail.findById(req.params.id, function (err, mail) {
		if (err) throw err;
		// getAttachments(mail, req.user);
		res.render('mail/edit_draft', { user: req.user, messages: mail, layout: 'mail_layout' });
	});
});

router.get('/mail-body/:id', function (req, res, next) {
	Mail.findById(req.params.id, function (err, mail) {
		getMailBody(mail, req);
	});
});
//------------------------------------------------------------//

//----------------- Get Mail Body Function ------------------//
function getMailBody(mail, req) {
	let imap = new Imap({
		user: req.user.email,
		password: getLong(req.user.long_text),
		host: 'mail.kornet-test.com',
		port: 993,
		tls: true
	});
	let text = 'empty';
	imap.once('ready', function () {
		imap.openBox(mail.mailbox, false, function (err, box) {
			if (err) throw err;
			imap.seq.search([['FROM', mail.from.text], ['TO', mail.to.text], ['SUBJECT', mail.subject]], (err, uids) => {
				if (err) throw err;
				let fetch = imap.seq.fetch(uids, { bodies: '' });
				fetch.on('message', function (msg, seqno) {
					msg.on('body', function (stream, info) {
						simpleParser(stream, function (err, body) {
							if (err) throw err;
							text = body.html != false ? body.html : body.text;
							www.io.emit('imap_end_message', { text: text });

							console.log(mail.attachments.length);
							if (mail.attachments.length > 0) {
								let att = mail.attachments[0];
								fs.mkdir('./uploads/' + mail.messageId, (err) => {
									if (err) console.log(err);
									fs.writeFile('./uploads/' + mail.messageId + "/" + att.filename, att.content, (err) => {
										if (err) console.log(err);
										console.log('It\'s saved!');
										// attachments.push({link:'./uploads/' + mail.messageId + "/" + att.filename, name: att.filename});

										// console.log("......");
										// www.io.emit('imap_end_attachment', { content: attachments[0] });
										imap.end();
									});
								});
							}
						});
					});
				});
			});
		});
	});
	imap.once('error', function (err) {
		console.log(err);
        return text;
	});
	imap.once('end', (err) => {
		
	});
	imap.connect();
}
//------------------------------------------------------------//

//----------------- Get Attachments Function ------------------//

//------------------------------------------------------------//

//----------------- Refresh Function -------------------------//
function refresh(mailbox_name, user, res) {
	let imap = new Imap({
		user: user.email,
		password: getLong(user.long_text),
		host: 'mail.kornet-test.com',
		port: 993,
		tls: true
	});

	imap.once('ready', function () {
		imap.openBox(mailbox_name, true, (function (err, box) {
			if (err) throw err;
			if (box.messages.total == 0)
				res.redirect('/mail/' + mailbox_name);
			else {
				let fetch = imap.seq.fetch('1:' + box.messages.total, { bodies: ['HEADER'], struct: true });
				fetch.on('message', function (msg, seqno) {
					msg.on('body', function (stream, info) {
						simpleParser(stream, function (err, mail) {
							if (err) throw err;
							if (mail.messageId != undefined) {
								let saved_mail = new Mail({
									user: user.username,
									headers: mail.headers,
									cc: mail.cc,
									mailbox: mailbox_name,
									messageId: mail.messageId,
									from: mail.from,
									to: mail.to,
									subject: mail.subject,
									date: mail.date
								});

								Mail.findOne({ messageId: saved_mail.messageId }, function (err, doc) {
									if (err) console.log(err);
									if (doc == null || doc == undefined) {
										saved_mail.save(function (err, document) {
											if (err) throw err;
											console.log('Mail Cached: ' + document.messageId);
										});
									}
								});
							}
						});
					});
				});
				fetch.once('error', function (err) {
					console.log(err);
				});
				fetch.once('end', function (err) {
					imap.end();
					setTimeout((function () {
						res.redirect('/mail/' + mailbox_name);
					}), 3000);
				});
			}
		}));
	});
	imap.connect();
	setTimeout((function () { imap.end(); }), 10000);
}
//----------------------------------------------------//

//--------------- Post (Send Mail) -------------------//
router.post('/send/:id', upload, function (req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');

	let subject = req.body.subject;
	let recipient = req.body.recipient;
	let content = req.body.content;
	let sender = req.body.sender;
	let cc = req.body.cc;
	let bcc = req.body.bcc;
	let file = req.file;

	let smtpConfig = {
		host: 'mail.kornet-test.com',
		port: 587,
		secure: false,
		logger: true,
		auth: {
			user: req.user.email,
			pass: getLong(req.user.long_text)
		}
	};
	let sendmailer = mailer.createTransport(smtpTransport(smtpConfig));

	//check if this mail is a reply
	let reply = req.params.id == 0 ? '' : req.params.id;

	console.log(file);
	let mailOptions = {
		from: sender,
		sender: sender,
		to: recipient,
		html: content,
		text: content,
		cc: cc,
		bcc: bcc,
		inReplyTo: reply,
		subject: subject,
		attachments: [{ filename: file.originalname, content: file.buffer, contentType: file.mimetype, encoding: file.encoding }],
		date: new Date(Date.now())
	};

	let mail = composer(mailOptions);

	sendmailer.sendMail(mailOptions, function (err, res) {
		if (err) console.log(err);
		else console.log("Message sent: " + res.messageId);

		mail.build(function (err, message) {
			let imap = new Imap({
				user: req.user.email,
				password: getLong(req.user.long_text),
				host: 'mail.kornet-test.com',
				port: 993,
				tls: true,
				debug: console.log
			});

			imap.once('ready', function () {
				imap.openBox('Sent', false, function (err, box) {
					if (err) console.log(err);
					imap.append(message, { mailbox: 'Sent', flags: ['Seen'], date: new Date(Date.now()) }, function (err) {
						if (err) throw err;
						console.log('Saved in Mailbox (Sent)');
						imap.end();
					});
				});
			});
			imap.connect();
		});
	});
	res.redirect('/mail');
});
//---------------------------------------------------------//

//-------------------- Post (Save Draft) ------------------//
router.post('/save/:id', upload, function (req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');

	let subject = req.body.subject;
	let recipient = req.body.recipient;
	let content = req.body.content;
	let sender = req.body.sender;
	let cc = req.body.cc;
	let bcc = req.body.bcc;
	let file = req.file;

	let smtpConfig = {
		host: 'mail.kornet-test.com',
		port: 587,
		secure: false,
		logger: true,
		auth: {
			user: req.user.email,
			pass: getLong(req.user.long_text)
		}
	};

	//check if this mail is a reply
	let reply = req.params.id == 0 ? "" : req.params.id;
	console.log(file);
	let mailOptions = {
		from: sender,
		sender: sender,
		to: recipient,
		html: content,
		text: content,
		cc: cc,
		bcc: bcc,
		inReplyTo: reply,
		subject: subject,
		attachments: [{ filename: file.originalname, content: file.buffer, contentType: file.mimetype, encoding: file.encoding }],
		date: new Date(Date.now())
	};

	let mail = composer(mailOptions);
	mail.build(function (err, message) {

		let imap = new Imap({
			user: req.user.email,
			password: getLong(req.user.long_text),
			host: 'mail.kornet-test.com',
			port: 993,
			tls: true,
			debug: console.log
		});

		imap.once('ready', function () {
			imap.openBox('Drafts', false, function (err, box) {
				if (err) console.log(err);

				imap.append(message, { mailbox: 'Drafts', date: new Date(Date.now()) }, function (err) {
					if (err) console.log(err);
					console.log('Saved in Drafts');
					imap.end();
				});
			});
		});
		imap.once('error', function (err) {
			console.log(err);
		});
		imap.once('end', function () {
			console.log('Connection ended');
		});
		imap.connect();
	});
	res.redirect('/mail');
});
//------------------------------------------------//

function getLong(encrypted) {
	let Crypto = require('crypto-js');
	let decrypted = Crypto.AES.decrypt(encrypted, "$2a$05$d92IUG5ZHIpU0f8fvQitvOut05tuZdD4rDp5RF8BC/7zdFvUqBk52");
	return decrypted.toString(Crypto.enc.Utf8);
}

module.exports = router;