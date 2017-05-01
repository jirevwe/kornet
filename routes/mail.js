let express = require('express');
let router = express.Router();
let mailer = require("nodemailer");
let smtpTransport = require('nodemailer-smtp-transport');
let Imap = require('imap');
let inspect = require('util').inspect;
let simpleParser = require("mailparser").simpleParser;
let async = require('async');
let MailComposer = require('nodemailer/lib/mail-composer');
let Mail = require('../models/mail');
let path = require('path');
let fs = require('fs');
let multer = require('multer');
let www = require('../bin/www');
let mkdirp = require('mkdirp');
let utils = require('../utils/api');
var csrf = require('csurf');

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

let csrfProtection = csrf();
router.use(csrfProtection);

router.get('/', function (req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');
	setTimeout(() => { www.io.emit('hidden_mail_attr', { content: Date.now().toString() }); }, 1000);
	res.render('mail/sendmail', {csrfToken: req.csrfToken(), user: req.user, layout: 'mail_layout' });
});

router.post('/upload', upload.single('attachment'), function(req, res, next){
	return res.status(200).send(req.file);
});

router.post('/uploads/delete', function(req, res, next){
	let file = req.body.file;
	if(file == undefined) return res.status(404).send('File Doesn\'t Exist');
	fs.exists('./'+file.path, (exists) => {
		if(exists){
			fs.unlink('./'+file.path, (err) => {
				if (err)  return res.status(404).send('Delete Failed');
				return res.status(200).send('Successfully Deleted');
			});
		}else return res.status(404).send('File Doesn\'t Exist');
	});
});

//------------------------ Sent ------------------------//
router.get('/q/sent', function (req, res, next) {
	let query = Mail.find({ mailbox: "Sent", user: req.user.email });
	query.exec(function (err, docs) {
		if (err) console.log(err);
		return res.send(docs);
	});
});

router.get('/sent', function (req, res, next) {
	if (!req.isAuthenticated()) return res.redirect('/');
	res.render('mail/mailbox', { csrfToken: req.csrfToken(), mailbox: 'sent', layout: 'mail_layout' });
});

//------------------------ Inbox -----------------------//
router.get('/q/inbox', function (req, res, next) {
	let query = Mail.find({ mailbox: "Inbox", user: req.user.email });
	query.exec(function (err, docs) {
		if (err) console.log(err);
		return res.send(docs);
	});
});

router.get('/inbox', function (req, res, next) {
	if (!req.isAuthenticated()) return res.redirect('/');
	res.render('mail/mailbox', {csrfToken: req.csrfToken(), mailbox: 'inbox', layout: 'mail_layout' });
});

//------------------------ Drafts -----------------------//

router.get('/q/drafts', function (req, res, next) {
	let query = Mail.find({ mailbox: "Drafts", user: req.user.email });
	query.exec(function (err, docs) {
		if (err) console.log(err);
		return res.send(docs);
	});
});

router.get('/drafts', function (req, res, next) {
	if (!req.isAuthenticated()) return res.redirect('/');
	res.render('mail/drafts', {csrfToken: req.csrfToken(), mailbox: 'drafts', layout: 'mail_layout' });
});
//--------------------------------------------------//

//------------------------ Trash -----------------------//
router.get('/q/trash', function (req, res, next) {
	let query = Mail.find({ mailbox: "Trash", user: req.user.email });
	query.exec(function (err, docs) {
		if (err) console.log(err);
		return res.send(docs);
	});
});

router.get('/trash', function (req, res, next) {
	if (!req.isAuthenticated()) return res.redirect('/');
	res.render('mail/trash', {csrfToken: req.csrfToken(), mailbox: 'trash', layout: 'mail_layout' });
});
//--------------------------------------------------//

//--------------- Refresh Tasks -------------------//
router.get('/r/sent', function (req, res, next) {
	if (!req.isAuthenticated()) return res.redirect('/');
	refresh("Sent", req, res);
});

router.get('/r/inbox', function (req, res, next) {
	if (!req.isAuthenticated()) return res.redirect('/');
	refresh("Inbox", req, res);
});

router.get('/r/trash', function (req, res, next) {
	if (!req.isAuthenticated()) return res.redirect('/');
	refresh("Trash", req, res);
});

router.get('/r/drafts', function (req, res, next) {
	if (!req.isAuthenticated()) return res.redirect('/');
	refresh("Drafts", req, res);
});
//---------------------------------------------------------//


//----------------- Get One Mail Item ---------------------//
router.get('/reply/:id', function (req, res, next) {
	if (!req.isAuthenticated()) {
		return res.redirect('/');
	}
	Mail.findById(req.params.id, function (err, mail) {
		if (err) console.log(err);
		res.render('mail/reply', {csrfToken: req.csrfToken(), user: req.user, messages: mail, layout: 'mail_layout' });
	});
});

router.get('/:id', function (req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');

	Mail.findById(req.params.id, function (err, mail) {
		if (err) console.log(err);
		res.render('mail/email', {csrfToken: req.csrfToken(), user: req.user, message: mail, layout: 'mail_layout' });
	});
});

router.get('/trash/:id', function (req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');

	Mail.findById(req.params.id, function (err, mail) {
		if (err) console.log(err);
		res.render('mail/trash_item', {csrfToken: req.csrfToken(), user: req.user, messages: mail, layout: 'mail_layout' });
	});
});

router.get('/edit/:id', function (req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');

	Mail.findById(req.params.id, function (err, mail) {
		if (err) console.log(err);
		res.render('mail/edit_draft', {csrfToken: req.csrfToken(), user: req.user, messages: mail, layout: 'mail_layout' });
	});
});

router.get('/drafts/:id', function (req, res, next) {
	if (!req.isAuthenticated())
		return res.redirect('/');

	Mail.findById(req.params.id, function (err, mail) {
		if (err) console.log(err);
		res.render('mail/edit_draft', {csrfToken: req.csrfToken(), user: req.user, messages: mail, layout: 'mail_layout' });
	});
});

router.get('/mail-body/:id', function (req, res, next) {
	Mail.findById(req.params.id, function (err, mail) {
		getMailBody(mail, req, res);
	});
	return res.status(200);
});
//------------------------------------------------------------//

//----------------- Get Mail Body Function ------------------//
function getMailBody(mail, req, res) {
	let attachments = [];

	let imap = new Imap({
		user: req.user.email,
		password: utils.getLong(req.user.long_text),
		host: 'mail.kornet-test.com',
		port: 993,
		tls: true
	});

	imap.once('ready', function (err) {
		if (err) console.log(err);
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
		res.send(err);
	});
	imap.once('end', (err) => {
		if (err) res.send(err);
		res.send(attachments);
	});
	imap.connect();
}
//------------------------------------------------------------//

//----------------- Refresh Function -------------------------//
function refresh(mailbox_name, req, res) {
	let imap = new Imap({
		user: req.user.email,
		password: utils.getLong(req.user.long_text),
		host: 'mail.kornet-test.com',
		port: 993,
		tls: true
	});

	imap.once('ready', function (err) {
		if (err) console.log(err);
		imap.openBox(mailbox_name, true, (function (err, box) {
			if (err) console.log(err);
			if (box != undefined && box.messages.total > 0) {
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
					return res.status(200);
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
	
	let subject = req.body.subject || 'No Subject';
	let recepient = req.body.recepient;
	let content = req.body.content || '';
	let sender = req.body.sender;
	let cc = req.body.cc;
	let bcc = req.body.bcc;
	let file_prefix = req.body.attr;
	let files = [];
	
	let _files = fs.readdirSync('./public/uploads/mail');
	if(_files != undefined && _files.length > 0){
		for (let i = 0;i < _files.length;i++){
			if(_files[i] != '.DS_Store' && _files[i].includes(file_prefix)){
				files.push({ filename: _files[i].split(file_prefix+'-')[1], content: fs.createReadStream('./public/uploads/mail/' + _files[i]) });
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
			pass: utils.getLong(req.user.long_text)
		}
	};
	let sendmailer = mailer.createTransport(smtpTransport(smtpConfig));

	//check if this mail is a reply
	let reply = req.params.id == 0 ? '' : req.params.id;

	let mailOptions = {
		from: sender,
		sender: sender,
		to: recepient,
		html: content,
		text: content,
		cc: cc,
		bcc: bcc,
		inReplyTo: reply,
		subject: subject,
		attachments: files,
		date: new Date(Date.now())
	};

	sendmailer.sendMail(mailOptions).then((sentMessageInfo) => {
		res.send(mailOptions);
	}).catch((err) => {
		if (err) console.log(err);
	});
});

router.post('/save-mail', function (req, res, next) {

	let mailOptions = {
		from: req.body.from,
		sender: req.body.sender,
		to: req.body.to,
		html: req.body.html,
		text: req.body.text,
		cc: req.body.cc,
		bcc: req.body.bcc,
		inReplyTo: req.body.inReplyTo,
		subject: req.body.subject,
		attachments: req.body.attachments,
		date: req.body.date
	};

	let mail = new MailComposer(mailOptions);

	mail.compile().build(function(err, message){
		if (err) console.log(err);

		let imap = new Imap({
			user: req.user.email,
			password: utils.getLong(req.user.long_text),
			host: 'mail.kornet-test.com',
			port: 993,
			tls: true
		});

		imap.once('ready', function () {
			imap.openBox('Sent', false, function (err, box) {
				if (err) console.log(err);
				imap.append(message, { mailbox: 'Sent', flags: ['Seen'], date: new Date(Date.now()) }, function (err) {
					if (err) console.log(err);
					imap.end();
				});
			});
		});
		imap.once('error', function (err) {
			console.log(err);
		});
		imap.once('end', function () {
			console.log('Saved in Mailbox');
			res.send({message: 'Saved in Mailbox'});
		});
		imap.connect();
	});
});
//---------------------------------------------------------//

module.exports = router;