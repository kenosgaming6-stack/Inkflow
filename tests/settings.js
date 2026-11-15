// Settings with its own vibe: coloured cards with icon tiles, real switches that slide, a coloured backup status.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
const fs = require('fs'), path = require('path'); const OUT = path.join(__dirname, 'out', 'settings'); fs.mkdirSync(OUT, {recursive: true});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, reducedMotion: 'reduce', hasTouch: true, isMobile: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(90); };
  const txt = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(() => { localStorage.clear(); S = normalize({v: 4, settings: {item: 'Onions', unit: 'bag', price: 600}, setup: true, locs: [{id: 'l1', town: 'Koko Shell', spot: ''}, {id: 'l2', town: 'Bechem', spot: ''}], lastLoc: 'l1', people: [{id: 'a', name: 'Ama', phone: '', loc: 'l1', note: ''}], cars: [], entries: []}); V.stack = []; V.tab = 'book'; commit(); render(); });
  await p.waitForTimeout(150); await act('settings'); await p.waitForTimeout(150);
  const cards = await p.$$eval('.scard', els => els.map(e => [e.querySelector('header b').textContent, getComputedStyle(e).borderTopColor, getComputedStyle(e.querySelector('header .mi')).backgroundColor]));
  ok(cards.length >= 7 && cards.map(c => c[0]).join('|').startsWith('Your business|Places|Buying|Counting|Receipts|Sound and voice|Keep your book safe|Help|Delete'), 'Settings is cards: ' + cards.map(c => c[0]).join(', '));
  ok(new Set(cards.map(c => c[1])).size >= 6 && cards.every(c => c[1] === c[2]), 'each card has its own colour, on its top edge and its icon tile');
  ok(await p.evaluate(() => getComputedStyle(document.getElementById('mid')).backgroundColor) === 'rgb(238, 241, 246)' && await p.evaluate(() => getComputedStyle(document.querySelector('.scard')).backgroundColor) === 'rgb(255, 255, 255)', 'white cards on their own cool page');
  ok((await txt('.savestat')) === 'Never saved' && await p.evaluate(() => getComputedStyle(document.querySelector('.savestat')).color) === 'rgb(209, 43, 54)', 'the book was never saved: a red "Never saved"');
  ok((await p.$$('.scard .pdot')).length === 2, 'places show with their colour dots');
  await p.screenshot({path: OUT + '/1-top.png'});
  // switches
  const sw = await p.$eval('[data-act="togglebuy"]', e => [e.className, e.getAttribute('aria-pressed')]);
  ok(sw[0].includes('switch') && !sw[0].includes(' on') && sw[1] === 'false', 'Buying trips is a switch, off');
  await act('togglebuy');
  const sw2 = await p.$eval('[data-act="togglebuy"]', e => [e.className, e.getAttribute('aria-pressed'), getComputedStyle(e).backgroundColor]);
  ok(sw2[0].includes('on') && sw2[1] === 'true' && sw2[2] === 'rgb(180, 84, 26)' && await p.evaluate(() => S.settings.buy === true), 'tap it: on, filled with the Buying colour, and Buy bags is on');
  ok(sw2[0].includes('just'), 'the switch you tapped slides its knob');
  await act('togglevoice'); ok(await p.evaluate(() => S.settings.voice === true), 'Speak out loud switch works');
  await act('togglehalf'); ok(await p.evaluate(() => S.settings.half === true), 'Half bags switch works');
  await act('setseg', '[data-k="checkMins"][data-v="5"]'); ok(await p.evaluate(() => S.settings.checkMins === 5), 'Count the car every 5 min');
  // the fields still save
  await p.fill('#s_item', 'Yams'); await p.waitForTimeout(100);
  ok(await p.evaluate(() => S.settings.item === 'Yams'), 'what you sell still saves');
  await p.fill('#s_item', 'Onions');
  // saved recently
  await p.evaluate(() => { S.lastBackup = new Date(Date.now() - 2 * 864e5 - 1000).toISOString(); commit(); render(); }); await p.waitForTimeout(100);
  ok((await txt('.savestat')) === 'Saved 2 days ago' && await p.evaluate(() => getComputedStyle(document.querySelector('.savestat')).color) === 'rgb(18, 128, 74)', 'saved two days ago: green');
  await p.evaluate(() => document.querySelector('.scard:last-of-type').scrollIntoView()); await p.waitForTimeout(100);
  await p.screenshot({path: OUT + '/2-bottom.png'});
  // a small phone
  await p.setViewportSize({width: 320, height: 568}); await p.waitForTimeout(250);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth && [...document.querySelectorAll('.switch')].every(x => x.getBoundingClientRect().right <= innerWidth)), 'small phone: cards and switches fit');
  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', e.message.split('\n').slice(0, 4).join(' | ')); process.exit(2); });
