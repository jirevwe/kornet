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

// var csrf = require('csurf');

// let csrfProtection = csrf();
// router.use(csrfProtection);

router.get('/:catalog', utils.isActivated, function (req, res, next) {
	BusinessCatalog.findById(req.params.catalog, (err, catalog) => {
		if (err) console.log(err);
		res.render('business/catalog', { catalog: catalog});
	});
});

router.get('/edit/:catalog', utils.isActivated, function (req, res, next) {
	BusinessCatalog.findById(req.params.catalog, (err, catalog) => {
		if (err) console.log(err);
		res.render('business/edit', { catalog: catalog, business: { _id: catalog._id, name: catalog.name }});
	});
});

router.post('/save/:catalog', upload.single('attachment'), function(req, res, next){
	let body = req.body;
	
	let file_prefix = req.body.attr;
	let files = [];
	
	let _files = fs.readdirSync('./public/uploads/business');
	if(_files != undefined && _files.length > 0){
		for (let a_file in _files){
			if(_files[a_file] != '.DS_Store' && _files[a_file].includes(file_prefix)){
				files.push(_files[a_file]);
			}
		}
	}

	BusinessCatalog.findById(req.params.catalog, (err, catalog) => {
		if (err) console.log(err);
		catalog.images = files;
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
	fs.exists('./'+file.path, (exists) => {
		if(exists){
			fs.unlink('./'+file.path, (err) => {
				if (err) {
					console.log(err);
					return res.status(200);
				}
			});
		}
	});
	return res.status(200);
});

module.exports = router;