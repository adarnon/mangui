"use strict";

const fs = require('fs')
const zlib = require('zlib')
const Jroff = require('jroff') // There is a bug in the .min.js, we must use the full version

var lsgzip = fs.readFileSync('man/ls.1.gz')
var lsbuf = zlib.gunzipSync(lsgzip);
var lsman = lsbuf.toString('utf8')

var parser = new Jroff.Parser(lsman)
var ast = parser.buildAST()

function* to_iter(arr) {
    for (let e of arr) {
        yield e
    }
}

function read_opt(it) {
    let cmds = []
    let desc = ''

    let tok = null
    while ((tok = it.next()).value.value != '\\f') {}


    return {
        cmds: cmds,
        desc: desc
    }
}

class Option {
    constructor(toks) {
        this.toks = toks
    }
}

var opts = []
var astit = to_iter(ast)
var elem = null
var optToks = []
while (!(elem = astit.next()).done) {
    let tok = elem.value    

    switch (tok.kind) {
    case Jroff.MACRO:
        if (tok.value == 'TP') {
            // Done with this option
            opts.push(new Option(optToks))
            optToks = []
        }
        break
    case Jroff.TEXT:
        optToks.push(tok)
        break
    case Jroff.ESCAPE:
        optToks.push(tok)
        break
    default:
        console.warn('Ignoring:', tok)
    }
}

console.log('Built!')
