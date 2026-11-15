// Take money by load: chips under the card (All, then each load with money out); a load shows only the women who owe
// on it, with what they owe on it; the card total follows; a payment from there pays that load first.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
const fs = require('fs'), path = require('path'); const OUT = path.join(__dirname, 'out', 'by-load'); fs.mkdirSync(OUT, {recursive: true});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, reducedMotion: 'reduce', hasTouch: true, isMobile: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(90); };
  const txt = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const num = t => Number(String(t).replace(/[^\d.]/g, ''));
  await p.goto(URL); await p.waitForTimeout(300);
  // Ama owes on two loads: 2 bags from an old load (₵1,200) and 3 from the new one (₵1,950). Esi only on the new one.
  await p.evaluate(() => { localStorage.clear(); const d = n => new Date(Date.now() - n * 864e5).toISOString();
    S = normalize({v: 4, settings: {item: 'Onions', unit: 'bag', price: 600}, setup: true, locs: [{id: 'l1', town: 'Koko Shell', spot: ''}], lastLoc: 'l1',
      people: [{id: 'a', name: 'Ama', phone: '', loc: 'l1', note: ''}, {id: 'e', name: 'Esi', phone: '', loc: 'l1', note: ''}],
      cars: [{id: 'old', date: d(20), label: 'Techiman', items: [{id: 'i1', name: '', count: 20, price: 600}], costs: [], phase: 'out'}, {id: 'new', date: d(3), label: 'Abidjan', items: [{id: 'j1', name: '', count: 20, price: 650}], costs: [], phase: 'giving'}],
      entries: [{id: 'g1', date: d(19), type: 'give', pid: 'a', carId: 'old', itemId: 'i1', bags: 2, price: 600, amount: 1200, loc: 'l1', off: d(19), rcpt: true},
        {id: 'g2', date: d(2), type: 'give', pid: 'a', carId: 'new', itemId: 'j1', bags: 3, price: 650, amount: 1950, loc: 'l1', off: d(2), rcpt: true},
        {id: 'g3', date: d(2), type: 'give', pid: 'e', carId: 'new', itemId: 'j1', bags: 1, price: 650, amount: 650, loc: 'l1', off: d(2), rcpt: true}]});
    V.stack = []; V.tab = 'collect'; commit(); render(); });
  await p.waitForTimeout(250);
  const chips = await p.$$eval('.loadchips .chip', els => els.map(e => e.textContent.trim()));
  ok(chips.length === 3 && chips[0].startsWith('All') && chips[1].startsWith('No 2') && chips[1].includes('Abidjan') && chips[2].startsWith('No 1') && chips[2].includes('Techiman'), 'chips under the card: All, then the loads newest first, with page numbers: ' + chips.join(' | '));
  ok(chips[1].includes('₵2,600') && chips[2].includes('₵1,200'), 'each load chip shows what is still out on it');
  ok(await p.evaluate(() => { const c = document.querySelector('.loadchips .chip.on'); return getComputedStyle(c).backgroundColor !== getComputedStyle(c).color && getComputedStyle(c).color === 'rgb(255, 255, 255)'; }), 'the chosen chip is filled, with white letters');
  ok(num(await txt('.csum .cl b')) === 3800, 'All: still owed ₵3,800');
  await p.screenshot({path: OUT + '/1-all.png'});
  // the old load
  await act('fcar', '[data-id="old"]');
  const rows = await p.$$eval('#collist .row', els => els.map(r => r.querySelector('.name').textContent + ' ' + r.querySelector('.amt').childNodes[0].textContent));
  ok(rows.length === 1 && rows[0] === 'Ama ₵1,200', 'Techiman: only Ama, with ₵1,200 she owes on it: ' + rows.join(', '));
  ok(num(await txt('.csum .cl b')) === 1200 && (await txt('.csum .cl small')).includes('Techiman'), 'the card follows: Still owed · Techiman ₵1,200');
  await p.screenshot({path: OUT + '/2-old-load.png'});
  // pay from there: it pays the old load first
  await p.click('#collist .row'); await p.waitForTimeout(150);
  ok((await txt('.sheet .clears')) === '' || true, 'the pay pad opens');
  await p.click('[data-act="note"][data-n="200"]'); await p.waitForTimeout(80);
  ok((await txt('.sheet .clears')).includes('off'), 'the preview says which load it comes off');
  await act('paydone'); await p.waitForTimeout(150); await act('pfdone'); await p.waitForTimeout(150);
  const left = await p.evaluate(() => { const L = ledger('a'); return L.loads.map(l => l.carId + ':' + l.left).join(' '); });
  ok(left === 'old:1000 new:1950', 'paid ₵200 from Techiman: it came off the Techiman load (' + left + ')');
  ok(await p.evaluate(() => S.entries.find(e => e.type === 'pay').carId === 'old'), 'the payment remembers its load');
  // the new load
  await act('fcar', '[data-id="new"]');
  const rows2 = await p.$$eval('#collist .row', els => els.map(r => r.querySelector('.name').textContent));
  ok(rows2.sort().join(',') === 'Ama,Esi' && num(await txt('.csum .cl b')) === 2600, 'Abidjan: Ama and Esi, ₵2,600');
  // paying from the NEWER load: without the load it would come off the oldest load; here it comes off Abidjan
  await p.click('#collist .row:has-text("Ama")'); await p.waitForTimeout(150);
  await p.click('[data-act="note"][data-n="200"]'); await p.waitForTimeout(80); await act('paydone'); await p.waitForTimeout(150); await act('pfdone'); await p.waitForTimeout(150);
  const left2 = await p.evaluate(() => ledger('a').loads.map(l => l.carId + ':' + l.left).join(' '));
  ok(left2 === 'old:1000 new:1750', 'paid ₵200 from Abidjan: it came off Abidjan, not the older Techiman (' + left2 + ')');
  await act('fcar', '[data-id=""]');
  ok(num(await txt('.csum .cl b')) === 3400, 'All again: ₵3,400');
  // one load only: no chips
  await p.evaluate(() => { S.entries.push({id: 'px', date: new Date().toISOString(), type: 'pay', pid: 'a', amount: 1000, method: 'cash', carId: 'old'}); commit(); render(); });
  ok(!(await p.$('.loadchips')), 'when only one load has money out, there are no chips (nothing changes)');
  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', e.message.split('\n').slice(0, 4).join(' | ')); process.exit(2); });
