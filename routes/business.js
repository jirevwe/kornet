var express = require('express');
var router = express.Router();
var utils = require('../utils/api');

// var csrf = require('csrf');

// let csrfProtection = csrf();
// router.use(csrfProtection);

router.get('/', utils.isActivated, function (req, res, next) {
	res.render('business/catalog');
});

module.exports = router;