"""One self-contained StallBook file: fonts and icons inside, no offline worker."""
import base64, re, sys
import os
d = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public') + os.sep
s = open(d + 'index.html', encoding='utf-8').read()
uri = lambda f, t: 'data:%s;base64,%s' % (t, base64.b64encode(open(d + f, 'rb').read()).decode())
def rep(a, b):
    global s
    assert s.count(a) == 1, a[:70]; s = s.replace(a, b)
for f in ['atkinson-400-latin', 'atkinson-400-latin-ext', 'atkinson-700-latin', 'atkinson-700-latin-ext']:
    rep(f"url(fonts/{f}.woff2)", f"url({uri('fonts/' + f + '.woff2', 'font/woff2')})")
rep('<link rel="preload" href="fonts/atkinson-400-latin.woff2" as="font" type="font/woff2" crossorigin>\n', '')
rep('<link rel="preload" href="fonts/atkinson-700-latin.woff2" as="font" type="font/woff2" crossorigin>\n', '')
rep('<link rel="manifest" href="manifest.webmanifest">\n', '')
rep('<link rel="icon" href="icon-192.png">', '<link rel="icon" href="%s">' % uri('icon-192.png', 'image/png'))
rep('<link rel="apple-touch-icon" href="apple-touch-icon.png">', '<link rel="apple-touch-icon" href="%s">' % uri('apple-touch-icon.png', 'image/png'))
rep('href="splash-1170x2532.png"', 'href="%s"' % uri('splash-1170x2532.png', 'image/png'))
rep('/* Atkinson Hyperlegible ships with the app (SIL Open Font License, fonts/OFL.txt), so it works offline.', '/* Atkinson Hyperlegible (SIL Open Font License) is built into this file.')
rep('It then opens full screen and works with no data.', 'It then opens full screen, like an app.')
s, n = re.subn(r"/\* updates download in the background; offer a reload when the new version is ready \*/\nif \('serviceWorker' in navigator.*?\n\}\n", '', s, flags=re.S); assert n == 1
assert 'fonts/' not in s and 'sw.js' not in s and '.png"' not in s
open(sys.argv[1], 'w', encoding='utf-8').write(s); print(len(s))
