// The collect round: one woman at a time. Paid all is one tap; Paid some uses the money pad; Not today sets a pay date;
// Skip and Back; Remove for a mistaken tap; a summary at the end; a round on one load pays that load.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
const fs = require('fs'), path = require('path'); const OUT = path.join(__dirname, 'out', 'round'); fs.mkdirSync(OUT, {recursive: true});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, reducedMotion: 'reduce', hasTouch: true, isMobile: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(110); };
  const txt = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const who = () => txt('.rname');
  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(() => { localStorage.clear(); const d = n => new Date(Date.now() - n * 864e5).toISOString();
    const give = (id, pid, car, bags, price, n) => ({id, date: d(n), type: 'give', pid, carId: car, itemId: car === 'c1' ? 'i1' : 'j1', bags, price, amount: bags * price, loc: 'l1', off: d(n), rcpt: true});
    S = normalize({v: 4, settings: {item: 'Onions', unit: 'bag', price: 650}, setup: true, locs: [{id: 'l1', town: 'Koko Shell', spot: ''}], lastLoc: 'l1',
      people: ['Ama', 'Esi', 'Yaa', 'Akosua'].map((n, i) => ({id: 'w' + i, name: n, phone: '', loc: 'l1', note: ''})),
      cars: [{id: 'c1', date: d(30), label: 'Old', items: [{id: 'i1', name: '', count: 40, price: 600}], costs: [], phase: 'out'}, {id: 'c2', date: d(5), label: 'Abidjan', items: [{id: 'j1', name: '', count: 40, price: 650}], costs: [], phase: 'out'}],
      entries: [give('g0', 'w0', 'c2', 3, 650, 4), give('g1', 'w1', 'c2', 2, 650, 3), give('g2', 'w2', 'c2', 1, 650, 2), give('g3', 'w3', 'c2', 4, 650, 1), give('g4', 'w0', 'c1', 1, 600, 25)]});
    V.stack = []; V.tab = 'collect'; V.fCar = ''; commit(); render(); });
  await p.waitForTimeout(200);
  ok(!!(await p.$('[data-act="round"]')) && (await txt('[data-act="round"]')) === 'Round', 'Take money has a green Round button');
  const order = await p.$$eval('#collist .row .name', els => els.map(e => e.textContent));
  await act('round');
  ok((await txt('.top .title b')) === 'Round · 1 of 4' && await who() === order[0], `the round starts with the first woman on the list (${order[0]}), 1 of 4`);
  ok((await txt('.rowe b')).startsWith('₵') && !!(await p.$('[data-act="rpaid"]')) && (await txt('[data-act="rpaid"]')).startsWith('Paid all'), 'her name big, what she owes big, and "Paid all · ₵…"');
  await p.screenshot({path: OUT + '/1-woman.png'});
  // Paid all: one tap
  const first = order[0], owe1 = await p.evaluate(n => ledger(S.people.find(x => x.name === n).id).bal, first);
  await act('rpaid');
  ok(await p.evaluate(([n, a]) => { const pp = S.entries.filter(e => e.type === 'pay'); return pp.length === 1 && pp[0].amount === a && person(pp[0].pid).name === n && ledger(pp[0].pid).bal === 0; }, [first, owe1]), `Paid all: one tap saves ₵${owe1} for ${first}; she owes nothing now`);
  ok((await txt('.top .title b')) === 'Round · 2 of 4' && await who() === order[1], 'and the next woman is on screen');
  // Paid some: the money pad
  await act('rsome'); await p.click('[data-act="note"][data-n="200"]'); await p.waitForTimeout(80); await act('paydone'); await p.waitForTimeout(100);
  ok(!!(await p.$('.sheet .proof')), 'Paid some: the money pad, then the proof for her');
  await act('pfdone');
  ok((await txt('.top .title b')) === 'Round · 3 of 4', 'Done on the proof: the round moves on');
  // Not today: a pay date
  const third = await who();
  await act('rdate'); await act('prsave');
  ok(await p.evaluate(n => S.entries.some(e => e.type === 'promise' && person(e.pid).name === n), third) && (await txt('.top .title b')) === 'Round · 4 of 4', 'Not today: a pay date is saved and the round moves on');
  // Back shows what happened, Remove fixes a mistaken tap
  await act('rback'); ok((await txt('.rres')).startsWith('Pay date'), 'Back: her result shows (Pay date …)');
  await act('rback'); ok((await txt('.rres')).includes('Paid ₵200'), 'Back again: "Paid ₵200 ✓"');
  await act('rback'); ok((await txt('.rres')).startsWith('Paid ₵') && !!(await p.$('[data-act="rundo"]')), 'the first woman: paid, with "Remove this payment"');
  await act('rundo');
  ok(await p.evaluate(n => ledger(S.people.find(x => x.name === n).id).bal > 0, first) && !!(await p.$('[data-act="rpaid"]')), 'Remove: the payment is gone, she owes again, and Paid all is back');
  await act('rpaid'); await act('rskip'); await act('rskip');
  // MoMo
  await act('rmethod', '[data-m="momo"]'); await act('rpaid');
  ok(await p.evaluate(() => S.entries.filter(e => e.type === 'pay').slice(-1)[0].method === 'momo'), 'the MoMo switch: Paid all is saved as MoMo');
  ok((await txt('.top .title b')) === 'Round done' && (await txt('.rsum')).includes('Paid'), 'the end: "Round done" with what was paid');
  await p.waitForTimeout(600); ok(!!(await p.$('.celebrate')), 'a load that got fully paid during the round is celebrated at the end, not in the middle');
  await act('celclose');
  await p.screenshot({path: OUT + '/2-done.png'});
  await act('roundstop');
  ok(await p.evaluate(() => V.tab === 'collect' && !cur()), 'Done: back on Take money');
  // a round on one load pays that load only
  await p.evaluate(() => { const d = new Date().toISOString(); S.entries.push({id: 'g9', date: d, type: 'give', pid: 'w1', carId: 'c1', itemId: 'i1', bags: 2, price: 600, amount: 1200, loc: 'l1', off: d, rcpt: true}); commit(); V.fCar = 'c1'; render(); });
  await act('round');
  ok((await txt('.top .title small')).includes('Old'), 'a round on one load says which load');
  const n1 = await who(); const oweLoad = await p.evaluate(n => roundOwe(S.people.find(x => x.name === n).id, 'c1'), n1);
  await act('rpaid');
  ok(await p.evaluate(([n, a]) => { const e = S.entries.filter(x => x.type === 'pay').slice(-1)[0]; return e.amount === a && e.carId === 'c1' && person(e.pid).name === n; }, [n1, oweLoad]), `Paid all on that load pays what she owes on it (₵${oweLoad}), from that load`);
  await act('roundstop');
  // a small phone
  await p.evaluate(() => { const d = new Date().toISOString(); S.entries.push({id: 'g10', date: d, type: 'give', pid: 'w2', carId: 'c2', itemId: 'j1', bags: 2, price: 650, amount: 1300, loc: 'l1', off: d, rcpt: true}); commit(); V.fCar = ''; render(); });
  await p.setViewportSize({width: 320, height: 568}); await p.waitForTimeout(150); await act('round'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.querySelector('[data-act="rpaid"]').getBoundingClientRect().bottom <= innerHeight), 'small phone: the round fits and Paid all is on screen');
  await p.screenshot({path: OUT + '/3-small.png'});
  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', String(e.message).split('\n').slice(0, 14).join(' | ')); process.exit(2); });
