// The cloud book: two phones, one book. Runs the real Worker (worker/stallbook-sync.mjs) on this computer.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs'), path = require('path');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
const PORT = 8769, SERVER = `http://127.0.0.1:${PORT}`;
const OUT = path.join(__dirname, 'out', 'sync'); fs.mkdirSync(OUT, {recursive: true});
const photo = f => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'testphotos', f)).toString('base64');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const server = await require('./sync-server').start(PORT);
  await fetch(SERVER + '/__reset', {method: 'POST'});
  const b = await chromium.launch();
  const errs = [];
  const phone = async name => {
    const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, reducedMotion: 'reduce', hasTouch: true, isMobile: true});
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message)); await p.route(/fonts\.g/, r => r.abort());
    await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(500);
    return {ctx, p, name};
  };
  const sync = async ph => ph.p.evaluate(async () => {
    for (let i = 0; i < 80 && CB.busy; i++) await new Promise(r => setTimeout(r, 100));
    await cbSync(); for (let i = 0; i < 80 && CB.busy; i++) await new Promise(r => setTimeout(r, 100));
    await new Promise(r => setTimeout(r, 50));
  });
  const act = async (ph, a, extra = '') => { await ph.p.click(`[data-act="${a}"]${extra}`); await ph.p.waitForTimeout(100); };
  const txt = async (ph, sel) => ((await ph.p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const snap = ph => ph.p.evaluate(() => ({names: S.people.map(p => p.name).sort().join(','), bal: S.people.map(p => p.name + ':' + ledger(p.id).bal).sort().join(','), entries: S.entries.length, cars: S.cars.length,
    order: S.entries.every((e, i) => !i || S.entries[i - 1].date <= e.date)}));
  const A = await phone('A');

  // ---- phone A has a book with a photo, and starts the cloud book ----
  await A.p.evaluate(ph => {
    PH.ph1 = ph; const d = n => new Date(Date.now() - n * 864e5).toISOString();
    S = normalize({v: 4, settings: {item: 'Onions', unit: 'bag', price: 650, seller: 'Siddick'}, setup: true, locs: [{id: 'l1', town: 'Koko Shell', spot: ''}, {id: 'l2', town: 'Bechem', spot: ''}], lastLoc: 'l1',
      people: [{id: 'a', name: 'Ama', phone: '0241112222', loc: 'l1', note: ''}, {id: 'e', name: 'Esi', phone: '', loc: 'l2', note: ''}, {id: 'k', name: 'Kofi', phone: '', loc: 'l1', note: ''}],
      cars: [{id: 'c1', date: d(2), label: 'Abidjan', items: [{id: 'i1', name: 'Red net', count: 30, price: 650, photo: 'ph1'}, {id: 'i2', name: 'Brown sack', count: 20, price: 700}], costs: [], phase: 'giving'}],
      entries: [{id: 'g1', date: d(1), type: 'give', pid: 'a', carId: 'c1', itemId: 'i1', bags: 3, price: 650, amount: 1950, loc: 'l1', off: d(1), rcpt: false},
        {id: 'g2', date: d(1), type: 'give', pid: 'e', carId: 'c1', itemId: 'i2', bags: 2, price: 700, amount: 1400, loc: 'l2', off: d(1), rcpt: true},
        {id: 'p1', date: d(0.5), type: 'pay', pid: 'a', amount: 500, method: 'cash'}, {id: 'cs1', date: d(0.4), type: 'cash', pid: null, carId: 'c1', itemId: 'i1', bags: 1, price: 650, amount: 650, loc: 'l1'}]});
    for (let i = 0; i < 130; i++) S.entries.push({id: 'bulk' + i, date: new Date(Date.now() - 3e6 + i * 1000).toISOString(), type: 'give', pid: 'k', carId: 'c1', itemId: 'i2', bags: 1, price: 700, amount: 700, loc: 'l1', off: new Date(Date.now() - 3e6 + i * 1000).toISOString(), rcpt: true});
    V.stack = []; V.tab = 'book'; commit(); render();
  }, photo('red-net.jpg'));
  await A.p.waitForTimeout(200); await act(A, 'settings');
  ok((await txt(A, '.scard >> nth=0')).length > 0 && (await A.p.$$eval('.scard header b', els => els.map(e => e.textContent))).includes('Cloud book'), 'Settings has a "Cloud book" card');
  ok(!!(await A.p.$('[data-act="cloudnew"]')) && !!(await A.p.$('[data-act="cloudjoin"]')), 'not connected: "Start a cloud book" and "Join a book"');
  await act(A, 'cloudnew'); await A.p.fill('#cn_url', 'https://nope.invalid'); await act(A, 'cnstart'); await A.p.waitForTimeout(600);
  ok((await txt(A, '.sheet .err')).includes('Could not reach'), 'a wrong address says so');
  await A.p.fill('#cn_url', SERVER); await act(A, 'cnstart'); await A.p.waitForSelector('.codebig', {timeout: 8000});
  const code = await txt(A, '.codebig');
  ok(/^[A-HJKMNP-Z2-9]{4}(-[A-HJKMNP-Z2-9]{4}){3}$/.test(code), 'the book code looks like ABCD-EFGH-JKMN-PQRS: ' + code);
  ok((await txt(A, '.sheet h3')).includes('online') && !!(await A.p.$('.sheet a[href^="https://wa.me/"]')), 'a "Send by WhatsApp" link is ready');
  const invite = await A.p.evaluate(() => cbInvite());
  ok(invite === code + '@' + SERVER, 'the invite is the code and the server address: ' + invite);
  ok(await A.p.evaluate(() => { const c = document.getElementById('cb_code'); return c.getBoundingClientRect().height < 80 && c.scrollWidth <= c.clientWidth + 1; }), 'the code fits on one line');
  await A.p.screenshot({path: OUT + '/1-code.png'});
  ok(await A.p.evaluate(() => !!document.querySelector('[data-act="cbwrote"]') && document.querySelector('.sheet').textContent.includes('Write this code on paper')), 'the new book says "Write this code on paper"');
  await act(A, 'cbwrote'); await sync(A);
  ok(await A.p.evaluate(() => Date.now() - Number(localStorage.getItem('stallbook_code_ok')) < 60000), '"I wrote it down" is remembered for a month');
  ok(await A.p.evaluate(() => CB.on && CB.status === 'ok' && !CB.pending && CB.known.size >= 134 && CB.photoSent.has('ph1')), 'phone A sent its book: every line, and the photo');
  ok((await txt(A, '#cb_status')) === 'Saved just now', 'Settings says "Saved just now"');
  // ---- the server holds only scrambled data ----
  const rows = await (await fetch(SERVER + '/__rows')).json();
  const plain = ['Ama', 'Esi', 'Kofi', 'Koko Shell', 'Abidjan', 'Siddick', '0241112222', '1950', 'Red net'];
  const leaks = plain.filter(w => rows.some(r => { try { return Buffer.from(r.d, 'base64').toString('latin1').includes(w); } catch (e) { return false; } }));
  ok(rows.length >= 140 && leaks.length === 0, `the server holds ${rows.length} scrambled rows and none of the names, places, numbers or money` + (leaks.length ? ' LEAK: ' + leaks.join(',') : ''));
  ok(new Set(rows.map(r => r.k)).size >= 6, 'rows by kind: ' + [...new Set(rows.map(r => r.k))].sort().join(''));

  // ---- phone B joins from its first open ----
  const B = await phone('B');
  ok(!!(await B.p.$('.brand')) && !!(await B.p.$('[data-act="cloudjoin"]')), 'a new phone: the welcome has "Already have a book? Join it"');
  await act(B, 'cloudjoin'); await B.p.fill('#cj_in', 'ZZZZ-ZZZZ-ZZZZ-ZZZZ@' + SERVER); await act(B, 'cjgo'); await B.p.waitForTimeout(600);
  ok((await txt(B, '.sheet .err')).includes('no book with this code'), 'a wrong code: "There is no book with this code on that server."');
  await B.p.fill('#cj_in', 'hello ' + code.toLowerCase() + '@' + SERVER + ' thanks'); await act(B, 'cjgo');
  await B.p.waitForFunction(() => !document.querySelector('.ov') && S.people.length > 0, null, {timeout: 15000}).catch(async e => { console.log('STATE', JSON.stringify(await B.p.evaluate(() => ({ov: !!document.querySelector('.ov'), h3: (document.querySelector('.sheet h3') || {}).textContent, err: (document.querySelector('.sheet .err') || {}).textContent, on: CB.on, st: CB.status, ce: CB.err, busy: CB.busy, people: S.people.length, entries: S.entries.length})))); throw e; }); await B.p.waitForTimeout(300);
  const sa = await snap(A), sb = await snap(B);
  ok(sa.names === sb.names && sb.names === 'Ama,Esi,Kofi' && sa.bal === sb.bal && sa.entries === sb.entries && sb.order, `phone B joined from a pasted message: the same ${sb.entries} lines, the same names and the same money`);
  ok((await B.p.evaluate(() => S.setup && V.tab === 'give')) && (await txt(B, '.band')).startsWith('Give bags'), 'B is in the app, on Give bags');
  ok(await B.p.evaluate(() => !!PH.ph1 && PH.ph1.startsWith('data:image/jpeg')) && (await B.p.$$('.stock .leg .kimg')).length >= 1, 'the bag photo arrived on B');
  ok(await B.p.evaluate(() => S.settings.seller === 'Siddick' && S.entries.filter(e => e.type === 'give' || e.type === 'pay').every(e => e.rcpt === true)), 'settings came over; lines that came from the other phone never send a second receipt');
  await B.p.screenshot({path: OUT + '/2-b-joined.png'});

  // ---- both phones add lines; they meet in the middle ----
  await A.p.evaluate(() => { add({type: 'pay', pid: 'e', amount: 300, method: 'cash'}); commit(); });
  await B.p.evaluate(() => { add({type: 'give', pid: 'e', carId: 'c1', itemId: 'i1', bags: 2, price: 650, amount: 1300, loc: 'l2', off: nowIso(), rcpt: true}); commit(); });
  await sync(A); await sync(B); await sync(A);
  const s1 = await snap(A), s2 = await snap(B);
  ok(s1.entries === s2.entries && s1.bal === s2.bal && s1.entries === sa.entries + 2 && s1.order, 'a payment on A and a give on B: both phones have both, the money agrees: ' + s1.bal);
  // ---- no signal: B keeps working, sends later ----
  await B.ctx.setOffline(true);
  await B.p.evaluate(() => { add({type: 'pay', pid: 'k', amount: 100, method: 'cash'}); const p = person('a'); p.note = 'near the cold store'; commit(); });
  await B.p.evaluate(() => cbSync()); await B.p.waitForTimeout(200);
  ok(await B.p.evaluate(() => CB.status === 'offline' && CB.pending), 'B has no signal: it keeps working and says it will send later');
  await B.p.evaluate(() => { V.tab = 'book'; render(); }); await act(B, 'settings');
  ok((await txt(B, '#cb_status')) === 'No signal. It will send later.', 'Settings says: No signal. It will send later.');
  await A.p.evaluate(() => { add({type: 'cash', pid: null, carId: 'c1', itemId: 'i1', bags: 2, price: 650, amount: 1300, loc: 'l1'}); commit(); });
  await sync(A);
  await B.ctx.setOffline(false); await sync(B); await sync(A);
  const o1 = await snap(A), o2 = await snap(B);
  ok(o1.entries === o2.entries && o1.bal === o2.bal && o1.entries === s1.entries + 2, 'signal back: B sent its payment, got A\'s cash sale, and both agree');
  ok(await A.p.evaluate(() => person('a').note === 'near the cold store'), 'B\'s change to Ama (offline) is on A now');
  // ---- the newest edit wins ----
  await A.p.evaluate(() => { person('e').name = 'Esi Mensah'; commit(); }); await A.p.waitForTimeout(40); await sync(A);
  await B.p.evaluate(() => { person('e').name = 'Esi M.'; commit(); }); await B.p.waitForTimeout(40);
  await sync(B); await sync(A);
  ok((await A.p.evaluate(() => person('e').name)) === 'Esi M.' && (await B.p.evaluate(() => person('e').name)) === 'Esi M.', 'both edited Esi\'s name: the newest edit won on both phones');
  // ---- removing a line on one phone removes it on the other ----
  await A.p.evaluate(() => { undoEntry('bulk0'); commit(); }); await sync(A); await sync(B);
  ok(await B.p.evaluate(() => C().undone.has('bulk0')), 'a line removed on A is removed on B too (it stays, crossed out)');
  // ---- a load closed on one phone ----
  await A.p.evaluate(() => { carById('c1').label = 'Abidjan 2'; commit(); }); await sync(A); await sync(B);
  ok((await B.p.evaluate(() => carById('c1').label)) === 'Abidjan 2', 'an edit to the load on A shows on B');
  // ---- the screen refreshes by itself ----
  await B.p.evaluate(() => { V.tab = 'give'; V.stack = []; render(); }); await B.p.waitForTimeout(200);
  const before = await txt(B, '.stock .leg .li.c b');
  await A.p.evaluate(() => { add({type: 'cash', pid: null, carId: 'c1', itemId: 'i1', bags: 1, price: 650, amount: 650, loc: 'l1'}); commit(); }); await sync(A); await sync(B); await B.p.waitForTimeout(400);
  ok((await txt(B, '.stock .leg .li.c b')) === String(Number(before) + 1), 'B\'s screen shows the new sale without anyone touching it (cash bags ' + before + ' → ' + (await txt(B, '.stock .leg .li.c b')) + ')');

  // ---- a buying trip (with its photo) travels too ----
  await A.p.evaluate(ph => { PH.tp1 = ph; S.trips.push({id: 'tr1', date: nowIso(), place: 'Abidjan', cash: 25000, items: [{id: 'ti1', name: '', photo: 'tp1'}], buys: [{id: 'b1', date: nowIso(), itemId: 'ti1', bags: 20, price: 450, amount: 9000}], phase: 'buying', carId: ''}); commit(); }, photo('brown-sack.jpg'));
  await sync(A); await sync(B);
  ok(await B.p.evaluate(() => { const t = S.trips.find(x => x.id === 'tr1'); return !!t && t.buys.length === 1 && t.buys[0].amount === 9000 && !!PH.tp1; }), 'a buying trip with a buy line and its photo arrives on B');
  // ---- two phones at the very same moment ----
  await A.p.evaluate(() => { for (let i = 0; i < 5; i++) add({type: 'cash', pid: null, carId: 'c1', itemId: 'i1', bags: 1, price: 650, amount: 650, loc: 'l1'}); commit(); });
  await B.p.evaluate(() => { for (let i = 0; i < 5; i++) add({type: 'pay', pid: 'a', amount: 10 + i, method: 'cash'}); commit(); });
  await Promise.all([sync(A), sync(B)]); await Promise.all([sync(A), sync(B)]); await sync(A);
  const m1 = await snap(A), m2 = await snap(B);
  ok(m1.entries === m2.entries && m1.bal === m2.bal && m1.order, 'both phones saved at the same moment: nothing lost, both books the same (' + m1.entries + ' lines)');

  // ---- a phone with no cloud on it sees nothing new; disconnecting keeps the book ----
  await B.p.evaluate(() => { V.tab = 'book'; render(); }); await act(B, 'settings'); await act(B, 'clouddrop'); await act(B, 'clouddropyes');
  ok(await B.p.evaluate(() => !CB.on && !localStorage.getItem('stallbook_cloud') && S.people.length === 3), 'Disconnect: B keeps its whole book, and stops syncing');
  await B.p.evaluate(() => { add({type: 'pay', pid: 'a', amount: 50, method: 'cash'}); commit(); });
  await sync(A); ok(await A.p.evaluate(() => S.entries.filter(e => e.type === 'pay' && e.amount === 50).length === 0), 'a disconnected phone sends nothing');
  // join again: no copies, and its own line goes up
  await B.p.evaluate(() => { toRoot('book'); }); await act(B, 'settings'); await act(B, 'cloudjoin'); await B.p.fill('#cj_in', invite); await act(B, 'cjgo'); await B.p.waitForTimeout(500);
  ok((await txt(B, '.sheet h3')) === 'This phone has its own book' && (await txt(B, '.sheet p')).includes('join the shared book'), 'joining with a book already on the phone asks first');
  const countB = await B.p.evaluate(() => S.entries.length);
  await act(B, 'cjyes'); await B.p.waitForFunction(() => !document.querySelector('.ov'), null, {timeout: 15000}); await sync(B); await sync(A);
  const r1 = await snap(A), r2 = await snap(B);
  ok(r1.entries === r2.entries && r1.bal === r2.bal && r1.entries === countB, 'joined again: no copies, and the offline payment is in both books');
  // ---- delete everything on B: the online book stays ----
  await B.p.evaluate(() => { V.tab = 'book'; render(); }); await act(B, 'settings'); await act(B, 'wipe'); await act(B, 'wipeyes'); await B.p.waitForTimeout(300);
  ok(await B.p.evaluate(() => !CB.on && S.people.length === 0 && S.entries.length === 0), 'Delete everything on B: B is empty and disconnected');
  ok((await snap(A)).entries === r1.entries, 'the online book and phone A are untouched');
  await act(B, 'cloudjoin'); await B.p.fill('#cj_in', invite); await act(B, 'cjgo');
  await B.p.waitForFunction(() => !document.querySelector('.ov') && S.people.length > 0, null, {timeout: 15000});
  const w2 = await snap(B);
  ok(w2.entries === r1.entries && w2.bal === r1.bal, 'B joined again and got everything back, to the cedi');
  // ---- the code is the key: a changed letter is a different book ----
  const C3 = await phone('C');
  const bad = code.replace(/^./, c => c === 'A' ? 'B' : 'A');
  await act(C3, 'cloudjoin'); await C3.p.fill('#cj_in', bad + '@' + SERVER); await act(C3, 'cjgo'); await C3.p.waitForTimeout(600);
  ok((await txt(C3, '.sheet .err')).includes('no book'), 'a code with one letter changed finds no book');
  // right book id but wrong auth can not happen from the app; check the server refuses a stolen id
  const stolen = await fetch(SERVER + '/v1/sync', {method: 'POST', body: JSON.stringify({book: rows[0].book, auth: 'f'.repeat(64), pull: true, since: 0})});
  ok(stolen.status === 401, 'the server refuses anyone who knows only the book id');

  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); server.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', String(e.stack || e.message).split('\n').slice(0, 5).join(' | ')); process.exit(2); });
