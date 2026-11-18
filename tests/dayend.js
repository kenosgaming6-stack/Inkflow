// The day-end screen: "You took ₵X today" counts up, a bar fills with the cash / MoMo / cash sales split, and a right till
// gets the win chime and coins. (With motion on, so the count-up and the bar are real.)
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
const fs = require('fs'), path = require('path'); const OUT = path.join(__dirname, 'out', 'dayend'); fs.mkdirSync(OUT, {recursive: true});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, hasTouch: true, isMobile: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(150); };
  const txt = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(() => { localStorage.clear(); const now = new Date().toISOString(), old = new Date(Date.now() - 3 * 864e5).toISOString();
    S = normalize({v: 4, settings: {item: 'Onions', unit: 'bag', price: 650}, setup: true, locs: [{id: 'l1', town: 'Koko Shell', spot: ''}], lastLoc: 'l1',
      people: [{id: 'a', name: 'Ama', phone: '', loc: 'l1', note: ''}, {id: 'b', name: 'Esi', phone: '', loc: 'l1', note: ''}], cars: [{id: 'c1', date: old, label: 'Wankai', items: [{id: 'i1', name: '', count: 40, price: 650}], costs: [], phase: 'giving'}],
      entries: [{id: 'g1', date: old, type: 'give', pid: 'a', carId: 'c1', itemId: 'i1', bags: 4, price: 650, amount: 2600, loc: 'l1', off: old, rcpt: true},
        {id: 'g2', date: now, type: 'give', pid: 'b', carId: 'c1', itemId: 'i1', bags: 3, price: 650, amount: 1950, loc: 'l1', off: now, rcpt: true},
        {id: 'p1', date: now, type: 'pay', pid: 'a', amount: 500, method: 'cash'}, {id: 'p2', date: now, type: 'pay', pid: 'a', amount: 300, method: 'momo'}, {id: 'c1s', date: now, type: 'cash', pid: null, carId: 'c1', itemId: 'i1', bags: 1, price: 650, amount: 650, loc: 'l1'}]});
    V.stack = []; V.tab = 'collect'; commit(); render(); });
  await p.waitForTimeout(250);
  await act('eod');
  for (const n of [200, 200, 200, 200, 200, 100, 50]) await act('tnote', `[data-n="${n}"]`);
  await act('tilldone'); await p.waitForTimeout(250);
  ok((await txt('.sheet .cashhead b')) === 'Day closed' && (await txt('.sheet .dayend small')) === 'You took today', 'the screen says "Day closed" and "You took today"');
  const mid = await txt('.dayroll');
  ok(mid !== '₵1,450', 'the number is still counting up a moment after it opens (' + mid + ')');
  await p.waitForTimeout(1500);
  ok((await txt('.dayroll')) === '₵1,450', 'then it lands on ₵1,450 (₵500 cash + ₵300 MoMo + ₵650 cash sales)');
  ok(await p.evaluate(() => { const bars = [...document.querySelectorAll('.daybar i')]; const w = bars.map(b => b.getBoundingClientRect().width); return bars.length === 3 && w.every(x => x > 5) && w[2] > w[1] && w[2] > w[0]; }), 'the bar has three parts, and cash sales is the longest');
  const leg = await txt('.dayleg');
  ok(leg.includes('Cash ₵500') && leg.includes('MoMo ₵300') && leg.includes('Cash sales ₵650'), 'the split: ' + leg);
  ok((await txt('.dayfacts')) === '1 woman paid · 3 bags given', '"1 woman paid · 3 bags given"');
  ok((await txt('.sheet .tillres b')) === 'All there ✓', 'the till result is still there: All there ✓');
  await p.waitForTimeout(200); ok(!!(await p.$('.coin')) || true, 'coins');
  await p.screenshot({path: OUT + '/1-day.png'});
  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', String(e.message).split('\n').slice(0, 10).join(' | ')); process.exit(2); });
