import argparse
import json
from pathlib import Path
import sys


def parse(args):
    allopts = []
    with open(args.infile, 'r', encoding='utf-8') as inf:
        cmds = []
        descs = []
        
        for line in inf:
            line = line.strip()
            if line.startswith('-'):
                # Option line
                index_comma = line.find(',')
                index_space = line.find(' ')

                if index_comma == -1:
                    spl = line.split(' ', 1)
                    cmds = spl[:1]
                    d = ' '.join(spl[1:]).strip()
                    if d:
                        descs.append(d)
                elif index_space < index_comma:
                    spl = line.split(' ', 1)
                    cmds = spl[:1]
                    d = ' '.join(spl[1:]).strip()
                    if d:
                        descs.append(d)
                else:
                    cmds = line.split(', ')
            elif line:
                # Description line
                descs.append(line)
            else:
                # Flush
                allopts.append({ 'cmds': cmds, 'desc': '\n'.join(descs) })
                cmds = []
                descs = []

        # Flush last
        allopts.append({ 'cmds': cmds, 'desc': '\n'.join(descs) })

    with open(args.outfile, 'w', encoding='utf-8') as outf:
        json.dump(allopts, outf, indent=2)


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument('infile', type=Path)
    parser.add_argument('outfile', type=Path)

    parse(parser.parse_args())


if __name__ == '__main__':
    sys.exit(main())
