const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const SHOTS = require('path').join(__dirname, 'out', 'upgrade'); require('fs').mkdirSync(SHOTS, {recursive: true}); const URL = process.env.URL || 'http://127.0.0.1:8768/';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const D = n => new Date(Date.now() - n * 864e5).toISOString();
// a book as v2 saved it: flat places, waiting gives (off null), count fix on the car, bags moved from an older car
const v2 = {v: 2, settings: {seller: 'Siddick', momo: '', item: 'Onions', unit: 'bag', price: 650, cycle: 14, sound: true, hand: 'right', via: 'sms'},
  places: ['Kejetia', 'Asafo'], lastPlace: 'Kejetia', carry: 0, lastBackup: null, changedAt: D(0),
  people: [{id: 'a', name: 'Ama', phone: '024', place: 'Kejetia', note: 'Blue umbrella'}, {id: 'k', name: 'Kofi', phone: '', place: 'Asafo', note: ''}],
  cars: [{id: 'c0', date: D(20), items: [{id: 'i1', name: '', count: 10, price: 600}], adjust: 0, moved: 2, costs: [], phase: 'out'},
         {id: 'c1', date: D(1), items: [{id: 'i1', name: '', count: 20, price: 650}], adjust: 2, moved: 0, costs: [], phase: 'giving'}],
  entries: [
    {id: 'g0', type: 'give', pid: 'a', carId: 'c0', itemId: 'i1', bags: 8, price: 600, amount: 4800, date: D(20), off: D(20), rcpt: true},
    {id: 'p0', type: 'pay', pid: 'a', amount: 4000, method: 'cash', date: D(5)},
    {id: 'g1', type: 'give', pid: 'a', carId: 'c1', itemId: 'i1', bags: 3, price: 650, amount: 1950, date: D(1), off: D(1), rcpt: true},
    {id: 'g2', type: 'give', pid: 'k', carId: 'c1', itemId: 'i1', bags: 2, price: 650, amount: 1300, date: D(1), off: null, rcpt: true}]};
const v1 = {settings: {seller: 'Siddick', momo: '0550000000', item: 'Onions', unit: 'bag', price: 650, cycle: 14}, places: ['Kejetia'], place: 'all',
  people: [{id: 'p1', name: 'Ama', phone: '0241234567', place: 'Kejetia', created: D(21)}, {id: 'p2', name: 'Kofi', phone: '', place: '', created: D(21)}],
  pages: [{id: 'pg1', date: D(20), items: [{id: 'i1', name: '', count: 10, price: 650}], bags: 10, done: true, phase: 'collecting'}],
  entries: [
    {id: 'e1', pid: 'p1', type: 'took', pageId: 'pg1', itemId: 'i1', date: D(20), bags: 2, price: 650, amount: 1300},
    {id: 'e2', pid: 'p1', type: 'paid', pageId: 'pg1', amount: 500, date: D(10)},
    {id: 'e3', pid: 'p2', type: 'took', pageId: 'pg1', itemId: 'i1', date: D(20), bags: 1, price: 650, amount: 650},
    {id: 'e4', pid: 'p2', type: 'undo', ref: 'e3', date: D(19)},
    {id: 'e5', pid: 'p2', type: 'took', pageId: 'pg1', itemId: 'i1', date: D(19), bags: 1.5, price: 650, amount: 975},
    {id: 'e6', pid: 'p2', type: 'back', ref: 'e5', pageId: 'pg1', bags: 0.5, price: 650, amount: 325, date: D(15)},
    {id: 'e7', pid: null, type: 'cash', pageId: 'pg1', itemId: 'i1', bags: 1, price: 650, amount: 650, date: D(20)}]};
(async () => {
  const b = await chromium.launch(); const errs = [];
  const open = async (key, data, vp) => {
    const ctx = await b.newContext({reducedMotion: 'reduce', viewport: vp || {width: 390, height: 844}}); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts/, r => r.abort());
    await p.goto(URL); await p.evaluate(([k, d]) => { localStorage.clear(); if (k) localStorage.setItem(k, JSON.stringify(d)); }, [key, data]);
    await p.reload(); await p.waitForTimeout(400); return p;
  };
  const txt = async (p, s) => ((await p.textContent(s)) || '').replace(/\s+/g, ' ').trim();
  // v2
  let p = await open('stallbook_v2', v2);
  ok(!(await txt(p, '#app')).includes('Set up your book'), 'v2 book: no setup screen');
  ok((await txt(p, '.stock .big b')) === '17' && (await txt(p, '.stock .leg')).includes('2 kept') && (await txt(p, '.stock .leg')).includes('22 loaded'), 'v2 open load: 22 loaded (count fix kept), 3 given, 2 kept for her, 17 left');
  await p.click('[data-act="tab"][data-t="book"]'); await p.waitForTimeout(100);
  const bk = await txt(p, '#booklist');
  ok(bk.includes('Kejetia') && bk.includes('Blue umbrella') && bk.includes('Asafo') && (await txt(p, '.csum')).includes('₵2,750'), 'v2 places became towns, landmark kept, owed ₵2,750 (800 + 1,950)');
  const s2 = await p.evaluate(() => JSON.parse(localStorage.getItem('stallbook_v2')));
  ok(s2.v === 4 && !s2.places && s2.locs.length === 2 && s2.entries.filter(e => e.type === 'stock').length === 2 && s2.cars.every(c => c.adjust === undefined), 'v2 saved back as v4: locs, stock lines, no old fields');
  await p.click('[data-act="tab"][data-t="give"]'); await p.waitForTimeout(100);
  ok(!(await p.$('.row.held')) && (await p.$$eval('.ptabs [data-act="gtab"]', els => els.map(e => e.childNodes[0].textContent.trim()))).join('|') === 'Kejetia|Asafo', 'v2 lines go under each customer\'s place: Kejetia and Asafo tabs');
  await p.click('.ptabs .chip:has-text("Asafo")'); await p.waitForTimeout(100);
  await p.click('.row.held [data-act="entry"]'); await p.waitForTimeout(100); await p.click('[data-act="hand"]'); await p.waitForTimeout(100);
  ok((await txt(p, '.stock .leg')).includes('5 given') && !(await txt(p, '.stock .leg')).includes('held'), 'v2 waiting bags can be handed over in v3');
  await p.context().close();
  // v1
  p = await open('stallbook_v1', v1, {width: 360, height: 640});
  ok((await txt(p, '#toast')).includes('version 1'), 'v1 book: moved-over message');
  ok((await txt(p, '.csum')).includes('₵1,450'), 'v1 debts: ₵1,450 to collect');
  await p.screenshot({path: SHOTS + '/20-v1-collect-360.png'});
  // small phone: the pay pad's Done and the give sheet's Give button are reachable without scrolling
  await p.click('#collist [data-act="pay"]'); await p.waitForTimeout(150);
  const payFit = await p.evaluate(() => { const b = document.querySelector('[data-act="paydone"]').getBoundingClientRect(); const sh = document.querySelector('.sheet'); return {bottom: Math.round(b.bottom), vh: innerHeight, scrolls: sh.scrollHeight > sh.clientHeight + 1}; });
  ok(payFit.bottom <= payFit.vh && !payFit.scrolls, `360×640 pay pad fits: Done at ${payFit.bottom}px of ${payFit.vh}, no scrolling`);
  await p.screenshot({path: SHOTS + '/21-pay-360.png'});
  await p.click('.ov', {position: {x: 10, y: 10}}); await p.waitForTimeout(100);
  await p.click('[data-act="tab"][data-t="give"]'); await p.waitForTimeout(100);
  await p.click('[data-act="newcar"]'); await p.waitForTimeout(100); await p.click('[data-act="wfrom"]'); await p.click('[data-act="wphoto"]'); for (const k of '10') await p.click(`[data-act="key"][data-k="${k}"]`); await p.click('[data-act="wnext"]'); for (const k of '650') await p.click(`[data-act="key"][data-k="${k}"]`); await p.click('[data-act="wnext"]'); await p.click('[data-act="wdone"]'); await p.click('[data-act="wfinish"][data-skip]'); await p.waitForTimeout(150);
  await p.fill('#gq', 'Abena'); await p.waitForTimeout(80); await p.click('.sg.new'); await p.waitForTimeout(150);
  const giveFit = await p.evaluate(() => { const b = document.querySelector('[data-act="gsave"]').getBoundingClientRect(); const sh = document.querySelector('.sheet'); return {bottom: Math.round(b.bottom), vh: innerHeight, scrolls: sh.scrollHeight > sh.clientHeight + 1}; });
  ok(giveFit.bottom <= giveFit.vh, `360×640 new-customer give sheet: Give button at ${giveFit.bottom}px of ${giveFit.vh}${giveFit.scrolls ? ' (sheet scrolls)' : ''}`);
  await p.screenshot({path: SHOTS + '/22-give-sheet-360.png'});

  // a v3 book with towns and spots becomes one flat list of places; half bags are switched off
  {
    const v3 = {v: 3, settings: {seller: '', momo: '', item: 'Onions', unit: 'bag', price: 650, cycle: 14, sound: true, hand: 'right', via: 'sms', half: true}, carry: 0, lastBackup: null, changedAt: D(0), setup: true, lastLoc: 'm',
      locs: [{id: 'm', town: 'Bakwai', spot: 'Market'}, {id: 'k', town: 'Bakwai', spot: 'Koko Shell'}, {id: 't', town: 'Bechem', spot: ''}, {id: 'dup', town: 'Bakwai Market', spot: ''}],
      people: [{id: 'a', name: 'Ama', phone: '', loc: 'm', note: ''}, {id: 'b', name: 'Abena', phone: '', loc: 'dup', note: ''}],
      cars: [{id: 'c1', date: D(1), label: '', items: [{id: 'i1', name: '', count: 10, price: 650}], costs: [], phase: 'giving'}],
      entries: [{id: 'g1', type: 'give', pid: 'a', carId: 'c1', itemId: 'i1', bags: 2, price: 650, amount: 1300, date: D(1), off: D(1), rcpt: true, loc: 'dup'}]};
    const p = await open('stallbook_v2', v3);
    const s3 = await p.evaluate(() => JSON.parse(localStorage.getItem('stallbook_v2')));
    const names = s3.locs.map(l => l.town + '|' + l.spot).sort().join(', ');
    ok(s3.v === 4 && names === 'Bakwai Koko Shell|, Bakwai Market|, Bechem|' && s3.people.every(x => x.loc === 'm') && s3.entries[0].loc === 'm' && s3.lastLoc === 'm', 'v3 towns and spots became places: ' + names);
    ok(s3.settings.half === false, 'v3 book: half bags switched off');
    ok((await txt(p, '.ptabs .chip.on')).includes('Bakwai Market'), 'Give screen opens on the Bakwai Market tab');
  }
  ok(errs.length === 0, 'no script errors ' + errs.join(' | '));
  console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); await b.close();
})().catch(e => { console.log('CRASH', e.message.split('\n').slice(0, 3).join(' | ')); process.exit(1); });
