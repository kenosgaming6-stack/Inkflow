// Motion and feel, with motion switched on: rolling numbers, ink that writes, sheets you pull down,
// a place swipe that follows the finger, a page turn for a new load, report totals that count up.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/'; const OUT = require('path').join(__dirname, 'out', 'motion');
require('fs').mkdirSync(OUT, {recursive: true});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const num = t => Number(String(t).replace(/[^\d.]/g, ''));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 1, hasTouch: true, isMobile: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(60); };
  const keys = async s => { for (const k of s) await act('key', `[data-k="${k}"]`); };
  const txt = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  // a finger on an element: start at (x, y), move by dy/dx in steps, then lift
  const finger = (sel, x, y, dx, dy, lift = true) => p.evaluate(([sel, x, y, dx, dy, lift]) => {
    const el = document.querySelector(sel); const t = (cx, cy) => new Touch({identifier: 1, target: el, clientX: cx, clientY: cy});
    const fire = (type, cx, cy) => el.dispatchEvent(new TouchEvent(type, {touches: type === 'touchend' ? [] : [t(cx, cy)], changedTouches: [t(cx, cy)], bubbles: true}));
    fire('touchstart', x, y); for (let i = 1; i <= 6; i++) fire('touchmove', x + dx * i / 6, y + dy * i / 6); if (lift) fire('touchend', x + dx, y + dy);
  }, [sel, x, y, dx, dy, lift]);

  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(() => { localStorage.clear(); S = normalize(demoData()); S.setup = true; S.lastLoc = S.locs.find(l => l.town === 'Koko Shell').id; V.stack = []; V.tab = 'collect'; commit(); render(); });
  await p.waitForTimeout(400);

  // the total rolls down after a payment
  const before = num(await txt('.csum .cl b'));
  await act('pay'); await p.click('[data-act="note"][data-n="200"]'); await p.click('[data-act="note"][data-n="200"]'); await p.click('[data-act="note"][data-n="100"]');
  await act('paydone'); await p.waitForTimeout(300); await act('pfdone');
  const samples = []; for (let i = 0; i < 6; i++) { samples.push(num(await txt('.csum .cl b'))); await p.waitForTimeout(50); }
  await p.waitForTimeout(500); const after = num(await txt('.csum .cl b'));
  ok(after === before - 500, `the total is right at the end: ${before} → ${after}`);
  ok(samples.some(v => v < before && v > after), 'on the way it shows numbers in between: ' + samples.join(', '));
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.row.flash .amt small.ok')).animationName) === 'write', 'the "−₵500 ✓" under her name is written in');

  // give: the stock number rolls, the new line writes itself in
  await p.evaluate(() => { V.tab = 'give'; render(); }); await p.waitForTimeout(300);
  const left0 = num(await txt('.stock .big b'));
  await p.fill('#gq', 'Ama'); await p.waitForTimeout(80); await p.click('[data-act="pick"][data-name], [data-act="pick"][data-id]'); await p.waitForTimeout(150);
  await p.click('[data-act="gqmore"]'); await p.waitForTimeout(100); await p.click('[data-act="key"][data-k="del"]'); await keys('4'); await act('qtyuse');
  await p.waitForTimeout(800); await act('gsave');
  const leftNow = num(await txt('.stock .big b')); await p.waitForTimeout(600); const left1 = num(await txt('.stock .big b'));
  ok(left1 === left0 - 4 && leftNow !== left1, `bags left roll down: ${left0} → (${leftNow}) → ${left1}`);
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.row.flash.new .who')).animationName) === 'write', 'the new line is written in, left to right');
  await p.screenshot({path: OUT + '/1-written.png'});

  // the place swipe follows the finger, and springs back on a short drag
  await finger('#mid', 200, 400, 100, 4, false);
  const tf = await p.evaluate(() => document.getElementById('mid').style.transform);
  ok(/translateX\((\d+)px\)/.test(tf) && +tf.match(/(\d+)px/)[1] > 20, 'dragging sideways moves the list with the finger: ' + tf);
  await p.evaluate(() => { const m = document.getElementById('mid'); const t = new Touch({identifier: 1, target: m, clientX: 230, clientY: 404}); m.dispatchEvent(new TouchEvent('touchend', {touches: [], changedTouches: [t], bubbles: true})); });
  await p.waitForTimeout(350);
  const tabA = await txt('.ptabs .chip.on');
  ok(!(await p.evaluate(() => document.getElementById('mid').style.transform)), 'a short drag springs back and stays on ' + tabA);
  await finger('#mid', 300, 400, 0, 120); await p.waitForTimeout(200);
  ok(!(await p.evaluate(() => document.getElementById('mid').style.transform)), 'an up-and-down drag never moves the list sideways');

  // a sheet pulled down by its top: a little springs back, far enough closes it
  await act('carmenu'); await p.waitForTimeout(250);
  const top = await p.evaluate(() => document.querySelector('.sheet').getBoundingClientRect().top);
  await finger('.sheet', 195, top + 12, 0, 40, false);
  ok(/translateY\(40px\)/.test(await p.evaluate(() => document.querySelector('.sheet').style.transform)), 'the sheet follows the finger down');
  await p.evaluate(() => { const el = document.querySelector('.sheet'); const t = new Touch({identifier: 1, target: el, clientX: 195, clientY: 0}); el.dispatchEvent(new TouchEvent('touchend', {touches: [], changedTouches: [t], bubbles: true})); });
  await p.waitForTimeout(400);
  ok(!!(await p.$('.sheet')) && !(await p.evaluate(() => document.querySelector('.sheet').style.transform)), 'let go early: it springs back and stays open');
  const h = await p.evaluate(() => document.querySelector('.sheet').offsetHeight);
  await finger('.sheet', 195, top + 120, 0, 300); await p.waitForTimeout(300);
  ok(!!(await p.$('.sheet')), 'a drag that starts lower down (on the buttons) does not close it');
  await finger('.sheet', 195, top + 12, 0, Math.max(160, h * 0.4)); await p.waitForTimeout(350);
  ok(!(await p.$('.sheet')), 'pulled far enough: it closes');

  // the report: the total counts up over a double rule
  const cid = await p.evaluate(() => givingCar().id);
  await p.evaluate(cid => push({v: 'report', cid}), cid); await p.waitForTimeout(90);
  const r0 = num(await txt('.hero .dbl')); await p.waitForTimeout(900); const r1 = num(await txt('.hero .dbl'));
  ok(r1 > 0 && r0 < r1, `report total counts up: ${r0} … ${r1}`);
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.hero .dbl')).borderBottomStyle) === 'double', 'it sits on a double rule');
  await p.screenshot({path: OUT + '/2-report.png'});
  await p.evaluate(() => toRoot('give'));

  // a new load turns the page
  await p.evaluate(() => { S.cars.forEach(c => { c.phase = 'out'; }); commit(); render(); startWizard(); }); await p.waitForTimeout(250);
  await act('wfrom'); await act('wphoto'); await keys('12'); await act('wnext'); await keys('600'); await act('wnext'); await act('wdone'); await act('wfinish', '[data-skip]');
  await p.waitForTimeout(80);
  ok(await p.evaluate(() => { const m = document.querySelector('.mid.turn'); return !!m && getComputedStyle(m).animationName === 'turn'; }), 'the new load comes in as a page turning');
  await p.waitForTimeout(700);
  ok(num(await txt('.stock .big b')) === 12, 'and shows 12 left');

  // with Reduce Motion on, numbers jump straight to the answer and nothing turns
  const ctx2 = await b.newContext({viewport: {width: 390, height: 844}, reducedMotion: 'reduce', hasTouch: true, isMobile: true});
  const q = await ctx2.newPage(); await q.route(/fonts\.g/, r => r.abort()); await q.goto(URL); await q.waitForTimeout(300);
  await q.evaluate(() => { localStorage.clear(); S = normalize(demoData()); S.setup = true; V.stack = []; V.tab = 'give'; commit(); render(); const cid = givingCar().id; push({v: 'report', cid}); });
  await q.waitForTimeout(30);
  const rr = await q.evaluate(() => [document.querySelector('.hero .dbl').textContent, document.querySelector('.hero .dbl').dataset.v]);
  ok(Number(rr[0].replace(/[^\d.]/g, '')) === Math.abs(Number(rr[1])), 'Reduce Motion: the report total is there at once');

  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', e.message.split('\n').slice(0, 4).join(' | ')); process.exit(2); });
