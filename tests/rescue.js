// When the app cannot open, the screen says so in short words and has Save my book, which works without the app.
// Once a month the cloud book asks: do you still have your book code?
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
const fs = require('fs'), path = require('path'); const OUT = path.join(__dirname, 'out', 'rescue'); fs.mkdirSync(OUT, {recursive: true});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, reducedMotion: 'reduce', hasTouch: true, isMobile: true, acceptDownloads: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  await p.goto(URL); await p.waitForTimeout(400);
  await p.evaluate(() => { localStorage.clear(); const d = n => new Date(Date.now() - n * 864e5).toISOString();
    S = normalize({v: 4, settings: {item: 'Onions', unit: 'bag', price: 650}, setup: true, locs: [{id: 'l1', town: 'Koko Shell', spot: ''}], lastLoc: 'l1',
      people: [{id: 'w0', name: 'Ama', phone: '', loc: 'l1', note: ''}], cars: [{id: 'c1', date: d(2), label: 'Abidjan', items: [{id: 'i1', name: '', count: 40, price: 650}], costs: [], phase: 'giving'}],
      entries: [{id: 'g0', date: d(1), type: 'give', pid: 'w0', carId: 'c1', itemId: 'i1', bags: 3, price: 650, amount: 1950, loc: 'l1', off: d(1), rcpt: true}]}); commit(); });
  // the app breaks while opening
  await p.evaluate(() => { document.getElementById('app').innerHTML = ''; window.dispatchEvent(new ErrorEvent('error', {message: 'Test break', lineno: 7})); });
  const t = (await p.textContent('#rescue')).replace(/\s+/g, ' ');
  ok(t.includes('StallBook could not open') && t.includes('Your book is safe on this phone.') && t.includes('Save my book') && t.includes('Try again') && t.includes('Test break'), 'the screen: could not open, "Your book is safe", Save my book, Try again, the error');
  ok(!t.includes('screenshot'), 'no "send a screenshot" - nobody to send it to');
  await p.screenshot({path: OUT + '/1-rescue.png'});
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-r="save"]')]);
  const f = OUT + '/rescue.json'; await dl.saveAs(f); const bk = JSON.parse(fs.readFileSync(f, 'utf8'));
  ok(bk.stallbook && bk.stallbook.people[0].name === 'Ama' && bk.stallbook.entries.length === 1 && /^StallBook-backup-/.test(dl.suggestedFilename()), 'Save my book: a backup file with the whole book');
  ok((await p.textContent('[data-r="said"]')).includes('Saved'), 'and it says "Saved. Keep the file in WhatsApp."');
  // the file restores in a fresh app (same format as a normal backup)
  ok(await p.evaluate(raw => { const d = JSON.parse(raw); return !!d.stallbook && d.version === 3 && typeof d.photos === 'object'; }, JSON.stringify(bk)), 'the file has the same shape as a normal backup');
  // the first copy is gone: the second copy is used
  await p.evaluate(() => localStorage.clear());
  await p.evaluate(() => { window.dispatchEvent(new ErrorEvent('error', {message: 'Again'})); });
  await p.waitForTimeout(100);
  // (the rescue screen only shows while the app is empty; show it again)
  await p.evaluate(() => { document.getElementById('app').innerHTML = ''; window.dispatchEvent(new ErrorEvent('error', {message: 'Again'})); });
  const [dl2] = await Promise.all([p.waitForEvent('download', {timeout: 5000}).catch(() => null), p.click('[data-r="save"]')]);
  let two = false; if (dl2) { await dl2.saveAs(OUT + '/rescue2.json'); two = JSON.parse(fs.readFileSync(OUT + '/rescue2.json', 'utf8')).stallbook.people[0].name === 'Ama'; }
  ok(two, 'with the first copy gone, Save my book uses the second copy');
  // once a month: do you still have your book code?
  await p.reload(); await p.waitForTimeout(500);
  await p.evaluate(() => { window.CODECHECK_FORCE = true; CB.on = true; CB.url = 'https://stallbook-sync.example.workers.dev'; CB.code = 'ABCDEFGHJKMNPQRS'; localStorage.removeItem('stallbook_code_ok'); closeSheet(); V.stack = []; render(); cbCodeCheck(); });
  await p.waitForTimeout(200);
  ok((await p.textContent('.sheet')).includes('Do you still have your book code?') && !!(await p.$('.sheet [data-act="cbshowcode"]')), 'a month passed: "Do you still have your book code?"');
  await p.screenshot({path: OUT + '/2-code-check.png'});
  await p.click('[data-act="cbshowcode"]'); await p.waitForTimeout(150);
  ok((await p.textContent('.sheet')).includes('Write this code on paper') && !!(await p.$('.sheet #cb_code')), 'Show my code: the code, "Write this code on paper"');
  await p.click('[data-act="cbwrote"]'); await p.waitForTimeout(150);
  await p.evaluate(() => cbCodeCheck());
  ok(!(await p.$('.sheet')), 'I wrote it down: it does not ask again for a month');
  await p.evaluate(() => localStorage.setItem('stallbook_code_ok', String(Date.now() - 31 * 864e5)));
  await p.evaluate(() => cbCodeCheck()); await p.waitForTimeout(150);
  ok(!!(await p.$('.sheet [data-act="cbwrote"]')), 'a month later it asks again');
  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', String(e.message).split('\n').slice(0, 10).join(' | ')); process.exit(2); });
