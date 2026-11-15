// Right hand first: bag photo tiles start on the right, notes have 200 on the right and 5 on the left, faces start on
// the right. Left hand mirrors it all. The notes have the real cedi colours. The first open asks which hand.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
const fs = require('fs'), path = require('path'); const OUT = path.join(__dirname, 'out', 'hand'); fs.mkdirSync(OUT, {recursive: true});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, reducedMotion: 'reduce', hasTouch: true, isMobile: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const x = sel => p.evaluate(sel => { const e = document.querySelector(sel); return e ? Math.round(e.getBoundingClientRect().left) : -1; }, sel);
  const setup = hand => p.evaluate(hand => { localStorage.clear(); const old = new Date(Date.now() - 30 * 864e5).toISOString();
    S = normalize({v: 4, settings: {item: 'Onions', unit: 'bag', price: 600, hand}, setup: true, locs: [{id: 'l1', town: 'Koko Shell', spot: ''}], lastLoc: 'l1',
      people: [{id: 'a', name: 'Ama', phone: '', loc: 'l1', note: ''}, {id: 'e', name: 'Esi', phone: '', loc: 'l1', note: ''}],
      cars: [{id: 'c0', date: old, label: 'Old', items: [{id: 'o1', name: '', count: 30, price: 600}], costs: [], phase: 'out'}, {id: 'c1', date: new Date().toISOString(), label: 'Wankai', items: [{id: 'i1', name: 'Red', count: 30, price: 600}, {id: 'i2', name: 'Brown', count: 30, price: 650}], costs: [], phase: 'giving'}],
      entries: [{id: 'g1', date: old, type: 'give', pid: 'a', carId: 'c0', itemId: 'o1', bags: 2, price: 600, amount: 1200, loc: 'l1', off: old, rcpt: true}, {id: 'g2', date: old, type: 'give', pid: 'e', carId: 'c0', itemId: 'o1', bags: 1, price: 600, amount: 600, loc: 'l1', off: old, rcpt: true}]});
    V.stack = []; V.tab = 'give'; commit(); render(); }, hand);

  await p.goto(URL); await p.waitForTimeout(300);
  for (const hand of ['right', 'left']) {
    await setup(hand); await p.waitForTimeout(200);
    await p.evaluate(() => openGive('a')); await p.waitForTimeout(150);
    const k1 = await x('.sheet .ktile:nth-child(1)'), k2 = await x('.sheet .ktile:nth-child(2)');
    ok(hand === 'right' ? k1 > k2 : k1 < k2, `${hand} hand: the first bag photo is on the ${hand} (${k1} vs ${k2})`);
    ok(await p.evaluate(() => getComputedStyle(document.querySelector('.sheet .ktiles')).gridTemplateColumns.split(' ').length) === 2, 'the give panel has two big tiles across');
    if (hand === 'right') await p.screenshot({path: OUT + '/1-tiles-right.png'});
    await p.evaluate(() => { closeSheet(); openPay('a', {ctx: 'collect'}); }); await p.waitForTimeout(150);
    const n200 = await x('.sheet .note[data-n="200"]'), n5 = await x('.sheet .note[data-n="5"]');
    ok(hand === 'right' ? n200 > n5 : n200 < n5, `${hand} hand: ₵200 is on the ${hand}, ₵5 on the other side`);
    if (hand === 'right') await p.screenshot({path: OUT + '/2-notes-right.png'});
    await p.evaluate(() => closeSheet());
    const f1 = await x('.faces .face:nth-child(1)'), f2 = await x('.faces .face:nth-child(2)');
    ok(f1 >= 0 && f2 >= 0 && (hand === 'right' ? f1 > f2 : f1 < f2), `${hand} hand: the faces start on the ${hand}`);
  }
  // the real note colours
  await setup('right'); await p.evaluate(() => openPay('a', {ctx: 'collect'})); await p.waitForTimeout(150);
  const col = await p.$$eval('.sheet .note', els => Object.fromEntries(els.map(e => [e.dataset.n, getComputedStyle(e).borderTopColor])));
  ok(col['5'] === 'rgb(30, 79, 160)' && col['10'] === 'rgb(46, 125, 50)' && col['20'] === 'rgb(106, 44, 154)' && col['50'] === 'rgb(122, 74, 30)' && col['100'] === 'rgb(14, 111, 98)' && col['200'] === 'rgb(163, 53, 42)',
    'notes: 5 blue, 10 green, 20 violet, 50 brown, 100 teal green, 200 brick red');
  await p.evaluate(() => closeSheet());
  // the first open asks
  await p.evaluate(() => { localStorage.clear(); S = blank(); V.su = 2; V.stack = [{v: 'setup'}]; render(); }); await p.waitForTimeout(150);
  ok((await p.textContent('#mid')).includes('Phone in which hand?') && !!(await p.$('[data-act="setseg"][data-k="hand"][data-v="left"]')), 'the first open asks: Phone in which hand?');
  await p.click('[data-act="setseg"][data-k="hand"][data-v="left"]'); await p.waitForTimeout(100);
  ok(await p.evaluate(() => S.settings.hand === 'left' && document.documentElement.classList.contains('lh')), 'choosing Left hand mirrors the app');
  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', e.message.split('\n').slice(0, 4).join(' | ')); process.exit(2); });
