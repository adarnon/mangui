import argparse
from contextlib import nullcontext
import json
from pathlib import Path
import sys

def parse_cmd(argstrs):
    if not isinstance(argstrs, list):
        argstrs = [argstrs]

    out = []
    for c in argstrs:
        parts = c.split('=')
        if len(parts) == 1:
            out.append({
                'name': parts[0],
                'type': 'binary',
            })
        elif len(parts) == 2:
            out.append({
                'name': parts[0],
                'metavar': parts[1],
                'type': 'str',
            })
        else:
            raise RuntimeError

    return out

def parse(pargs):
    allopts = []

    if pargs.infile.name == '-':
        inpath = nullcontext(sys.stdin)
    else:
        inpath = open(pargs.infile, 'r', encoding='utf-8')

    if pargs.outfile.name == '-':
        outpath = nullcontext(sys.stdout)
    else:
        outpath = open(pargs.outfile, 'w', encoding='utf=8')

    with inpath as inf:
        cargs = []
        descs = []

        for line in inf:
            line = line.strip()
            if line.startswith('-'):
                # Option line
                index_comma = line.find(',')
                index_space = line.find(' ')

                if index_comma == -1:
                    spl = line.split(' ', 1)
                    cargs = parse_cmd(spl[:1])
                    d = ' '.join(spl[1:]).strip()
                    if d:
                        descs.append(d)
                elif index_space < index_comma:
                    spl = line.split(' ', 1)
                    cargs = parse_cmd(spl[:1])
                    d = ' '.join(spl[1:]).strip()
                    if d:
                        descs.append(d)
                else:
                    cargs = parse_cmd(line.split(', '))
            elif line:
                # Description line
                descs.append(line)
            else:
                # Flush
                allopts.append({ 'args': cargs, 'desc': '\n'.join(descs) })
                cargs = []
                descs = []

        # Flush last
        allopts.append({ 'args': cargs, 'desc': '\n'.join(descs) })

    with outpath as outf:
        json.dump(allopts, outf, indent=2)


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument('infile', type=Path)
    parser.add_argument('outfile', type=Path)

    parse(parser.parse_args())


if __name__ == '__main__':
    sys.exit(main())
