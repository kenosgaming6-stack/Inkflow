// Never lose the book: a red "Not saved!" bar when saving fails, a second copy of the book that brings it back when the
// first copy is gone, and no zombie book after "Delete everything".
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
const fs = require('fs'), path = require('path'); const OUT = path.join(__dirname, 'out', 'safe'); fs.mkdirSync(OUT, {recursive: true});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, reducedMotion: 'reduce', hasTouch: true, isMobile: true});
  await ctx.addInitScript(() => { window.RECOVER_FORCE = true; });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(110); };
  const has = sel => p.evaluate(sel => !!document.querySelector(sel), sel);
  await p.goto(URL); await p.waitForTimeout(400);
  await p.evaluate(() => { localStorage.clear(); const d = n => new Date(Date.now() - n * 864e5).toISOString();
    S = normalize({v: 4, settings: {item: 'Onions', unit: 'bag', price: 650}, setup: true, locs: [{id: 'l1', town: 'Koko Shell', spot: ''}], lastLoc: 'l1',
      people: [{id: 'w0', name: 'Ama', phone: '', loc: 'l1', note: ''}], cars: [{id: 'c1', date: d(2), label: 'Abidjan', items: [{id: 'i1', name: '', count: 40, price: 650}], costs: [], phase: 'giving'}],
      entries: [{id: 'g0', date: d(1), type: 'give', pid: 'w0', carId: 'c1', itemId: 'i1', bags: 3, price: 650, amount: 1950, loc: 'l1', off: d(1), rcpt: true}]});
    V.stack = []; V.tab = 'give'; commit(); render(); });
  await p.waitForTimeout(400);
  ok(!(await has('#savebar')), 'saving works: no red bar');
  const copy = await p.evaluate(() => new Promise(res => { const r = indexedDB.open('stallbook-book', 1); r.onsuccess = () => { const q = r.result.transaction('b').objectStore('b').get('book'); q.onsuccess = () => res(q.result); q.onerror = () => res(null); }; r.onerror = () => res(null); }));
  ok(!!copy && JSON.parse(copy).people[0].name === 'Ama', 'a second copy of the whole book is kept apart from the first');
  // the first copy is wiped: the book comes back
  await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(900);
  ok(await p.evaluate(() => S.people.length === 1 && S.entries.length === 1 && S.setup === true), 'the first copy was wiped: the book is back from the second copy');
  ok((await p.textContent('.toast, #toast, [role="status"]').catch(() => '')).includes('back') || await p.evaluate(() => (document.body.innerText || '').includes('Your book is back')), 'and it says "Your book is back"');
  ok(await p.evaluate(() => !!localStorage.getItem('stallbook_v2')), 'the first copy is written again');
  // the first copy is older than the second: the newer one wins
  await p.evaluate(() => { const r = JSON.parse(localStorage.getItem('stallbook_v2')); r.changedAt = new Date(Date.now() - 864e5).toISOString(); r.people = []; localStorage.setItem('stallbook_v2', JSON.stringify(r)); });
  await p.reload(); await p.waitForTimeout(900);
  ok(await p.evaluate(() => S.people.length === 1), 'a stale first copy is replaced by the newer second copy');
  // saving fails: a red bar, with Back up now
  await p.evaluate(() => { window._set = Storage.prototype.setItem; Storage.prototype.setItem = function () { throw new Error('full'); }; S.people[0].note = 'x'; commit(); });
  await p.waitForTimeout(150);
  ok(await has('#savebar [data-act="backup"]') && (await p.textContent('#savebar')).includes('Not saved'), 'saving fails: a red "Not saved!" bar with "Back up now"');
  await p.screenshot({path: OUT + '/1-bar.png'});
  ok(await p.evaluate(() => { const r = document.getElementById('savebar').getBoundingClientRect(); return r.top >= 0 && r.width >= innerWidth - 2; }), 'the bar is across the top of the screen');
  // saving works again: the bar goes away
  await p.evaluate(() => { Storage.prototype.setItem = window._set; commit(); });
  await p.waitForTimeout(100);
  ok(!(await has('#savebar')), 'saving works again: the bar goes away');
  // Delete everything: no zombie book comes back
  await p.evaluate(() => { V.tab = 'book'; render(); }); await act('settings'); await act('wipe'); await act('wipeyes'); await p.waitForTimeout(300);
  await p.reload(); await p.waitForTimeout(900);
  ok(await p.evaluate(() => S.people.length === 0 && !S.setup) && !!(await p.$('[data-act="sunext"]')), 'after Delete everything and a reload: the welcome, not the old book');
  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', String(e.message).split('\n').slice(0, 10).join(' | ')); process.exit(2); });
