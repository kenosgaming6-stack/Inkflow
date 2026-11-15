// End of day: "You should have ₵X" = today's cash payments + today's cash sales (not MoMo). Count with the notes;
// All there / Short / Extra; the last count shows under the button.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
const fs = require('fs'), path = require('path'); const OUT = path.join(__dirname, 'out', 'end-of-day'); fs.mkdirSync(OUT, {recursive: true});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, reducedMotion: 'reduce', hasTouch: true, isMobile: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(90); };
  const txt = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const notes = async list => { for (const n of list) await act('tnote', `[data-n="${n}"]`); };
  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(() => { localStorage.clear(); const now = new Date().toISOString(), old = new Date(Date.now() - 3 * 864e5).toISOString();
    S = normalize({v: 4, settings: {item: 'Onions', unit: 'bag', price: 650}, setup: true, locs: [{id: 'l1', town: 'Koko Shell', spot: ''}], lastLoc: 'l1',
      people: [{id: 'a', name: 'Ama', phone: '', loc: 'l1', note: ''}], cars: [{id: 'c1', date: old, label: 'Wankai', items: [{id: 'i1', name: '', count: 20, price: 650}], costs: [], phase: 'giving'}],
      entries: [{id: 'g1', date: old, type: 'give', pid: 'a', carId: 'c1', itemId: 'i1', bags: 4, price: 650, amount: 2600, loc: 'l1', off: old, rcpt: true}]});
    V.stack = []; V.tab = 'collect'; commit(); render(); });
  await p.waitForTimeout(200);
  ok(!(await p.$('[data-act="eod"]')), 'no cash today and never counted: no End of day button');
  // today: ₵500 cash payment, ₵300 MoMo, one cash sale of ₵650
  await p.evaluate(() => { const now = new Date().toISOString();
    S.entries.push({id: 'p1', date: now, type: 'pay', pid: 'a', amount: 500, method: 'cash'}, {id: 'p2', date: now, type: 'pay', pid: 'a', amount: 300, method: 'momo'}, {id: 'c1s', date: now, type: 'cash', pid: null, carId: 'c1', itemId: 'i1', bags: 1, price: 650, amount: 650, loc: 'l1'}); commit(); render(); });
  ok((await txt('[data-act="eod"]')).startsWith('End of day'), 'cash came in today: the End of day button shows');
  await act('eod');
  ok((await txt('.sheet .tillres b')) === '₵1,150' && (await txt('.sheet .tillres small >> nth=1')).includes('₵500 paid in cash') && (await txt('.sheet .tillres')).includes('₵650 cash sales'), 'You should have ₵1,150 (₵500 paid in cash + ₵650 cash sales; the MoMo is not counted)');
  await notes([200, 200, 200, 200, 200, 100, 50]);
  ok((await txt('.sheet .disp .v')) === '₵1,150' && (await p.$$('.sheet .nstack i')).length === 7, 'counting with the notes: ₵1,150, the notes stack up');
  await p.screenshot({path: OUT + '/1-count.png'});
  await act('tilldone'); await p.waitForTimeout(100);
  ok((await txt('.sheet .tillres b')) === 'All there ✓' && await p.evaluate(() => getComputedStyle(document.querySelector('.sheet .tillres b')).color) === 'rgb(18, 128, 74)', 'All there ✓ in green');
  await p.screenshot({path: OUT + '/2-all-there.png'});
  await act('sheetclose');
  ok((await txt('[data-act="eod"] small')) === 'Today: All there ✓', 'under the button: "Today: All there ✓"');
  // short
  await act('eod'); await notes([200, 200, 200, 200, 200]); await act('tilldone');
  ok((await txt('.sheet .tillres b')) === 'Short ₵150' && await p.evaluate(() => getComputedStyle(document.querySelector('.sheet .tillres b')).color) === 'rgb(209, 43, 54)', 'counted ₵1,000: Short ₵150 in red');
  await p.screenshot({path: OUT + '/3-short.png'});
  await act('sheetclose');
  // extra
  await act('eod'); await notes([200, 200, 200, 200, 200, 200]); await act('tilldone');
  ok((await txt('.sheet .tillres b')) === '₵50 extra', 'counted ₵1,200: ₵50 extra');
  await act('sheetclose');
  // the count does not touch anything else
  ok(await p.evaluate(() => ledger('a').bal === 1800 && S.entries.filter(e => e.type === 'till').length === 3), 'her balance is untouched; three counts are kept');
  await p.evaluate(() => push({v: 'person', pid: 'a'})); await p.waitForTimeout(150);
  ok(!(await txt('#mid')).includes('All there'), 'counts do not show on her page');
  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', e.message.split('\n').slice(0, 4).join(' | ')); process.exit(2); });
