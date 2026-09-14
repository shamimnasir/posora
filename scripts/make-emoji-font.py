#!/usr/bin/env python3
"""
Build the site's icon font.

Every picture on পসরা was an emoji character: 576 distinct ones, used 2,525
times. That looked cheap for a reason that has nothing to do with the pictures
being wrong. An emoji is not artwork the site owns; it is a request that the
reader's operating system draw something. Apple draws a glossy balloon with a
specular highlight, Google draws a flat one, Microsoft draws an outline, and
Samsung draws a third thing. Put ten of them in a row - which is exactly what a
category rail is - and you get ten marks by ten different illustrators, at ten
saturations, none of them in the site's palette. No amount of choosing better
emoji fixes that, because the drawing is not ours to choose.

Noto Emoji is the monochrome companion to Noto Color Emoji: the same glyph set,
drawn once, as flat silhouettes with no colour of their own. Served as a webfont
it makes every mark on the site one designer's hand, identical on every device,
and - because the glyphs carry no colour - each one takes the colour of the text
around it, so an icon can be tinted to its world.

Only the characters the site actually uses are kept, which is what makes this
affordable: the whole family is 1.9 MB, the subset is a fraction of that. It is
built from the source rather than hand-listed so that adding an emoji to a lab
and re-running this is the whole workflow.

    python3 -m venv .venv && .venv/bin/pip install fonttools brotli
    .venv/bin/python scripts/make-emoji-font.py

Like scripts/make-font.py, it writes a woff2 named after a hash of its own bytes
so the year-long cache header is safe, and rewrites the CSS that names it.
"""
import hashlib
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, 'src')
OUT_DIR = os.path.join(ROOT, 'public', 'fonts')
CSS_OUT = os.path.join(ROOT, 'src', 'styles', 'emoji-font.css')

# The monochrome Noto Emoji, SIL Open Font License 1.1.
TTF_URL = 'https://raw.githubusercontent.com/google/fonts/main/ofl/notoemoji/NotoEmoji%5Bwght%5D.ttf'
FAMILY = 'Noto Emoji'
# One weight, not the axis. The axis costs more than twice the bytes and the
# site never asks an icon to be bolder than the label beside it.
WEIGHT = 500

# Emoji runs, including the zero-width-joiner sequences (👩‍⚕️) and the
# variation selector that asks for emoji rather than text presentation.
RUN = re.compile(
    '(?:[\U0001F000-\U0001FAFF☀-➿⬀-⯿←-⇿Ⓜ]'
    '(?:️)?(?:\U0001F3FB-\U0001F3FF)?'
    '(?:‍[\U0001F000-\U0001FAFF☀-➿](?:️)?)*)')

READ = ('.ts', '.tsx', '.astro', '.md')

# Characters the site sets as type rather than as pictures.
#
# The run above is deliberately wide, so it also catches the symbol block, and
# some of the symbol block is typography: the three lives on a mission card are
# U+2665 BLACK HEART SUIT and the tick on a finish button is U+2714. Those are
# set at the size and weight of the words beside them and must come from the
# text font; handing them to an emoji font turns a light heart outline into a
# fat black blob. Arrows, stars, ticks and crosses need no entry here - Noto
# Emoji has no glyph for them, so they are skipped for us.
AS_TYPE = {'\u2665', '\u2714'}

# U+FE0F, the variation selector that asks for colour presentation.
#
# A character followed by it - ⚖, ☀, ⚛ - is a request for the reader's
# colour emoji font specifically, and browsers honour it: the monochrome face
# below is skipped and Apple Color Emoji answers instead, so one icon in a rail
# of ten arrives glossy. The site has its own drawing now, so the selector is
# stripped from src/ and from what is subsetted here. Zero-width joiners are
# kept: they are what makes 👨‍👩‍👧 one glyph rather than three.
VS16 = '\ufe0f'


def used_runs() -> set:
    """Every emoji run written anywhere in src/."""
    out = set()
    for root, _dirs, files in os.walk(SRC_DIR):
        for f in files:
            if f.endswith(READ):
                with open(os.path.join(root, f), encoding='utf-8') as fh:
                    out.update(r.replace(VS16, '') for r in RUN.findall(fh.read()))
    return out


def ranges(codepoints) -> str:
    """CSS unicode-range, runs collapsed."""
    cps = sorted(codepoints)
    out, i = [], 0
    while i < len(cps):
        j = i
        while j + 1 < len(cps) and cps[j + 1] == cps[j] + 1:
            j += 1
        out.append('U+%04X' % cps[i] if i == j else 'U+%04X-%04X' % (cps[i], cps[j]))
        i = j + 1
    return ', '.join(out)


def main() -> int:
    from fontTools.ttLib import TTFont
    from fontTools.varLib.instancer import instantiateVariableFont
    from fontTools.subset import Subsetter, Options

    runs = used_runs()
    text = ''.join(sorted(runs))
    print('emoji runs in src/: %d (%d characters)' % (len(runs), len(text)))

    print('fetching %s' % TTF_URL)
    with urllib.request.urlopen(TTF_URL, timeout=120) as r:
        raw = r.read()
    tmp = os.path.join(OUT_DIR, '.noto-emoji-source.ttf')
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(tmp, 'wb') as fh:
        fh.write(raw)

    font = TTFont(tmp)
    instantiateVariableFont(font, {'wght': WEIGHT}, inplace=True)

    # Which of the characters the site writes does this font actually draw?
    # The regex above also catches arrows, stars and check marks, which are
    # typography rather than emoji and belong in the text font. Anything the
    # emoji font has no glyph for is left out of the unicode-range, so the
    # browser never picks this face for it.
    have = set(font.getBestCmap())
    keep = {ord(c) for c in text if ord(c) in have and c not in AS_TYPE}
    skipped = sorted({c for c in text if (ord(c) not in have or c in AS_TYPE) and ord(c) not in (0x200D, 0xFE0F)})
    if skipped:
        print('left to the text font: ' + ' '.join(skipped))

    opts = Options()
    opts.layout_features = ['ccmp', 'liga', 'rlig', 'rclt']
    opts.hinting = False
    opts.desubroutinize = True
    opts.drop_tables += ['DSIG']
    opts.name_IDs = ['*']
    opts.notdef_outline = True
    sub = Subsetter(options=opts)
    sub.populate(text=''.join(c for c in text if c not in AS_TYPE))
    sub.subset(font)
    font.flavor = 'woff2'

    import io
    buf = io.BytesIO()
    font.save(buf)
    data = buf.getvalue()
    os.remove(tmp)

    digest = hashlib.sha256(data).hexdigest()[:10]
    name = 'noto-emoji-%d.%s.woff2' % (WEIGHT, digest)
    for old in os.listdir(OUT_DIR):
        if old.startswith('noto-emoji-') and old != name:
            os.remove(os.path.join(OUT_DIR, old))
    with open(os.path.join(OUT_DIR, name), 'wb') as fh:
        fh.write(data)
    print('wrote public/fonts/%s  (%.1f KB, %d glyphs)' % (name, len(data) / 1024, len(keep)))

    css = (
        '/* Generated by scripts/make-emoji-font.py. Do not edit by hand.\n'
        '   Noto Emoji (SIL OFL 1.1), monochrome, weight %d, subset to the %d\n'
        '   characters the site uses. Listed first in --font-body: the\n'
        '   unicode-range below is the only thing it is ever chosen for, so\n'
        '   Bangla and Latin fall straight through to Noto Sans Bengali. */\n'
        '@font-face {\n'
        '  font-family: "%s";\n'
        '  font-style: normal;\n'
        '  font-weight: 400 800;\n'
        '  font-display: swap;\n'
        '  src: url("/fonts/%s") format("woff2");\n'
        '  unicode-range: %s;\n'
        '}\n'
    ) % (WEIGHT, len(keep), FAMILY, name, ranges(keep))
    with open(CSS_OUT, 'w', encoding='utf-8') as fh:
        fh.write(css)
    print('wrote src/styles/emoji-font.css')
    return 0


if __name__ == '__main__':
    sys.exit(main())
