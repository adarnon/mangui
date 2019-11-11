var express = require('express');
var router = express.Router();

var fs = require('fs');

router.get('/:cmd', function(req, res, next) {
  fs.readFile(`man/${req.params.cmd}.json`, (err, data) => {
    if (err) throw err;
    let cmd = JSON.parse(data);
    res.render('cmd', { cmd: cmd });
  });
});

module.exports = router;
