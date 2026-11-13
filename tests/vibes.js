// Each job has its own world: blue paper for Give bags, green for Take money, cream ledger for Book.
// Panels stay white. On Give bags the place you are at tints the top of its page and its tab.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
const fs = require('fs'), path = require('path'); const OUT = path.join(__dirname, 'out', 'vibes'); fs.mkdirSync(OUT, {recursive: true});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, reducedMotion: 'reduce', hasTouch: true, isMobile: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const look = () => p.evaluate(() => { const g = el => el ? getComputedStyle(el) : {}; return {paper: g(document.getElementById('shell')).backgroundColor, name: g(document.querySelector('#mid .name')).color, tab: g(document.querySelector('.tab.on')).color, card: g(document.querySelector('.stock, .csum')).backgroundColor}; });
  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(() => { localStorage.clear(); S = normalize(demoData()); S.setup = true; S.lastLoc = S.locs.find(l => l.town === 'Koko Shell').id; V.stack = []; V.tab = 'give'; commit(); render(); });
  await p.waitForTimeout(300);
  const give = await look(); await p.screenshot({path: OUT + '/1-give.png'});
  await p.evaluate(() => { V.tab = 'collect'; render(); }); await p.waitForTimeout(200);
  const take = await look(); await p.screenshot({path: OUT + '/2-take-money.png'});
  await p.evaluate(() => { V.tab = 'book'; render(); }); await p.waitForTimeout(200);
  const book = await look(); await p.screenshot({path: OUT + '/3-book.png'});
  ok(give.paper === 'rgb(245, 248, 255)' && take.paper === 'rgb(242, 250, 245)' && book.paper === 'rgb(251, 247, 238)', `three papers: blue ${give.paper}, green ${take.paper}, cream ${book.paper}`);
  ok(new Set([give.name, take.name, book.name]).size === 3 && take.name === 'rgb(10, 92, 53)', `names change ink with the job: ${give.name}, ${take.name}, ${book.name}`);
  ok(new Set([give.tab, take.tab, book.tab]).size === 3, 'the bottom tab you are on takes the colour of its world');
  ok(new Set([give.card, take.card, book.card]).size === 3, 'the top card is tinted for each world');
  // panels stay white
  await p.evaluate(() => { V.tab = 'collect'; render(); }); await p.click('[data-act="pay"]'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.sheet')).backgroundColor) === 'rgb(255, 255, 255)', 'panels stay white on every tab');
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.sheet .key[data-k="7"]')).backgroundColor) === 'rgb(220, 240, 227)', 'the money pad keys are green on Take money');
  await p.screenshot({path: OUT + '/4-pay-pad.png'});
  await p.evaluate(() => closeSheet());
  // places tint their page on Give bags
  await p.evaluate(() => { V.tab = 'give'; render(); }); await p.waitForTimeout(200);
  const w1 = await p.evaluate(() => [document.getElementById('mid').style.getPropertyValue('--pw'), document.getElementById('mid').classList.contains('pw')]);
  ok(w1[1] && /rgba\(/.test(w1[0]), 'Koko Shell tints the top of its page: ' + w1[0]);
  await p.evaluate(() => { S.lastLoc = S.locs.find(l => l.town === 'Bekwai Market').id; render(); }); await p.waitForTimeout(150);
  const w2 = await p.evaluate(() => document.getElementById('mid').style.getPropertyValue('--pw'));
  ok(w2 && w2 !== w1[0], 'Bekwai Market has its own tint: ' + w2);
  ok(await p.evaluate(() => { const t = document.querySelector('.ptabs .chip.on'); return getComputedStyle(t).backgroundImage.includes('gradient'); }), 'the open place tab joins its tinted page');
  await p.screenshot({path: OUT + '/5-give-bekwai.png'});
  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', e.message.split('\n').slice(0, 4).join(' | ')); process.exit(2); });
