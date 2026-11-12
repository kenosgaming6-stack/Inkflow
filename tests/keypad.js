// The calculator pad in the real app: money pad, new delivery, bag count. Plus screenshots of the new look.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/'; const OUT = require('path').join(__dirname, 'out', 'keypad');
require('fs').mkdirSync(OUT, {recursive: true});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({reducedMotion: 'reduce', viewport: {width: 390, height: 844}, deviceScaleFactor: 2, hasTouch: true, isMobile: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const key = async k => { await p.click(`[data-act="key"][data-k="${k}"]`); await p.waitForTimeout(40); };
  const keys = async s => { for (const k of s) await key(k === 'x' ? '*' : k); };
  const holdDel = async () => { const bx = await (await p.$('[data-act="key"][data-k="del"]')).boundingBox(); await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await p.mouse.down(); await p.waitForTimeout(700); await p.mouse.up(); await p.waitForTimeout(80); };
  const layout = () => p.$$eval('.kp > *', els => els.map(e => e.tagName === 'SPAN' ? '_' : (e.classList.contains('ok') ? 'OK' : (e.dataset.k === 'del' ? 'DEL' : e.textContent.trim()))).join(' '));
  const txt = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const shot = n => p.screenshot({path: `${OUT}/${n}.png`});
  await p.goto(URL); await p.waitForTimeout(400);
  ok(await p.evaluate(() => exprVal('5+6+7+8') === 26 && exprVal('3*650+2*700') === 3350 && exprVal('10-3*2') === 4 && exprVal('12+') === 12 && exprVal('') === 0), 'sums: 5+6+7+8=26, 3×650+2×700=3,350, 10−3×2=4');
  ok(await p.evaluate(() => exprAdd('5', '+') === '5+' && exprAdd('5+', '*') === '5*' && exprAdd('', '+') === '' && exprAdd('5+6', 'del') === '5+' && exprAdd('5+6', 'c') === '' && exprAdd('0', '00') === '0' && exprAdd('5', '00') === '500'), 'keys: a second sign replaces the first, C clears, ⌫ deletes one');

  await p.evaluate(() => { S = normalize(demoData()); S.setup = true; S.lastLoc = S.locs.find(l => l.town === 'Koko Shell').id; V.stack = []; V.tab = 'give'; commit(); render(); });
  await p.waitForTimeout(400);
  ok((await txt('.band')).startsWith('Give bags') && /No \d{3}/.test(await txt('.band .pageno')), 'Give has a blue band with the page number: ' + await txt('.band'));
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.band')).backgroundColor) === 'rgb(29, 63, 187)', 'the Give band is pen blue');
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.stock .big b')).fontFamily.startsWith('"Barlow Condensed"')), 'the big number is in the painted face');
  ok(await p.evaluate(async () => { await document.fonts.ready; return [...document.fonts].some(f => f.family.includes('Barlow') && f.status === 'loaded'); }), 'the number face is loaded from the app\'s own files');
  await shot('1-give');

  // money pad: notes and the calculator together
  await p.evaluate(() => { V.tab = 'collect'; render(); }); await p.waitForTimeout(300);
  ok((await txt('.band')).startsWith('Take money') && await p.evaluate(() => getComputedStyle(document.querySelector('.band')).backgroundColor) === 'rgb(18, 128, 74)', 'Take money has a green band');
  await shot('2-collect');
  await p.click('[data-act="pay"]'); await p.waitForTimeout(250);
  await keys('3x200'); await p.click('[data-act="note"][data-n="100"]'); await p.waitForTimeout(80);
  ok((await txt('.sheet .disp .tape')).includes('3 × 200 + 100') && (await txt('.sheet .disp .v')).includes('700'), 'money pad: 3 × 200, then the 100 note: tape "3 × 200 + 100", total ₵700');
  await shot('3-paypad');
  ok(await layout() === '7 8 9 × 4 5 6 − 1 2 3 + 00 0 DEL OK' && (await txt('.kp .key.ok')) === 'Done', 'money pad laid out like the iPhone: 7 8 9 × / 4 5 6 − / 1 2 3 + / 00 0 ⌫ Done');
  ok(!(await p.$('[data-act="key"][data-k="c"]')), 'there is no C key');
  await key('del'); ok((await txt('.sheet .disp .tape')).includes('3 × 200 + 10'), 'tap ⌫: one digit goes (… + 10)');
  await holdDel(); ok((await txt('.sheet .disp .v')).replace(/\s/g, '') === '₵0' && !(await txt('.sheet .disp .tape')), 'hold ⌫: the whole sum is cleared');
  await key('5'); ok((await txt('.sheet .disp .v')).includes('5'), 'after a hold, the next key types normally');
  await p.evaluate(() => closeSheet());

  // new delivery: count with +
  await p.evaluate(() => { S.cars.forEach(c => { c.phase = 'out'; }); commit(); V.tab = 'give'; render(); startWizard(); }); await p.waitForTimeout(300);
  await p.click('[data-act="wfrom"]'); await p.waitForTimeout(150); await p.click('[data-act="wphoto"]'); await p.waitForTimeout(150);
  await holdDel(); await keys('5+6+7+8');
  ok((await txt('.disp .tape')).includes('5 + 6 + 7 + 8') && (await txt('.disp .v')).startsWith('26'), 'new delivery: "5 + 6 + 7 + 8" shows 26 bags');
  await shot('4-newcount');
  ok((await layout()).startsWith('7 8 9 × 4 5 6 − 1 2 3 + 0 DEL'), 'a bag count pad has a wide 0 and no 00');
  await p.click('[data-act="wnext"]'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => V.w.items[0].count === 26), 'Next saves 26 bags');
  await keys('650'); await p.click('[data-act="wnext"]'); await p.waitForTimeout(150);
  await p.click('[data-act="wdone"]'); await p.waitForTimeout(150); await p.click('[data-act="wfinish"][data-skip]'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => { const c = givingCar(); return c && c.items[0].count === 26 && c.items[0].price === 650; }), 'the delivery starts with 26 bags at ₵650');

  // bag count on the give sheet: type 2+3
  await p.fill('#gq', 'Ama'); await p.waitForTimeout(100); await p.click('[data-act="pick"][data-name]'); await p.waitForTimeout(150);
  await p.click('[data-act="gqmore"]'); await p.waitForTimeout(150); await keys('2+3');
  ok((await txt('.sheet .disp .tape')).includes('2 + 3') && (await txt('[data-act="qtyuse"]')) === 'Use 5' && await p.evaluate(() => document.querySelector('[data-act="qtyuse"]').classList.contains('ok')), 'bag count: 2 + 3, the bottom-right key says "Use 5"');
  await shot('5-qty');
  await p.click('[data-act="qtyuse"]'); await p.waitForTimeout(150);
  ok((await txt('.sheet .step .num')).startsWith('5'), 'the give sheet now says 5 bags');
  await p.evaluate(() => closeSheet());
  await p.evaluate(() => { V.tab = 'book'; render(); }); await p.waitForTimeout(250);
  ok((await txt('.band')).startsWith('Book') && !(await txt('.top')).includes('Book'), 'Book has a black band and no second "Book" title');
  await shot('6-book');

  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', e.message.split('\n').slice(0, 4).join(' | ')); process.exit(2); });
