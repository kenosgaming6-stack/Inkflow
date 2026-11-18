// Take money always opens on the load you are working on, never on everybody: the open load even when nobody owes on it yet.
// All is one tap. Today follows the same rule.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
const fs = require('fs'), path = require('path'); const OUT = path.join(__dirname, 'out', 'takeload'); fs.mkdirSync(OUT, {recursive: true});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, reducedMotion: 'reduce', hasTouch: true, isMobile: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(150); };
  const txt = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const names = () => p.$$eval('#collist .row .name', els => els.map(e => e.textContent));
  const tab = async t => { await p.evaluate(t => { document.querySelector(`.tab[data-t="${t}"]`).click(); }, t); await p.waitForTimeout(200); };
  await p.goto(URL); await p.waitForTimeout(300);
  const seed = () => p.evaluate(() => { localStorage.clear(); const d = n => new Date(Date.now() - n * 864e5).toISOString();
    const give = (id, pid, car, item, n, bags) => ({id, date: d(n), type: 'give', pid, carId: car, itemId: item, bags, price: 650, amount: bags * 650, loc: 'l1', off: d(n), rcpt: true});
    S = normalize({v: 4, settings: {item: 'Onions', unit: 'bag', price: 650}, setup: true, locs: [{id: 'l1', town: 'Koko Shell', spot: ''}], lastLoc: 'l1',
      people: ['Ama', 'Esi', 'Efua', 'Abena'].map((n, i) => ({id: 'w' + i, name: n, phone: '', loc: 'l1', note: ''})),
      cars: [{id: 'c1', date: d(30), label: 'Wankai', items: [{id: 'i1', name: '', count: 40, price: 650}], costs: [], phase: 'out'}, {id: 'c2', date: d(1), label: 'Abidjan', items: [{id: 'j1', name: '', count: 40, price: 650}], costs: [], phase: 'giving'}],
      entries: [give('g0', 'w0', 'c1', 'i1', 25, 3), give('g1', 'w1', 'c1', 'i1', 24, 2), give('g2', 'w2', 'c1', 'i1', 23, 1), give('g3', 'w3', 'c2', 'j1', 0, 3)]});
    V.stack = []; V.tab = 'give'; V.fCar = undefined; commit(); render(); });
  await seed(); await p.waitForTimeout(250);
  // Abena has 3 bags from Abidjan; three women owe on the old load
  await tab('collect');
  ok(await p.evaluate(() => V.fCar === 'c2') && (await names()).join() === 'Abena', 'Take money opens on Abidjan: only Abena (3 bags), not the three women of the old load');
  ok((await txt('.csum .cl small')).includes('Abidjan') && (await txt('.csum .cl b')) === '₵1,950', '"Still owed · Abidjan" ₵1,950');
  ok((await txt('.morebtn')).includes('3 more women owe ₵3,900 on other loads · See all'), 'a quiet line: "3 more women owe ₵3,900 on other loads · See all"');
  await p.screenshot({path: OUT + '/1-load.png'});
  // All is one tap
  await p.click('.morebtn'); await p.waitForTimeout(150);
  ok((await names()).length === 4 && await p.evaluate(() => V.fCar === ''), 'See all: everybody, 4 women');
  // and it does not stay on All
  await tab('give'); await tab('collect');
  ok(await p.evaluate(() => V.fCar === 'c2') && (await names()).join() === 'Abena', 'leave and come back: on Abidjan again, not on All');
  // nobody owes on the open load yet: still Abidjan, with the other loads one tap away
  await p.evaluate(() => { S.entries = S.entries.filter(e => e.id !== 'g3'); commit(); V.fCar = undefined; }); await tab('give'); await tab('collect');
  ok(await p.evaluate(() => V.fCar === 'c2') && (await names()).length === 0 && (await txt('#collist')).includes('Nobody owes on Abidjan yet'), 'no one owes on Abidjan yet: it still opens on Abidjan, "Nobody owes on Abidjan yet"');
  ok((await txt('.morebtn')).includes('3 more women owe') && (await p.$$('.loadchips .chip')).length === 3 && (await txt('.loadchips .chip.on')).includes('Abidjan'), 'Abidjan is a chip (selected) next to All and Wankai; the others are one tap away');
  await p.screenshot({path: OUT + '/2-empty-load.png'});
  await act('fcar', '[data-id="c1"]');
  ok((await names()).length === 3, 'tap Wankai: its three women');
  // a closed load that gets fully paid gives way to the open load, not to All
  await p.evaluate(() => { const d = new Date().toISOString(); S.entries.push({id: 'pa', date: d, type: 'pay', pid: 'w0', amount: 1950, method: 'cash'}, {id: 'pb', date: d, type: 'pay', pid: 'w1', amount: 1300, method: 'cash'}, {id: 'pc', date: d, type: 'pay', pid: 'w2', amount: 650, method: 'cash'}); commit(); render(); });
  ok(await p.evaluate(() => V.fCar === 'c2'), 'Wankai fully paid: back to Abidjan, not All');
  // after a reload
  await p.evaluate(() => { const d = new Date().toISOString(); S.entries.push({id: 'g9', date: d, type: 'give', pid: 'w3', carId: 'c2', itemId: 'j1', bags: 2, price: 650, amount: 1300, loc: 'l1', off: d, rcpt: true}); commit(); });
  await p.reload(); await p.waitForTimeout(500); await tab('collect');
  ok(await p.evaluate(() => V.fCar === 'c2') && (await names()).join() === 'Abena', 'after closing and opening the app: still Abidjan');
  // no open load: the newest load with money out
  await p.evaluate(() => { const d = new Date().toISOString(); S.cars[1].phase = 'out'; S.entries.push({id: 'pz', date: d, type: 'pay', pid: 'w3', amount: 1300, method: 'cash'}, {id: 'g10', date: d, type: 'give', pid: 'w2', carId: 'c1', itemId: 'i1', bags: 1, price: 650, amount: 650, loc: 'l1', off: d, rcpt: true}); commit(); V.fCar = undefined; });
  await tab('give'); await tab('collect');
  ok(await p.evaluate(() => V.fCar === 'c1'), 'no open load: the newest load with money out (Wankai)');
  // Today
  await seed(); await p.evaluate(() => { S.settings.simple = true; commit(); V.tab = 'home'; render(); }); await p.waitForTimeout(250);
  ok((await txt('.hcard.take')).includes('Abidjan · 1 woman owes you') && (await txt('.hcard.take .hn')) === '₵1,950', 'Today: "Abidjan · 1 woman owes you" ₵1,950');
  ok((await txt('.hmore')).includes('3 more women owe ₵3,900 on other loads · See all'), 'Today: the same quiet line for the rest');
  await p.screenshot({path: OUT + '/3-today.png'});
  await act('homeround'); ok((await txt('.top .title b')) === 'Round · 1 of 1' && (await txt('.rname')) === 'Abena', 'Start round: Abena only (Abidjan)');
  await act('roundstop');
  await act('homeall'); ok(await p.evaluate(() => V.tab === 'collect' && V.fCar === '') && (await names()).length === 4, 'See all on Today: Take money on All, 4 women');
  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', String(e.message).split('\n').slice(0, 10).join(' | ')); process.exit(2); });
