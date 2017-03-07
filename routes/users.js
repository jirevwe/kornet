var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('dashboard');
});

router.get('/settings', function(req, res, next) {
  res.render('settings');
});

module.exports = router;
