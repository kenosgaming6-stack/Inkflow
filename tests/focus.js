// Take money opens on the load you are working on (All is one tap; it snaps back next time); women on other loads are
// never hidden; Remind and End of day sit in one row; a huge cash sale asks first; the Home Screen app fills the screen;
// Book has coloured sections and a face on every line; newest first everywhere.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
const fs = require('fs'), path = require('path'); const OUT = path.join(__dirname, 'out', 'focus'); fs.mkdirSync(OUT, {recursive: true});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, reducedMotion: 'reduce', hasTouch: true, isMobile: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(100); };
  const txt = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const names = () => p.$$eval('#collist .row .name', els => els.map(e => e.textContent).sort().join(','));
  const onChip = () => p.evaluate(() => { const c = document.querySelector('.loadchips .chip.on'); return c ? c.dataset.id : null; });
  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(() => { localStorage.clear(); const d = n => new Date(Date.now() - n * 864e5).toISOString();
    S = normalize({v: 4, settings: {item: 'Onions', unit: 'bag', price: 650}, setup: true, locs: [{id: 'l1', town: 'Koko Shell', spot: ''}], lastLoc: 'l1',
      people: [{id: 'a', name: 'Abena', phone: '', loc: 'l1', note: ''}, {id: 'e', name: 'Esi', phone: '', loc: 'l1', note: ''}, {id: 'k', name: 'Kukua', phone: '', loc: 'l1', note: ''}, {id: 'y', name: 'Yaa', phone: '', loc: 'l1', note: ''}],
      cars: [{id: 'old', date: d(20), label: 'Abidjan', items: [{id: 'i1', name: '', count: 20, price: 600}], costs: [], phase: 'out'}, {id: 'new', date: d(1), label: 'Abidjan', items: [{id: 'j1', name: '', count: 40, price: 650}], costs: [], phase: 'giving'}],
      entries: [{id: 'g1', date: d(19), type: 'give', pid: 'e', carId: 'old', itemId: 'i1', bags: 3, price: 600, amount: 1800, loc: 'l1', off: d(19), rcpt: true},
        {id: 'g2', date: d(19), type: 'give', pid: 'k', carId: 'old', itemId: 'i1', bags: 1, price: 600, amount: 600, loc: 'l1', off: d(19), rcpt: true},
        {id: 'g3', date: d(1), type: 'give', pid: 'a', carId: 'new', itemId: 'j1', bags: 2, price: 650, amount: 1300, loc: 'l1', off: d(1), rcpt: true},
        {id: 'g4', date: d(25), type: 'give', pid: 'y', carId: 'old', itemId: 'i1', bags: 1, price: 600, amount: 600, loc: 'l1', off: d(25), rcpt: true},
        {id: 'p4', date: d(10), type: 'pay', pid: 'y', amount: 600, method: 'cash'}]});
    V.stack = []; V.tab = 'give'; commit(); render(); });
  await p.waitForTimeout(200);
  // you are giving from the new Abidjan: Take money opens on it
  await act('tab', '[data-t="collect"]');
  ok(await onChip() === 'new' && await names() === 'Abena', 'Take money opens on the load you are giving: only Abena');
  ok((await txt('.csum .cl small')).includes('No 2'), 'the card says which load: No 2 · Abidjan');
  ok((await txt('.morebtn')).includes('2 more women owe ₵2,400 on other loads'), 'women on other loads are not hidden: "2 more women owe ₵2,400 on other loads · See all"');
  await p.screenshot({path: OUT + '/1-take-money.png'});
  const chips = await p.$$eval('.loadchips .chip', els => els.map(e => e.textContent.trim()));
  ok(chips.some(c => c.startsWith('No 2')) && chips.some(c => c.startsWith('No 1')), 'two loads both called Abidjan are told apart: No 1 and No 2');
  await act('fcar', '[data-id=""]');
  ok(await names() === 'Abena,Esi,Kukua', 'tap All: everyone who owes');
  await act('tab', '[data-t="give"]'); await act('tab', '[data-t="collect"]');
  ok(await onChip() === 'new', 'next time it snaps back to the load you are giving');
  await act('morebtn').catch(() => {}); await p.click('.morebtn'); await p.waitForTimeout(100);
  ok(await onChip() === '', '"See all" shows everyone');
  // Remind and End of day: one slim row
  await p.evaluate(() => { S.entries.push({id: 'cs', date: new Date().toISOString(), type: 'cash', pid: null, carId: 'new', itemId: 'j1', bags: 1, price: 650, amount: 650, loc: 'l1'}); commit(); render(); });
  ok(await p.evaluate(() => { const r = document.querySelector('.cacts'); return !!r && !!r.querySelector('[data-act="eod"]'); }), 'End of day sits in one slim row under the card');
  // no open load: the newest load with money out
  await p.evaluate(() => { givingCar().phase = 'out'; commit(); V.tab = 'give'; render(); }); await act('tab', '[data-t="collect"]');
  ok(await onChip() === 'new', 'no open load: it opens on the newest load with money out');
  // a huge cash sale asks first
  await p.evaluate(() => { S.cars.find(c => c.id === 'new').phase = 'giving'; commit(); V.tab = 'give'; render(); });
  await act('cash'); await act('csn', '[data-i="j1"]'); for (const k of '25') await act('key', `[data-k="${k}"]`); await act('qtyuse'); await act('cssave');
  ok((await txt('.sheet h3')) === 'Sold 25 bags for cash?' && (await txt('.sheet p')).includes('₵16,250'), 'selling 25 bags: "Sold 25 bags for cash? That is ₵16,250 in your hand."');
  await act('csback'); ok(!!(await p.$('.sheet .cashhead')), '"No, go back" returns to the cash panel');
  await act('cssave'); await act('cssure'); await p.waitForTimeout(100);
  ok(await p.evaluate(() => S.entries.some(e => e.type === 'cash' && e.bags === 25)), '"Yes, sold" saves it');
  // Book: sections and faces
  await act('tab', '[data-t="book"]');
  const sects = await p.$$eval('.bsect', els => els.map(e => e.className.replace('bsect ', '') + ':' + e.textContent.replace(/\s+/g, ' ').trim()));
  ok(sects.length === 2 && sects[0].startsWith('owe:Owe money') && sects[1].startsWith('clear:Paid up'), 'Book: coloured sections: ' + sects.join(' / '));
  ok(await p.evaluate(() => [...document.querySelectorAll('#booklist .row')].every(r => r.querySelector('.av'))), 'a face on every line');
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.bsect.owe')).color) === 'rgb(209, 43, 54)' && await p.evaluate(() => getComputedStyle(document.querySelector('.bsect.clear')).color) === 'rgb(18, 128, 74)', 'Owe money is red, Paid up is green');
  ok((await txt('.bsegs .on')).includes('People') && (await txt('.bsegs')).includes('4'), 'the People / Loads switch is big and shows counts');
  await p.screenshot({path: OUT + '/2-book-people.png'});
  await act('bseg', '[data-s="cars"]');
  const ls = await p.$$eval('.bsect', els => els.map(e => e.className.replace('bsect ', '')));
  ok(ls.join(',') === 'open,taking', 'loads in sections: Open, Taking money');
  ok((await txt('#mid .row .name')).startsWith('No 2'), 'loads show their page number: No 2 · Abidjan');
  await p.screenshot({path: OUT + '/3-book-loads.png'});
  // newest first: whoever took bags last is on top (Take money and Book); the sort button can also do most owed and A to Z
  await p.evaluate(() => { const d = n => new Date(Date.now() - n * 864e5).toISOString(); S.entries.push({id: 'gn1', date: d(0.5), type: 'give', pid: 'k', carId: 'old', itemId: 'i1', bags: 1, price: 600, amount: 600, loc: 'l1', off: d(0.5), rcpt: true}); commit(); V.tab = 'collect'; V.fCar = ''; render(); });
  const order = await p.$$eval('#collist .row .name', els => els.map(e => e.textContent).join(','));
  ok(order === 'Kukua,Esi,Abena', 'Take money: inside each group the newest to take bags is on top (Kukua and Esi are late, so they stay in "Take now"): ' + order);
  await act('tab', '[data-t="book"]'); await act('bseg', '[data-s="people"]');
  const bo = await p.$$eval('#booklist .row .name', els => els.map(e => e.textContent).join(','));
  ok(bo === 'Kukua,Abena,Esi,Yaa', 'Book: newest on top, paid up at the bottom: ' + bo);
  await act('bsort'); const bo2 = await p.$$eval('#booklist .row .name', els => els.map(e => e.textContent).join(','));
  ok(bo2.startsWith('Esi,Abena'), 'the sort button: most owed first: ' + bo2);
  await act('bsort'); const bo3 = await p.$$eval('#booklist .row .name', els => els.map(e => e.textContent).join(','));
  ok(bo3 === 'Abena,Esi,Kukua,Yaa', 'then A to Z: ' + bo3);
  await act('bsort'); ok((await p.$$eval('#booklist .row .name', els => els[0].textContent)) === 'Kukua', 'then newest again');
  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', e.message.split('\n').slice(0, 4).join(' | ')); process.exit(2); });
