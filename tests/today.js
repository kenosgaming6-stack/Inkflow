// Today (Simple app): the app opens on it. How many women owe you with a huge Start round button, the bags left with a huge
// Give bags button, what came in today. The lists show only after a tap.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
const fs = require('fs'), path = require('path'); const OUT = path.join(__dirname, 'out', 'today'); fs.mkdirSync(OUT, {recursive: true});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, reducedMotion: 'reduce', hasTouch: true, isMobile: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(150); };
  const txt = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const has = sel => p.evaluate(sel => !!document.querySelector(sel), sel);
  const tabs = () => p.$$eval('.tabs .tab span:not(.badge):not(.tabdot)', els => els.map(e => e.textContent));
  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(() => { localStorage.clear(); const d = n => new Date(Date.now() - n * 864e5).toISOString();
    const give = (id, pid, n, bags) => ({id, date: d(n), type: 'give', pid, carId: 'c1', itemId: 'i1', bags, price: 650, amount: bags * 650, loc: 'l1', off: d(n), rcpt: true});
    S = normalize({v: 4, settings: {item: 'Onions', unit: 'bag', price: 650, simple: true, seller: 'Siddick'}, setup: true, locs: [{id: 'l1', town: 'Koko Shell', spot: ''}], lastLoc: 'l1',
      people: ['Ama', 'Esi', 'Yaa'].map((n, i) => ({id: 'w' + i, name: n, phone: '', loc: 'l1', note: ''})),
      cars: [{id: 'c1', date: d(20), label: 'Abidjan', items: [{id: 'i1', name: '', count: 40, price: 650}], costs: [], phase: 'giving'}],
      entries: [give('g0', 'w0', 18, 3), give('g1', 'w1', 2, 2), give('g2', 'w2', 0, 1), {id: 'p0', date: d(0), type: 'pay', pid: 'w2', amount: 650, method: 'cash'}]});
    commit(); });
  await p.reload(); await p.waitForTimeout(500);
  ok(await p.evaluate(() => V.tab === 'home') && (await txt('.band')).includes('Today'), 'the Simple app opens on Today');
  ok((await tabs()).join('|') === 'Today|Give bags|Take money|Book', 'four tabs: Today, Give bags, Take money, Book');
  ok((await txt('.top .title b')) === 'Good morning, Siddick' || /^Good (morning|afternoon|evening), Siddick$/.test(await txt('.top .title b')), 'a greeting with the name');
  ok((await txt('.hcard.take')).includes('2 women owe you') && (await txt('.hcard.take .hn')) === '₵3,250', 'the take card: "2 women owe you" and ₵3,250 (Ama ₵1,950 + Esi ₵1,300)');
  ok((await txt('[data-act="homeround"]')).includes('Start round') && await p.evaluate(() => document.querySelector('[data-act="homeround"]').getBoundingClientRect().height >= 60), 'a huge "Start round" button');
  ok((await txt('.hcard.give')).includes('Abidjan') && (await txt('.hcard.give .hn')) === '34 left' && (await txt('.hcard.give [data-act="tab"]')).includes('Give bags'), 'the give card: Abidjan, 34 left, "Give bags"');
  ok(await has('.hcard.give .hico svg') && (await txt('.htoday')).includes('₵650'), 'the bag drawn on it, and "In today ₵650"');
  ok(!(await has('#collist')) && !(await has('.stock')), 'no lists on Today');
  await p.screenshot({path: OUT + '/1-today.png'});
  // Start round: everyone who owes, then back to Today
  await act('homeround');
  ok((await txt('.top .title b')) === 'Round · 1 of 2', 'Start round: the round, 2 women');
  await act('roundstop');
  ok(await p.evaluate(() => V.tab === 'home') && (await txt('.band')).includes('Today'), 'leaving the round: back on Today');
  // Give bags: the give tab
  await p.click('.hcard.give [data-act="tab"]'); await p.waitForTimeout(150); 
  ok(await p.evaluate(() => V.tab === 'give') && await has('.stock'), 'Give bags: the Give tab');
  await act('tab', '[data-t="home"]'); ok(await p.evaluate(() => V.tab === 'home'), 'the Today tab brings you back');
  // nobody owes, no load
  await p.evaluate(() => { S.entries.push({id: 'pp0', date: new Date().toISOString(), type: 'pay', pid: 'w0', amount: 1950, method: 'cash'}, {id: 'pp1', date: new Date().toISOString(), type: 'pay', pid: 'w1', amount: 1300, method: 'cash'}); S.cars[0].phase = 'out'; commit(); render(); });
  ok((await txt('.hcard.take')).includes('Nobody owes you') && !(await has('[data-act="homeround"]')), 'all paid: "Nobody owes you", no Start round');
  ok((await txt('.hcard.give')).includes('No load yet') && await has('.hcard.give [data-act="newcar"]'), 'no open load: "No load yet" and "New load"');
  await p.click('.hcard.give [data-act="newcar"]'); await p.waitForTimeout(150); ok((await txt('.q')).includes('Take a photo') || await has('[data-act="wnophoto"]'), 'New load starts the wizard');
  await p.evaluate(() => { V.stack = []; V.w = null; render(); });
  // turn Simple off: no Today
  await p.evaluate(() => { S.settings.simple = false; commit(); render(); });
  ok(await p.evaluate(() => V.tab === 'give') && (await tabs()).join('|') === 'Give bags|Take money|Book', 'Simple off: no Today tab, and you are on Give bags');
  // a small phone
  await p.evaluate(() => { S.settings.simple = true; S.cars[0].phase = 'giving'; S.entries = S.entries.filter(e => !/^pp/.test(e.id)); V.tab = 'home'; commit(); render(); });
  await p.setViewportSize({width: 320, height: 568}); await p.waitForTimeout(250);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.querySelector('[data-act="homeround"]').getBoundingClientRect().bottom <= innerHeight && document.querySelector('.hcard.give [data-act="tab"]').getBoundingClientRect().bottom <= document.querySelector('.tabs').getBoundingClientRect().top + 1), 'small phone: both big buttons are on screen');
  await p.screenshot({path: OUT + '/2-small.png'});
  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', String(e.message).split('\n').slice(0, 10).join(' | ')); process.exit(2); });
