// The finger that teaches: the first time on each spot a hand taps it with a few words; once each; gone at any tap;
// never blocks a tap; "Show me how" brings them back. (Hints stay off in automated browsers unless HINTS_FORCE.)
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
const fs = require('fs'), path = require('path'); const OUT = path.join(__dirname, 'out', 'hints'); fs.mkdirSync(OUT, {recursive: true});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, hasTouch: true, isMobile: true});
  await ctx.addInitScript(() => { window.HINTS_FORCE = true; });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(90); };
  const hint = async () => { await p.waitForTimeout(500); const h = await p.$('.hint .bub'); return h ? (await h.textContent()).trim() : ''; };
  const tapBand = async () => { await p.mouse.click(200, 30); await p.waitForTimeout(80); };
  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(() => { localStorage.clear(); S = normalize({v: 4, settings: {item: 'Onions', unit: 'bag', price: 600, buy: true}, setup: true, locs: [{id: 'l1', town: 'Koko Shell', spot: ''}], lastLoc: 'l1',
    people: [{id: 'a', name: 'Ama', phone: '', loc: 'l1', note: ''}], cars: [{id: 'c1', date: new Date().toISOString(), label: 'Wankai', items: [{id: 'i1', name: 'Red', count: 30, price: 600}, {id: 'i2', name: 'Brown', count: 30, price: 650}], costs: [], phase: 'giving'}],
    entries: [{id: 'g', date: new Date(Date.now() - 20 * 864e5).toISOString(), type: 'give', pid: 'a', carId: 'c1', itemId: 'i1', bags: 2, price: 600, amount: 1200, loc: 'l1', off: new Date(Date.now() - 20 * 864e5).toISOString(), rcpt: true}]}); V.stack = []; V.tab = 'give'; commit(); render(); });
  ok(await hint() === 'Type her name', 'Give bags, first time: the hand points at the name box: "Type her name"');
  const pos = await p.evaluate(() => { const r = document.querySelector('.hint .ring').getBoundingClientRect(), t = document.getElementById('gq').getBoundingClientRect(); return Math.abs((r.left + r.width / 2) - (t.left + t.width / 2)) < 4 && Math.abs((r.top + r.height / 2) - (t.top + t.height / 2)) < 4; });
  ok(pos, 'the ring sits right on the name box');
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.hint')).pointerEvents) === 'none', 'it never blocks a tap');
  await p.screenshot({path: OUT + '/1-name.png'});
  await tapBand();
  ok(!(await p.$('.hint .bub')) || (await hint()) !== 'Type her name', 'any tap: that hint is gone');
  ok(await hint() === 'Tap for cash', 'then: "Tap for cash"');
  await tapBand(); await p.waitForTimeout(400);
  // the give sheet with photos
  await p.evaluate(() => openGive('a'));
  ok(await hint() === 'Tap the photo', 'the give sheet: "Tap the photo"');
  await p.screenshot({path: OUT + '/2-photo.png'});
  await tapBand(); await p.evaluate(() => closeSheet());
  // take money
  await act('tab', '[data-t="collect"]');
  ok(await hint() === 'Tap her name', 'Take money: "Tap her name"');
  await p.click('#collist .row[data-act="pay"]');
  ok(await hint() === 'Tap the notes', 'the pay pad: "Tap the notes"');
  await p.screenshot({path: OUT + '/3-notes.png'});
  await tapBand(); await p.evaluate(() => closeSheet());
  await act('tab', '[data-t="buy"]'); await act('tripnew'); await act('tpgo');
  ok(await hint() === 'Tap Bought', 'Buy bags: "Tap Bought"');
  await tapBand();
  // once each
  await act('tab', '[data-t="give"]');
  ok(await hint() === '', 'back on Give bags: no hint again (each shows once)');
  const seen = await p.evaluate(() => JSON.parse(localStorage.getItem('stallbook_hints')));
  ok(['name', 'cash', 'photo', 'take', 'notes', 'bought'].every(x => seen.includes(x)), 'all six were seen: ' + seen.join(', '));
  // Show me how
  await act('tab', '[data-t="book"]'); await act('settings'); await act('hintsreset');
  await p.evaluate(() => toRoot('give'));
  ok(await hint() === 'Type her name', 'Settings › Show me how: the hints are back');
  // automated browsers without the switch: none
  const ctx2 = await b.newContext({viewport: {width: 390, height: 844}});
  const q = await ctx2.newPage(); await q.route(/fonts\.g/, r => r.abort()); await q.goto(URL); await q.waitForTimeout(300);
  await q.evaluate(() => { localStorage.clear(); S = normalize(demoData()); S.setup = true; V.stack = []; V.tab = 'give'; commit(); render(); }); await q.waitForTimeout(600);
  ok(!(await q.$('.hint')), 'other tests are not disturbed: no hints there');
  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', e.message.split('\n').slice(0, 4).join(' | ')); process.exit(2); });
