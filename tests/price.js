// Prices that move: a price for ONE sale (3.75 when the load is 3.80), shown on the line, on her page and in the Load report,
// editable afterwards as a correction line. A . key on the price pads; Paid all pays pesewas exactly.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
const fs = require('fs'), path = require('path'); const OUT = path.join(__dirname, 'out', 'price'); fs.mkdirSync(OUT, {recursive: true});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, reducedMotion: 'reduce', hasTouch: true, isMobile: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(150); };
  const keys = async s => { for (const k of s) await act('key', `[data-k="${k}"]`); };
  const txt = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const has = sel => p.evaluate(sel => !!document.querySelector(sel), sel);
  const give = (id, extra) => p.evaluate(([id, extra]) => { openGive(id); if (extra) Object.assign(V.g, extra); }, [id, extra]);
  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(() => { localStorage.clear(); const d = new Date().toISOString();
    S = normalize({v: 4, settings: {item: 'Onions', unit: 'bag', price: 3.8}, setup: true, locs: [{id: 'l1', town: 'Koko Shell', spot: ''}], lastLoc: 'l1',
      people: ['Ama', 'Esi', 'Yaa'].map((n, i) => ({id: 'w' + i, name: n, phone: '', loc: 'l1', note: ''})),
      cars: [{id: 'c1', date: d, label: 'Abidjan', items: [{id: 'i1', name: '', count: 100, price: 3.8, col: 'red'}], costs: [], phase: 'giving'}], entries: []});
    V.stack = []; V.tab = 'give'; commit(); render(); });
  await p.waitForTimeout(250);
  // the give panel: the price button, then 3.75
  await give('w0'); await p.waitForTimeout(200);
  ok((await txt('.sheet [data-act="gprice"]')) === '₵3.80 each' && !(await has('.sheet [data-act="gprice"].on')), 'the price button: "₵3.80 each" (the load price)');
  await act('gk', '.ktile .kt').catch(() => {}); // (the tile is a button with data-act gk)
  await p.click('.sheet .ktile .kt'); await p.click('.sheet .ktile .kt'); await p.waitForTimeout(100);
  await act('gprice');
  ok((await txt('.sheet h3')) === 'Price for one bag' && (await txt('.sheet .small')).includes('List price ₵3.80') && await has('.sheet [data-act="key"][data-k="."]'), 'tap it: "Price for one bag", the list price, and a . key on the pad');
  await keys('3.75');
  ok((await txt('.sheet .disp .v')) === '₵3.75' && (await txt('.sheet .disp .tape')) === '3.75', 'typing 3.75 shows ₵3.75');
  await keys('9'); await keys('.');
  ok((await txt('.sheet .disp .v')) === '₵3.75', 'a third decimal and a second point are ignored');
  await p.screenshot({path: OUT + '/1-pad.png'});
  await act('spuse');
  ok((await txt('.sheet [data-act="gprice"]')) === '₵3.75 each' && await has('.sheet [data-act="gprice"].on'), 'back on the give panel: "₵3.75 each", marked as changed');
  const bags = await p.evaluate(() => V.g.bags);
  ok((await txt('.sheet .ktot')).includes('₵') && await p.evaluate(() => Math.abs(sum(Object.values(V.g.kinds), x => x) * 3.75 - Number(document.querySelector('.sheet .ktot b').textContent.replace(/[^0-9.]/g, ''))) < 0.01), 'the total uses 3.75: ' + (await txt('.sheet .ktot b')));
  await p.screenshot({path: OUT + '/2-give.png'});
  await act('gsave'); await p.waitForTimeout(300);
  const e1 = await p.evaluate(() => S.entries.find(e => e.type === 'give' && e.pid === 'w0'));
  ok(e1.price === 3.75 && e1.list === 3.8 && Math.abs(e1.amount - e1.bags * 3.75) < 0.001, 'saved: price 3.75, list 3.80, amount ' + e1.amount);
  ok(await p.evaluate(() => S.cars[0].items[0].price === 3.8), 'the load price is still 3.80');
  // the next customer pays the normal price: no list kept
  await give('w1'); await p.waitForTimeout(900); await act('gsave'); await p.waitForTimeout(300);
  const e2 = await p.evaluate(() => S.entries.find(e => e.type === 'give' && e.pid === 'w1'));
  ok(e2.price === 3.8 && e2.list === undefined, 'the next customer: 3.80, nothing extra kept');
  // the lines show it
  ok((await txt('.lines .row .offtag')).includes('off'), 'her line shows a tag: "' + (await txt('.lines .row .offtag')) + '"');
  ok((await p.$$('.lines .offtag')).length === 1, 'only the changed line has a tag');
  await p.screenshot({path: OUT + '/3-list.png'});
  // her page
  await p.evaluate(() => { push({v: 'person', pid: 'w0'}); }); await p.waitForTimeout(200);
  ok((await txt('.lines')).includes('₵3.75 each (list ₵3.80)'), 'her page: "₵3.75 each (list ₵3.80)"');
  await p.screenshot({path: OUT + '/4-her.png'});
  // change the price afterwards: 3.70
  await p.click('.lines .row[data-act="entry"]'); await p.waitForTimeout(200);
  ok((await txt('.sheet [data-act="esprice"]')).includes('₵3.75 each') && (await txt('.sheet [data-act="esprice"]')).includes('list ₵3.80'), 'tap her line: the price button "₵3.75 each · list ₵3.80"');
  await act('esprice'); await keys('3.7'); await act('spuse');
  ok((await txt('[data-act="essave"]')).includes('₵3.75 → ₵3.70'), 'the save button says "Change ₵3.75 → ₵3.70"');
  await act('essave'); await p.waitForTimeout(250);
  const fx = await p.evaluate(() => { const g = S.entries.filter(e => e.type === 'give' && e.pid === 'w0'); const live = g.filter(e => !C().undone.has(e.id)); return {n: g.length, live: live.length, price: live[0].price, list: live[0].list, fixes: !!live[0].fixes, old: g.find(e => C().undone.has(e.id)).price, bal: ledger('w0').bal, bags: live[0].bags}; });
  ok(fx.n === 2 && fx.live === 1 && fx.price === 3.7 && fx.list === 3.8 && fx.fixes && fx.old === 3.75, 'a correction line: the old 3.75 line is kept, crossed out; the new line is 3.70 (list 3.80)');
  ok(Math.abs(fx.bal - fx.bags * 3.7) < 0.001, 'she owes ' + fx.bal + ' = ' + fx.bags + ' × 3.70');
  ok((await txt('.lines')).includes('corrected from') && (await txt('.lines')).includes('₵3.75'), 'her page says what it was corrected from');
  // back to the list price: nothing extra kept
  await p.click('.lines .row[data-act="entry"]'); await p.waitForTimeout(200); await act('esprice'); await act('spreset');
  await act('essave'); await p.waitForTimeout(250);
  const fy = await p.evaluate(() => { const live = S.entries.filter(e => e.type === 'give' && e.pid === 'w0' && !C().undone.has(e.id)); return {price: live[0].price, list: live[0].list}; });
  ok(fy.price === 3.8 && fy.list === undefined, 'List price again: 3.80, no list kept');
  // cash sale at 3.65
  await p.evaluate(() => { V.stack = []; V.tab = 'give'; render(); }); await act('cash'); await p.waitForTimeout(200);
  await p.click('.sheet .ktile .kt'); await act('csprice'); await keys('3.65'); await act('spuse');
  ok((await txt('.sheet [data-act="csprice"]')) === '₵3.65 each', 'the cash panel has the price button too: "₵3.65 each"');
  await act('cssave'); await p.waitForTimeout(300);
  const cs = await p.evaluate(() => S.entries.find(e => e.type === 'cash'));
  ok(cs.price === 3.65 && cs.list === 3.8 && Math.abs(cs.amount - cs.bags * 3.65) < 0.001, 'cash sale saved at 3.65 (list 3.80): amount ' + cs.amount);
  ok(!!(await p.$('.cashrow .offtag')), 'the cash line shows the tag too');
  // the Load report
  await p.evaluate(() => { push({v: 'report', cid: 'c1'}); }); await p.waitForTimeout(250);
  ok((await txt('.sect')).includes('Price changes · 1 sale'), 'the Load report: "Price changes · 1 sale" (Ama is back at the list price)');
  ok((await txt('.lines')).includes('₵3.65 each, list ₵3.80'), 'it lists the cash sale: ₵3.65 each, list ₵3.80');
  await p.screenshot({path: OUT + '/5-report.png'});
  // several kinds: the price button asks which
  await p.evaluate(() => { closeSheet(); V.stack = []; S.cars[0].items.push({id: 'i2', name: '', count: 50, price: 3.5, col: 'yellow'}); commit(); V.tab = 'give'; render(); });
  await give('w2'); await p.waitForTimeout(200);
  ok((await txt('.sheet [data-act="gprice"]')) === 'Change price', 'two kinds: the button says "Change price"');
  await p.click('.sheet .ktile:nth-child(1) .kt'); await p.waitForTimeout(100); await p.click('.sheet .ktile:nth-child(2) .kt'); await p.waitForTimeout(100);
  await act('gprice'); ok((await txt('.sheet h3')) === 'Which price?' && (await p.$$('.sheet [data-act="spick"]')).length === 2, 'it asks which kind first');
  await act('spick', '[data-i="i2"]'); await keys('3.4'); await act('spuse');
  ok((await txt('.sheet [data-act="gprice"]')) === 'Price changed', 'one kind changed: "Price changed"');
  await p.waitForTimeout(900); await act('gsave'); await p.waitForTimeout(300);
  const es = await p.evaluate(() => S.entries.filter(e => e.type === 'give' && e.pid === 'w2'));
  ok(es.length === 2 && es.find(e => e.itemId === 'i2').price === 3.4 && es.find(e => e.itemId === 'i2').list === 3.5 && es.find(e => e.itemId === 'i1').list === undefined, 'only the changed kind keeps a list price');
  // Paid all pays the exact balance, pesewas included
  await p.evaluate(() => { V.stack = []; V.tab = 'collect'; V.fCar = 'c1'; render(); }); await p.waitForTimeout(200);
  const owe = await p.evaluate(() => ledger('w2').bal);
  await p.evaluate(() => openPay('w2', {ctx: 'collect', carId: 'c1'})); await p.waitForTimeout(200); await act('payall');
  ok(await p.evaluate(o => Math.abs(exprNum(V.pay.ex) - o) < 0.001, owe) && String(owe).includes('.'), 'All ₵' + owe + ': the pay pad takes the exact balance');
  await act('paydone'); await p.waitForTimeout(250);
  ok(await p.evaluate(() => Math.abs(ledger('w2').bal) < 0.001), 'paid: she owes nothing');
  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', String(e.message).split('\n').slice(0, 10).join(' | ')); process.exit(2); });
