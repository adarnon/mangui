var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'MANGUI', subpages: [{url: 'cmd', name: 'Command List'}] });
});

module.exports = router;
