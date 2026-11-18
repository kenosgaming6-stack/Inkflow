// The regulars on Give bags: big name buttons, women of this place first, then who comes most often; tap one and her
// usual bags are set, one more tap gives; she then leaves the grid (she has taken from this load).
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
const fs = require('fs'), path = require('path'); const OUT = path.join(__dirname, 'out', 'regulars'); fs.mkdirSync(OUT, {recursive: true});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, reducedMotion: 'reduce', hasTouch: true, isMobile: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(110); };
  const txt = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const grid = () => p.$$eval('.faces.regs .reg .n', els => els.map(e => e.textContent));
  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(() => { localStorage.clear(); const d = n => new Date(Date.now() - n * 864e5).toISOString();
    // how many old loads each woman took from (how often she comes), and where she sells
    const plan = [['Ama', 'l1', 4], ['Esi', 'l1', 1], ['Yaa', 'l2', 5], ['Akosua', 'l1', 2], ['Efua', 'l2', 1], ['Abena', 'l1', 3], ['Adwoa', 'l1', 0], ['Mansah', 'l2', 2]];
    const cars = [0, 1, 2, 3, 4].map(i => ({id: 'o' + i, date: d(60 - i * 10), label: 'Old ' + i, items: [{id: 'x' + i, name: '', count: 50, price: 600}], costs: [], phase: 'out'}));
    cars.push({id: 'c1', date: d(1), label: 'Abidjan', items: [{id: 'i1', name: '', count: 40, price: 650}], costs: [], phase: 'giving'});
    const entries = []; plan.forEach(([n, loc, k], wi) => { for (let i = 0; i < k; i++) entries.push({id: n + i, date: d(59 - i * 10), type: 'give', pid: 'w' + wi, carId: 'o' + i, itemId: 'x' + i, bags: 3, price: 600, amount: 1800, loc, off: d(59 - i * 10), rcpt: true}); });
    entries.forEach(e => entries.push({id: 'p' + e.id, date: e.date, type: 'pay', pid: e.pid, amount: e.amount, method: 'cash'}));
    S = normalize({v: 4, settings: {item: 'Onions', unit: 'bag', price: 650}, setup: true, locs: [{id: 'l1', town: 'Koko Shell', spot: ''}, {id: 'l2', town: 'Bechem', spot: ''}], lastLoc: 'l1',
      people: plan.map(([n, loc], wi) => ({id: 'w' + wi, name: n, phone: '', loc, note: ''})), cars, entries});
    V.stack = []; V.tab = 'give'; commit(); render(); });
  await p.waitForTimeout(250);
  const g1 = await grid();
  ok(g1.length === 6 && g1.slice(0, 5).join(',') === 'Ama,Abena,Akosua,Esi,Adwoa', 'Koko Shell: its women first, the most regular first (Ama 4 loads, Abena 3, Akosua 2, Esi 1, Adwoa new): ' + g1.join(', '));
  ok(g1[5] === 'Yaa', 'then the most regular from elsewhere (Yaa)');
  ok(await p.evaluate(() => { const r = document.querySelector('.faces.regs .reg').getBoundingClientRect(); return r.height >= 48 && r.width >= 100; }), 'the buttons are big (at least 48 high, a third of the width)');
  await p.screenshot({path: OUT + '/1-grid.png'});
  // tap: her usual is set, one more tap gives
  await p.click('.faces.regs .reg:has-text("Ama")'); await p.waitForTimeout(150);
  ok((await txt('.sheet .step .num')).startsWith('3') && (await txt('[data-act="gsave"]')) === 'Give 3 bags', 'tap Ama: her usual 3 bags are already set: "Give 3 bags"');
  await p.waitForTimeout(820); await act('gsave');
  ok(await p.evaluate(() => S.entries.some(e => e.type === 'give' && e.pid === 'w0' && e.carId === 'c1' && e.bags === 3)), 'one more tap: 3 bags given to Ama');
  ok(!(await grid()).includes('Ama'), 'Ama leaves the grid: she has taken from this load');
  // another place: its women first
  await p.evaluate(() => { S.lastLoc = 'l2'; render(); }); await p.waitForTimeout(150);
  const g2 = await grid();
  ok(g2.slice(0, 3).join(',') === 'Yaa,Mansah,Efua', 'on Bechem: Yaa, Mansah and Efua first: ' + g2.join(', '));
  // a short screen: one row
  await p.setViewportSize({width: 320, height: 568}); await p.waitForTimeout(250);
  ok(await p.evaluate(() => [...document.querySelectorAll('.faces.regs .reg')].filter(e => e.offsetParent).length === 3) && await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'a short screen shows one row of three');
  await p.screenshot({path: OUT + '/2-small.png'});
  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', String(e.message).split('\n').slice(0, 6).join(' | ')); process.exit(2); });
