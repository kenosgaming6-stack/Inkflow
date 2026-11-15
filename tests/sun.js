// Readable in the sun: small text is at least 15px and darker, the load card legend is icon + number, Big text works.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
const fs = require('fs'), path = require('path'); const OUT = path.join(__dirname, 'out', 'sun'); fs.mkdirSync(OUT, {recursive: true});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, reducedMotion: 'reduce', hasTouch: true, isMobile: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(90); };
  const px = sel => p.evaluate(sel => { const e = document.querySelector(sel); return e ? parseFloat(getComputedStyle(e).fontSize) : 0; }, sel);
  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(() => { localStorage.clear(); S = normalize(demoData()); S.setup = true; S.lastLoc = S.locs.find(l => l.town === 'Koko Shell').id; V.stack = []; V.tab = 'collect'; commit(); render(); });
  await p.waitForTimeout(300);
  ok(await px('#mid .row .sub') >= 15 && await px('#mid .tag') >= 14, `small lines are at least 15px (${await px('#mid .row .sub')}), tags 14px`);
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('#mid .row .sub')).color) === 'rgb(71, 77, 92)', 'small lines are darker');
  await p.evaluate(() => { V.tab = 'give'; render(); }); await p.waitForTimeout(200);
  const leg = await p.$$eval('.stock .leg .li', els => els.map(e => [!!e.querySelector('svg'), e.querySelector('b').textContent, e.title]));
  ok(leg.length >= 2 && leg.every(x => x[0]) && leg.map(x => x[2]).includes('given') && leg.map(x => x[2]).includes('loaded'), 'the card legend is icon + number: ' + leg.map(x => x[2] + ' ' + x[1]).join(', '));
  ok(await p.evaluate(() => { const v = document.querySelector('.stock .leg .vh'); const r = v.getBoundingClientRect(); return r.width <= 1 && r.height <= 1; }), 'the words are kept for screen readers but not shown');
  ok(await px('.stock .leg .li b') >= 17, 'the legend numbers are big');
  await p.screenshot({path: OUT + '/1-give.png'});
  // Big text
  const s0 = await p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s')));
  await p.evaluate(() => { V.tab = 'book'; render(); }); await act('settings'); await act('togglebig');
  const s1 = await p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s')));
  ok(Math.abs(s1 / s0 - 1.15) < 0.01, `Big text makes everything 15% bigger (${s0} → ${s1})`);
  await p.evaluate(() => toRoot('give')); await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'with Big text nothing goes sideways');
  await p.screenshot({path: OUT + '/2-big.png'});
  await p.reload(); await p.waitForTimeout(500);
  ok(Math.abs(await p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s'))) - s1) < 0.01, 'Big text stays on after the app closes');
  // a small phone, both sizes
  await p.setViewportSize({width: 320, height: 568}); await p.waitForTimeout(300);
  for (const t of ['give', 'collect', 'book']) { await p.evaluate(t => { V.tab = t; render(); }, t); await p.waitForTimeout(120); }
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'small phone with Big text: nothing goes sideways');
  await p.screenshot({path: OUT + '/3-small-big.png'});
  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', e.message.split('\n').slice(0, 4).join(' | ')); process.exit(2); });
