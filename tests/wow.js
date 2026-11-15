// Wow moments, with motion on: a big check on every save in the job's colour, paper-money notes that stack,
// a tab icon that pops, rows that rise in, and the colour language on her line's panel.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
const fs = require('fs'), path = require('path'); const OUT = path.join(__dirname, 'out', 'wow'); fs.mkdirSync(OUT, {recursive: true});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, hasTouch: true, isMobile: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(90); };
  const txt = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const pop = () => p.evaluate(() => { const o = document.querySelector('.savedpop'); return o ? [getComputedStyle(o.querySelector('circle')).fill, o.textContent.trim(), getComputedStyle(o).pointerEvents] : null; });
  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(() => { localStorage.clear(); S = normalize({v: 4, settings: {item: 'Onions', unit: 'bag', price: 600}, setup: true, locs: [{id: 'l1', town: 'Koko Shell', spot: ''}], lastLoc: 'l1',
    people: [{id: 'a', name: 'Ama', phone: '', loc: 'l1', note: ''}], cars: [{id: 'c1', date: new Date().toISOString(), label: 'Wankai', items: [{id: 'i1', name: '', count: 30, price: 600}], costs: [], phase: 'giving'}], entries: []}); V.stack = []; V.tab = 'give'; commit(); render(); });
  await p.waitForTimeout(300);
  // a give
  await p.evaluate(() => openGive('a')); await p.waitForTimeout(900); await act('gsave'); await p.waitForTimeout(120);
  let pp = await pop();
  ok(pp && pp[0] === 'rgb(29, 63, 187)' && pp[1] === 'Ama · 1 bag' && pp[2] === 'none', 'a give: a big blue check, "Ama · 1 bag", and it never blocks taps: ' + JSON.stringify(pp));
  await p.screenshot({path: OUT + '/1-check.png'});
  await p.waitForTimeout(1100);
  ok(!(await p.$('.savedpop')), 'it goes away by itself');
  // cash
  await act('cash'); await act('cssave'); await p.waitForTimeout(120);
  pp = await pop(); ok(pp && pp[0] === 'rgb(18, 128, 74)' && pp[1] === 'Cash · ₵600', 'cash: a green check, "Cash · ₵600"');
  await p.waitForTimeout(1100);
  // the notes
  await p.evaluate(() => { V.tab = 'collect'; render(); }); await p.waitForTimeout(300);
  await p.click('[data-act="pay"]'); await p.waitForTimeout(200);
  const bgs = await p.$$eval('.sheet .note', els => els.map(e => getComputedStyle(e).borderTopColor));
  ok(bgs.length === 6 && new Set(bgs).size === 6, 'each note has its own colour, like paper money');
  await p.click('[data-act="note"][data-n="200"]'); await p.click('[data-act="note"][data-n="200"]'); await p.click('[data-act="note"][data-n="100"]'); await p.waitForTimeout(100);
  ok((await p.$$eval('.sheet .nstack i', els => els.map(e => e.textContent).join(' '))) === '200 200 100', 'tapped notes stack in the display: 200 200 100');
  await p.screenshot({path: OUT + '/2-notes.png'});
  await p.evaluate(() => closeSheet());
  // the tab icon pops, rows rise in
  await act('tab', '[data-t="give"]');
  ok(await p.evaluate(() => document.querySelector('.tab.on').classList.contains('pop') && getComputedStyle(document.querySelector('.tab.on svg')).animationName === 'tabpop'), 'the chosen tab icon pops');
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('#mid .lines > .row')).animationName === 'rise'), 'the rows rise in when the list opens');
  await p.evaluate(() => render()); await p.waitForTimeout(50);
  ok(await p.evaluate(() => !document.querySelector('.tab.on').classList.contains('pop')), 'the pop only plays when you switch tabs');
  // colour language on her line's panel
  await p.click('#mid .row:not(.cashrow) .who'); await p.waitForTimeout(150);
  ok((await p.$$('.sheet .menu .mi')).length >= 1, 'her line\'s panel shows coloured icon tiles');
  await p.evaluate(() => closeSheet());
  await p.evaluate(() => push({v: 'person', pid: 'a'})); await p.waitForTimeout(200);
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.showher.pd')).color) === 'rgb(109, 40, 217)', 'the Pay date button is violet');
  // reduced motion: no check
  const ctx2 = await b.newContext({viewport: {width: 390, height: 844}, reducedMotion: 'reduce', hasTouch: true, isMobile: true});
  const q = await ctx2.newPage(); await q.route(/fonts\.g/, r => r.abort()); await q.goto(URL); await q.waitForTimeout(300);
  await q.evaluate(() => { localStorage.clear(); S = normalize(demoData()); S.setup = true; V.stack = []; V.tab = 'give'; commit(); render(); savedPop('x', 'red'); });
  ok(!(await q.$('.savedpop')), 'Reduce Motion: no pop');
  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', e.message.split('\n').slice(0, 4).join(' | ')); process.exit(2); });
