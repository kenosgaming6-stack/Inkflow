// The Counter: taps, trips of 1/2/3, dots, − for slips, lock for handing over, hold to finish,
// then "Who took them?" into a give, or the count check filled in.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/'; const OUT = require('path').join(__dirname, 'out', 'counter');
require('fs').mkdirSync(OUT, {recursive: true});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, reducedMotion: 'reduce', hasTouch: true, isMobile: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(70); };
  const txt = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const shot = n => p.screenshot({path: `${OUT}/${n}.png`});
  const hold = async (sel, ms) => { const bx = await (await p.$(sel)).boundingBox(); await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await p.mouse.down(); await p.waitForTimeout(ms); await p.mouse.up(); await p.waitForTimeout(120); };
  const total = async () => Number(await txt('.ctn'));
  const tap = async n => { for (let i = 0; i < n; i++) await act('cttap'); };
  const setup = () => p.evaluate(() => { localStorage.clear(); S = normalize({v: 4, settings: {item: 'Onions', unit: 'bag', price: 600}, setup: true,
    locs: [{id: 'l1', town: 'Koko Shell', spot: ''}, {id: 'l2', town: 'Bechem', spot: ''}], lastLoc: 'l1',
    people: [{id: 'k', name: 'Kofi', phone: '', loc: 'l2', note: ''}, {id: 'a', name: 'Ama', phone: '', loc: 'l1', note: ''}, {id: 'e', name: 'Esi', phone: '', loc: 'l1', note: ''}],
    cars: [{id: 'c1', date: new Date().toISOString(), label: 'Wankai', items: [{id: 'i1', name: 'Red net', count: 30, price: 600}, {id: 'i2', name: 'Brown sack', count: 20, price: 700}], costs: [], phase: 'giving'}], entries: []});
    V.stack = []; V.tab = 'give'; commit(); render(); });

  await p.goto(URL); await p.waitForTimeout(300); await setup(); await p.waitForTimeout(200);
  await act('carmenu'); ok(!!(await p.$('.sheet [data-act="counter"]')), 'the card menu has "Counter"');
  await act('counter');
  ok(await total() === 0 && (await txt('.ctr small')) === 'Tap anywhere for each trip' && await p.isDisabled('[data-hold="ctdone"]'), 'the counter opens at 0: "Tap anywhere for each trip", finish is off');
  ok((await txt('.ctrip button.on')) === '2' && (await txt('.seg button.on')) === 'Give out', 'it starts on Give out, 2 each tap');
  await tap(3); ok(await total() === 6 && (await p.$$('.dots i')).length === 6, 'three taps of 2: 6, six dots');
  ok((await p.$$('.dots i.b')).length === 2, 'each trip has its own shade, so the trips show');
  await act('cttrip', '[data-n="3"]'); await tap(1); await act('cttrip', '[data-n="1"]'); await tap(1);
  ok(await total() === 10 && (await txt('.ctr small')) === '5 taps', 'a trip of 3, then 1: 10 in 5 taps');
  await shot('1-counting');
  await act('ctless'); ok(await total() === 9, 'a slip: − takes the last trip off (9)');

  // it survives the phone closing the app
  await p.reload(); await p.waitForTimeout(500); await p.evaluate(() => { V.stack = []; V.tab = 'give'; render(); });
  await act('carmenu'); await act('counter');
  ok(await total() === 9, 'after closing and opening the app, the count is still 9');

  // a different kind cannot be picked in the middle of a count
  await act('ctkind', '[data-i="i2"]');
  ok(await p.evaluate(() => V.ct.kind) === 'i1' && (await txt('#toast')).includes('Finish this count first'), 'changing the kind mid-count is refused');

  // lock: hand the phone to the boy
  await act('ctlock');
  ok(!(await p.$('[data-act="back"]')) && !(await p.$('.seg')) && !(await p.$('[data-act="ctless"]')) && !!(await p.$('[data-hold="ctunlock"]')), 'locked: no back, no settings, no −; only "Hold to unlock"');
  await act('cttrip').catch(() => {});
  await tap(2); ok(await total() === 11, 'locked: taps still count (11)');
  await shot('2-locked');
  await p.click('[data-hold="ctunlock"]'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => V.ct.locked), 'a quick tap does not unlock');
  await hold('[data-hold="ctunlock"]', 1100);
  ok(!(await p.evaluate(() => V.ct.locked)) && !!(await p.$('[data-act="back"]')), 'holding unlocks');

  // hold − to start again
  await hold('[data-act="ctless"]', 900);
  ok(await total() === 0, 'hold −: back to 0');

  // give out: count 7 of the brown sacks, then who took them
  await act('ctkind', '[data-i="i2"]'); await act('cttrip', '[data-n="1"]'); await tap(7);
  await p.click('[data-hold="ctdone"]'); await p.waitForTimeout(150);
  ok(!(await p.$('.sheet')), 'a quick tap on "Hold to finish" does nothing');
  await hold('[data-hold="ctdone"]', 900);
  ok((await txt('.sheet h3')) === 'Who took 7 bags?', 'held: "Who took 7 bags?"');
  const names = await p.$$eval('.ctwho .who1 b', els => els.map(e => e.textContent));
  ok(names.join(',') === 'Ama,Esi,Kofi' || names.join(',') === 'Esi,Ama,Kofi', 'names from this place first: ' + names.join(', '));
  await shot('3-who');
  await p.fill('#ctq', 'es'); await p.waitForTimeout(80);
  { const vis = await p.$$eval('.ctwho .who1', els => els.filter(e => !e.hidden).map(e => e.querySelector('b').textContent).join(',')); ok(vis === 'Esi' && await p.isHidden('#ctnew'), 'typing "es" leaves only Esi: ' + vis); }
  await p.fill('#ctq', 'Abena'); await p.waitForTimeout(80);
  ok(await p.isVisible('#ctnew') && (await txt('#ctnew')) === 'New: Abena', 'a new name: "New: Abena"');
  await p.fill('#ctq', ''); await p.waitForTimeout(60);
  await act('ctpick', '[data-id="e"]'); await p.waitForTimeout(150);
  ok((await txt('[data-act="gsave"]')) === 'Give 7 bags' && await p.evaluate(() => V.g && V.g.pid === 'e' && V.g.kinds.i2 === 7), 'the give opens for Esi with 7 brown sacks');
  await shot('4-give');
  await p.waitForTimeout(850); await act('gsave'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => S.entries.some(e => e.type === 'give' && e.pid === 'e' && e.itemId === 'i2' && e.bags === 7)), 'saved: Esi took 7 brown sacks');
  ok(await p.evaluate(() => !V.ct && !localStorage.getItem('stallbook_counter')), 'the counter is cleared after');

  // count car: the number goes into the count check
  await act('carmenu'); await act('counter'); await act('ctmode', '[data-m="in"]'); await tap(5);
  await hold('[data-hold="ctdone"]', 900);
  ok((await txt('.sheet h3')).includes('left in the car') && await p.evaluate(() => V.cc.rows.find(r => r.id === 'i1').n === 10), 'Count car: 5 taps of 2 fill the count check with 10');
  await shot('5-check');
  await p.evaluate(() => closeSheet());

  // a small phone
  await p.setViewportSize({width: 320, height: 568}); await act('carmenu'); await act('counter'); await tap(4); await p.waitForTimeout(100);
  const fit = await p.evaluate(() => { const r = document.querySelector('[data-hold="ctdone"]').getBoundingClientRect(); return r.bottom <= innerHeight && document.documentElement.scrollWidth <= innerWidth; });
  ok(fit, 'on a small phone everything fits, nothing sideways');
  await shot('6-small');

  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', e.message.split('\n').slice(0, 4).join(' | ')); process.exit(2); });
