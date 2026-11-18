// Simple mode: a new phone starts in it, a book already in use keeps every button. In Simple, the extras are under
// More (Keep for her, the rarer load options, Remind and End of day, the less used settings) and the Book has no
// Show Mom or sort button. The switch at the top of Settings turns it off and on.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
const fs = require('fs'), path = require('path'); const OUT = path.join(__dirname, 'out', 'simple'); fs.mkdirSync(OUT, {recursive: true});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, reducedMotion: 'reduce', hasTouch: true, isMobile: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(110); };
  const has = sel => p.evaluate(sel => !!document.querySelector(sel), sel);
  const cards = () => p.$$eval('.scard header b', els => els.map(e => e.textContent).join('|'));
  const tab = async t => { await p.evaluate(t => { V.stack = []; V.tab = t; closeSheet(); render(); }, t); await p.waitForTimeout(150); };
  await p.goto(URL); await p.waitForTimeout(300);
  // a new phone
  await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
  await act('sunext'); await act('sunext'); await act('sunext'); await act('setupdone'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => S.settings.simple === true), 'a new phone starts as the Simple app');
  ok(await p.evaluate(() => normalize({v: 4, settings: {item: 'Onions'}, setup: true, people: [{id: 'a', name: 'Ama'}]}).settings.simple === false), 'a book already in use keeps every button');
  ok(await p.evaluate(() => !CB_SET.includes('simple')), 'the switch stays on this phone');
  // a book in Simple
  await p.evaluate(() => { const d = n => new Date(Date.now() - n * 864e5).toISOString();
    const give = (id, pid, n) => ({id, date: d(n), type: 'give', pid, carId: 'c1', itemId: 'i1', bags: 3, price: 650, amount: 1950, loc: 'l1', off: d(n), rcpt: true});
    S = normalize({v: 4, settings: {item: 'Onions', unit: 'bag', price: 650, simple: true}, setup: true, locs: [{id: 'l1', town: 'Koko Shell', spot: ''}], lastLoc: 'l1',
      people: ['Ama', 'Esi', 'Yaa', 'Abena'].map((n, i) => ({id: 'w' + i, name: n, phone: '024111222' + i, loc: 'l1', note: ''})),
      cars: [{id: 'c1', date: d(25), label: 'Abidjan', items: [{id: 'i1', name: '', count: 40, price: 650}], costs: [], phase: 'giving'}],
      entries: [give('g0', 'w0', 20), give('g1', 'w1', 18), give('g2', 'w2', 0)]});
    commit(); });
  await tab('give');
  ok(await has('.faces.regs') && await has('.stock [data-act="carmenu"]'), 'Give bags: the names and the load card as always');
  // Give: Keep for her is under More
  await act('give', '[data-id="w3"]'); await p.waitForTimeout(150);
  ok(!(await has('[data-act="ghold"]')) && await has('.sheet [data-act="gmore"]') && await has('[data-act="gsave"]'), 'give sheet: no "Keep for her", a small "More"');
  await p.screenshot({path: OUT + '/1-give.png'});
  await act('gmore');
  ok(await has('[data-act="ghold"]'), 'More: "Keep for her" shows');
  await act('ghold'); ok(((await p.textContent('[data-act="gsave"]')) || '').startsWith('Hold'), 'and works: "Hold 3 bags"');
  await tab('give');
  // the load menu
  await act('carmenu', '[data-id="c1"]');
  const menu = async () => p.$$eval('.sheet [data-act]', els => els.map(e => e.dataset.act));
  const m1 = await menu();
  ok(['count', 'price', 'closecar', 'carmore'].every(a => m1.includes(a)) && !['counter', 'addcost', 'report', 'label'].some(a => m1.includes(a)), 'the load menu: Count the car, Price, Close load, More: ' + m1.join(','));
  await act('carmore'); const m2 = await menu();
  ok(['counter', 'addcost', 'report', 'label', 'closecar'].every(a => m2.includes(a)), 'More: every load option');
  // Take money: Remind and End of day under More, the Round button stays
  await tab('collect');
  ok(await has('.cacts [data-act="cmore"]') && !(await has('[data-act="remindall"]')) && await has('[data-act="round"]'), 'Take money: Remind is under More; the Round button stays');
  await p.screenshot({path: OUT + '/2-take.png'});
  await act('cmore'); ok(await has('.cacts [data-act="remindall"]'), 'More: Remind shows');
  // the Book
  await tab('book');
  ok(!(await has('[data-act="mom"]')) && !(await has('[data-act="bsort"]')) && await has('[data-act="settings"]') && await has('[data-act="backupsheet"]'), 'the Book: no Show Mom, no sort button; backup and Settings stay');
  await p.screenshot({path: OUT + '/3-book.png'});
  // Settings
  await act('settings');
  const c1 = await cards();
  ok(c1.startsWith('Easy to use|Your business|Places|') && !/Buying|Counting|Receipts|Sound/.test(c1) && /Keep your book safe\|Help\|Delete/.test(c1), 'Settings: Easy to use on top, the less used cards hidden: ' + c1);
  ok(await has('.scard:first-of-type [data-act="togglebig"]') && (await p.getAttribute('[data-act="togglesimple"]', 'aria-pressed')) === 'true', 'Simple app is on, with Big text beside it');
  await p.screenshot({path: OUT + '/4-settings.png'});
  await act('setmore'); ok(/Buying\|Counting\|Receipts\|Sound and voice/.test(await cards()), 'More settings: the rest show');
  // off: every button
  await act('togglesimple');
  ok(await p.evaluate(() => S.settings.simple === false), 'switched off');
  await tab('book'); ok(await has('[data-act="mom"]') && await has('[data-act="bsort"]'), 'the Book: Show Mom and sort are back');
  await tab('collect'); ok(await has('.cacts [data-act="remindall"]') && !(await has('[data-act="cmore"]')), 'Take money: Remind shows straight away');
  await tab('give'); await act('give', '[data-id="w3"]'); await p.waitForTimeout(150);
  ok(await has('[data-act="ghold"]') && !(await has('[data-act="gmore"]')), 'give sheet: Keep for her shows straight away');
  await tab('book'); await act('settings'); await act('togglesimple');
  ok(await p.evaluate(() => S.settings.simple === true) && !/Buying/.test(await cards()), 'switched on again: fewer buttons');
  // a small phone
  await p.setViewportSize({width: 320, height: 568}); await tab('collect');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'small phone: nothing sticks out');
  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', String(e.message).split('\n').slice(0, 10).join(' | ')); process.exit(2); });
