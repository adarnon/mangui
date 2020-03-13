var express = require('express');
var router = express.Router();

var path = require('path');
var fs = require('fs');
var glob = require('glob');

router.get('/', function(req, res, next) {
  glob.glob('man/*.json', {}, (err, matches) => {
    console.log(matches);
    let cmds = matches.map((x) => path.basename(x, '.json'));
    res.render('cmd-index', { cmds: cmds });
  });
});

router.get('/:cmd', function(req, res, next) {
  fs.readFile(`man/${req.params.cmd}.json`, (err, data) => {
    if (err) throw err;
    let cmd = JSON.parse(data);
    res.render('cmd', { cmd: cmd });
  });
});

module.exports = router;
