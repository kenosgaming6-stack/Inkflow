// Five simpler ways: first open in one tap; a new load skips the name; closing a load in one tap; hold a button to hear
// it; no count reminder in the Simple app.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
const fs = require('fs'), path = require('path'); const OUT = path.join(__dirname, 'out', 'simpler'); fs.mkdirSync(OUT, {recursive: true});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, reducedMotion: 'reduce', hasTouch: true, isMobile: true});
  await ctx.addInitScript(() => { window.__said = []; window.SpeechSynthesisUtterance = function (t) { this.text = t; }; try { Object.defineProperty(window, 'speechSynthesis', {value: {speak: u => window.__said.push(u.text), cancel() {}, getVoices: () => []}, configurable: true}); } catch (e) {} });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(120); };
  const keys = async s => { for (const k of s) await act('key', `[data-k="${k}"]`); };
  const txt = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const has = sel => p.evaluate(sel => !!document.querySelector(sel), sel);
  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
  // 1. first open in one tap
  await p.screenshot({path: OUT + '/1-welcome.png'});
  await act('sustart');
  ok(await p.evaluate(() => S.setup === true && S.settings.simple === true && S.settings.buy === false && S.settings.hand === 'right') && (await txt('#app')).includes('Your book is empty'), 'first open: one tap on Start and the book is ready');
  // 2. a new load: no "where from" screen in Simple
  await act('newcar');
  ok((await txt('.q')).includes('Take a photo') && await has('[data-act="wnophoto"]'), 'a new load starts at the bag (no "Where is it from?" first)');
  await act('wnophoto'); await act('wcolor', '[data-c="red"]'); await keys('20'); await act('wnext'); await keys('650'); await act('wnext'); await act('wdone'); await p.waitForTimeout(250);
  ok(!(await has('[data-act="wfinish"]')), 'a new load in Simple: no cost question');
  ok(await p.evaluate(() => S.cars.length === 1 && S.cars[0].items[0].count === 20 && S.cars[0].items[0].col === 'red' && S.cars[0].label === ''), 'colour, how many, price, done: a load of 20 red bags');
  // give to a new name with no place yet
  await p.fill('#gq', 'Ama'); await p.waitForTimeout(150); await act('pick', '[data-name="Ama"]'); await p.waitForTimeout(250);
  await act('gsave'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => S.entries.some(e => e.type === 'give' && person(e.pid).name === 'Ama' && e.bags === 1)), 'giving works with no place set up yet');
  // 3. close a load in one tap
  await act('carmenu', '[data-id]'); await act('closecar'); await p.waitForTimeout(200);
  const t = await txt('.sheet');
  ok(t.includes('19 bags left') && t.includes('They go to the next load') && !(await has('.sheet .radio')) && !(await p.$eval('[data-act="cldo"]', e => e.disabled)), 'close: "19 bags left. They go to the next load." and Close load is ready');
  await p.screenshot({path: OUT + '/2-close.png'});
  await act('clmore');
  ok(await has('.sheet .radio') && await p.$eval('[data-act="cldo"]', e => e.disabled), '"Something else": the five choices, and Close waits for one');
  await act('clopt', '[data-k="back"]'); await act('cldo'); await p.waitForTimeout(250);
  ok(await p.evaluate(() => S.cars[0].phase === 'out' && !S.carry), 'closing with "Sent back" does not carry bags over');
  // reopen, then close with the default: the bags go to the next load
  await p.evaluate(() => { const c = S.cars[0]; c.phase = 'giving'; S.entries = S.entries.filter(e => !(e.type === 'stock' && e.carId === c.id)); commit(); V.stack = []; V.tab = 'give'; render(); });
  await p.waitForTimeout(150); await act('carmenu', '[data-id]'); await act('closecar'); await act('cldo'); await p.waitForTimeout(250);
  ok(await p.evaluate(() => S.cars[0].phase === 'out' && S.carry === 19), 'closing with the default: the 19 bags wait for the next load');
  // 4. hold a button to hear it
  await p.evaluate(() => { window.__said.length = 0; V.stack = []; V.tab = 'book'; render(); });
  await p.waitForTimeout(150);
  const box = await p.$eval('[data-act="settings"]', e => { const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  await p.mouse.move(box[0], box[1]); await p.mouse.down(); await p.waitForTimeout(900); await p.mouse.up(); await p.waitForTimeout(200);
  ok(await p.evaluate(() => window.__said.length === 1 && /settings/i.test(window.__said[0])) && !(await has('.setpage')), 'hold the gear: the phone says "Settings" and the button does not open');
  await p.mouse.click(box[0], box[1]); await p.waitForTimeout(250);
  ok(await has('.setpage'), 'a normal tap still works');
  // turn Simple off: hold does nothing
  await act('togglesimple'); await p.evaluate(() => { window.__said.length = 0; });
  await act('back'); await p.waitForTimeout(150);
  const box2 = await p.$eval('[data-act="settings"]', e => { const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  await p.mouse.move(box2[0], box2[1]); await p.mouse.down(); await p.waitForTimeout(900); await p.mouse.up(); await p.waitForTimeout(250);
  ok(await p.evaluate(() => window.__said.length === 0) && await has('.setpage'), 'not in the Simple app: hold just taps');
  // 5. no count reminder in Simple
  await p.evaluate(() => { const car = S.cars[0]; car.phase = 'giving'; car.date = new Date(Date.now() - 2 * 36e5).toISOString(); S.settings.checkMins = 5; S.settings.simple = false; commit(); });
  ok(await p.evaluate(() => checkDue() === true), 'every button: the count reminder is due');
  await p.evaluate(() => { S.settings.simple = true; commit(); });
  ok(await p.evaluate(() => checkDue() === false), 'Simple app: no count reminder');
  // one place: no place tabs on Give bags, no place chips on Take money; two places: they come back
  await p.evaluate(() => { S.locs = [{id: 'l1', town: 'Koko Shell', spot: '', c: 0}]; S.lastLoc = 'l1'; V.stack = []; V.tab = 'give'; commit(); render(); });
  ok(!(await has('.ptabs')), 'one place: no place tabs on Give bags');
  await p.evaluate(() => { V.tab = 'collect'; render(); });
  ok(!(await has('[data-act="ftown"]')), 'one place: no place chips on Take money');
  await p.evaluate(() => { S.locs.push({id: 'l2', town: 'Bechem', spot: '', c: 1}); V.tab = 'give'; commit(); render(); });
  ok(await has('.ptabs'), 'two places: the tabs are back');
  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', String(e.message).split('\n').slice(0, 10).join(' | ')); process.exit(2); });
