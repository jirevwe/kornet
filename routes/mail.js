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
let mkdirp = require('mkdirp');

let imap = undefined;

let storage = multer.diskStorage({
	destination: './public/uploads/mail',
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

router.get('/', function (req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');
	imap = new Imap({
		user: req.user.email,
		password: getLong(req.user.long_text),
		host: 'mail.kornet-test.com',
		port: 993,
		tls: true
	});
	setTimeout(() => { www.io.emit('hidden_mail_attr', {content: Date.now().toString()}); }, 1000);
	res.render('mail/sendmail', { user: req.user, layout: 'mail_layout' });
});

router.post('/upload', upload.single('attachment'), function(req, res, next){
	return res.status(200).send(req.file);
});

router.post('/uploads/delete', function(req, res, next){
	let file = req.body.file;
	fs.exists('./'+file.path, (exists) => {
		if(exists){
			fs.unlink('./'+file.path, (err) => {
				if (err) {
					console.log(err);
					return res.status(200);
				}
				console.log('successfully deleted');
			});
		}
	})
	return res.status(200);
});

//--------------- View Mailboxes -------------------//
router.get('/sent', function (req, res, next) {
	if (!req.isAuthenticated()) {
		return res.redirect('/');
	}
	let query = Mail.find({ mailbox: "Sent", user: req.user.email });
	query.exec(function (err, docs) {
		if (err) console.log(err);
		res.render('mail/mailbox', { messages: docs, mailbox: 'sent', layout: 'mail_layout' });
	});
});

router.get('/inbox', function (req, res, next) {
	if (!req.isAuthenticated()) {
		return res.redirect('/');
	}
	let query = Mail.find({ mailbox: "Inbox", user: req.user.email });
	query.exec(function (err, docs) {
		if (err) console.log(err);
		res.render('mail/mailbox', { messages: docs, mailbox: 'inbox', layout: 'mail_layout' });
	});
});

router.get('/drafts', function (req, res, next) {
	if (!req.isAuthenticated()) {
		return res.redirect('/');
	}
	let query = Mail.find({ mailbox: "Drafts", user: req.user.email });
	query.exec(function (err, docs) {
		if (err) console.log(err);
		res.render('mail/drafts', { messages: docs, mailbox: 'drafts', layout: 'mail_layout' });
	});
});

router.get('/trash', function (req, res, next) {
	if (!req.isAuthenticated()) {
		return res.redirect('/');
	}

	let query = Mail.find({ mailbox: "Trash", user: req.user.email });
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
	refresh("Sent", req, res);
});

router.get('/refresh/inbox', function (req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');
	refresh("Inbox", req, res);
});

router.get('/refresh/trash', function (req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');
	let mailbox_name = "Trash";
	refresh("Trash", req, res);
});

router.get('/refresh/drafts', function (req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');
	refresh("Drafts", req, res);
});
//---------------------------------------------------------//


//----------------- Get One Mail Item ---------------------//
router.get('/reply/:id', function (req, res, next) {
	if (!req.isAuthenticated()) {
		return res.redirect('/');
	}
	Mail.findById(req.params.id, function (err, mail) {
		if (err) throw err;
		res.render('mail/reply', { user: req.user, messages: mail, layout: 'mail_layout' });
	});
});

router.get('/:id', function (req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');

	Mail.findById(req.params.id, function (err, mail) {
		if (err) throw err;
		res.render('mail/email', { user: req.user, message: mail, layout: 'mail_layout' });
	});
});

router.get('/trash/:id', function (req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');

	Mail.findById(req.params.id, function (err, mail) {
		if (err) throw err;
		res.render('mail/trash_item', { user: req.user, messages: mail, layout: 'mail_layout' });
	});
});

router.get('/edit/:id', function (req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');

	Mail.findById(req.params.id, function (err, mail) {
		if (err) throw err;
		res.render('mail/edit_draft', { user: req.user, messages: mail, layout: 'mail_layout' });
	});
});

router.get('/drafts/:id', function (req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');

	Mail.findById(req.params.id, function (err, mail) {
		if (err) throw err;
		res.render('mail/edit_draft', { user: req.user, messages: mail, layout: 'mail_layout' });
	});
});

router.get('/mail-body/:id', function (req, res, next) {
	Mail.findById(req.params.id, function (err, mail) {
		getMailBody(mail, req);
	});
	return res.status(200);
});
//------------------------------------------------------------//

//----------------- Get Mail Body Function ------------------//
function getMailBody(mail, req) {
	let attachments = [];

	if (imap == undefined)
	{
		imap = new Imap({
			user: req.user.email,
			password: getLong(req.user.long_text),
			host: 'mail.kornet-test.com',
			port: 993,
			tls: true
		});
	}

	let text = 'empty';
	imap.once('ready', function () {
		imap.openBox(mail.mailbox, false, function (err, box) {
			if (err) console.log(err);
			imap.seq.search([['FROM', mail.from.text], ['TO', mail.to.text], ['SUBJECT', mail.subject]], (err, uids) => {
				if (err) console.log(err);
				let fetch = imap.seq.fetch(uids, { bodies: [''] });
				fetch.on('message', function (msg, seqno) {
					msg.on('body', function (stream, info) {
						simpleParser(stream, function (err, body) {
							if (err) console.log(err);
							if (body.attachments.length > 0) {
								let files = body.attachments;
								for(att in files){
									if (err) console.error(err);
									let ex = fs.existsSync('./tmp/' + files[att].filename);
									if(ex){
										console.log(files[att].filename + ' exists!');
										attachments.push({link:'/download/' + files[att].filename, name: files[att].filename});
									}else{
										fs.writeFileSync('./tmp/' + files[att].filename, files[att].content);
										if (err) console.log(err);
										console.log(files[att].filename + ' saved!');
										attachments.push({link:'/download/' + files[att].filename, name: files[att].filename});
									}
								}
								www.io.emit('imap_end_attachment', { content: attachments });
								imap.end();
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
		if (err) console.log(err);
	});
	imap.connect();
}
//------------------------------------------------------------//

//----------------- Refresh Function -------------------------//
function refresh(mailbox_name, req, res) {
	if (imap == undefined)
	{
		imap = new Imap({
			user: req.user.email,
			password: getLong(req.user.long_text),
			host: 'mail.kornet-test.com',
			port: 993,
			tls: true
		});
	}

	imap.once('ready', function () {
		imap.openBox(mailbox_name, true, (function (err, box) {
			if (err) console.log(err);
			if (box.messages.total == 0)
				res.redirect('/mail/' + mailbox_name);
			else {
				let fetch = imap.seq.fetch('1:' + box.messages.total, { bodies: [''], struct: true});
				fetch.on('message', function (msg, seqno) {
					msg.on('body', function (stream, info) {
						simpleParser(stream, function (err, mail) {
							if (err) console.log(err);
							if (mail.messageId != undefined) {

								let saved_mail = new Mail({
									user: req.user.email,
									headers: mail.headers,
									cc: mail.cc,
									text: mail.text,
									html: mail.html,
									textAsHtml: mail.textAsHtml,
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
											if (err) console.log(err);
											console.log('Mail Cached: ' + document.messageId);
										});
									}
									else{
										doc.remove(() => {
											saved_mail.save(function (err, document) {
												if (err) console.log(err);
												console.log('Mail Cached: ' + document.messageId);
											});
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
router.post('/send/:id', function (req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');

	let subject = req.body.subject;
	let recipient = req.body.recipient;
	let content = req.body.content;
	let sender = req.body.sender;
	let cc = req.body.cc;
	let bcc = req.body.bcc;
	let file_prefix = req.body.attr;
	let files = [];
	
	let _files = fs.readdirSync('./public/uploads/mail');
	if(_files != undefined && _files.length > 0){
		for (a_file in _files){
			if(_files[a_file] != '.DS_Store' && _files[a_file].includes(file_prefix)){
				files.push({ filename: _files[a_file], content: fs.createReadStream('./public/uploads/mail/' + _files[a_file]) });
			}
		}
	}

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

	// console.log(file);
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
		attachments: files,
		date: new Date(Date.now())
	};

	let mail = composer(mailOptions);

	sendmailer.sendMail(mailOptions, function (err, res) {
		if (err) console.log(err);
		else console.log("Message sent: " + res.messageId);

		mail.build(function (err, message) {
			if (imap == undefined)
			{
				imap = new Imap({
					user: req.user.email,
					password: getLong(req.user.long_text),
					host: 'mail.kornet-test.com',
					port: 993,
					tls: true
				});
			}

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
router.post('/save/:id', function (req, res, next) {
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
	// console.log(file);
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