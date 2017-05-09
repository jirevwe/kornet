// @ts-check
var express = require('express');
var router = express.Router();
let path = require('path');
let fs = require('fs');
let multer = require('multer');
let mkdirp = require('mkdirp');
let utils = require('../utils/api');
let BusinessCatalog = require('../models/business_catalog');

let storage = multer.diskStorage({
	destination: './public/uploads/business',
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

var csrf = require('csurf');

let csrfProtection = csrf();
router.use(csrfProtection);

router.get('/:catalog', utils.isActivated, function (req, res, next) {
	BusinessCatalog.findById(req.params.catalog, (err, catalog) => {
		if (err) console.log(err);
		let file_prefix = catalog._id;
		let files = [];
		
		let _files = fs.readdirSync('./public/uploads/business');
		if(_files != undefined && _files.length > 0){
			for (let a_file in _files){
				if(_files[a_file] != '.DS_Store' && _files[a_file].includes(file_prefix)){
					files.push({ name: _files[a_file], owner: catalog._id });
				}
			}
		}
		res.render('business/catalog', { catalog: catalog, images: files, csrfToken: req.csrfToken() });
	});
});

router.get('/edit/:catalog', utils.isActivated, function (req, res, next) {
	BusinessCatalog.findById(req.params.catalog, (err, catalog) => {
		if (err) console.log(err);
		res.render('business/edit', { catalog: catalog, csrfToken: req.csrfToken() });
	});
});

router.post('/save/:catalog', upload.single('attachment'), function(req, res, next){
	let body = req.body;

	BusinessCatalog.findById(req.params.catalog, (err, catalog) => {
		if (err) console.log(err);
		catalog.content = body.content;
		catalog.save();
	});
	res.redirect('/business/'+req.params.catalog);
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

router.post('/uploads/remove', function(req, res, next){
	fs.exists('./public/uploads/business/' + req.body.file, (exists) => {
		if(exists){
			fs.unlink('./public/uploads/business/' + req.body.file, (err) => {
				if (err)  return res.status(404).send('Delete Failed');
				return res.status(200).send('Successfully Deleted');
			});
		}else return res.status(404).send('File Doesn\'t Exist');
	});
});

module.exports = router;