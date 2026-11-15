// First open with vibes: four steps with progress dots, a moving picture, quick chips, big "What do you do?" cards.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
const fs = require('fs'), path = require('path'); const OUT = path.join(__dirname, 'out', 'onboard'); fs.mkdirSync(OUT, {recursive: true});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, hasTouch: true, isMobile: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(260); };
  const txt = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const dot = () => p.$$eval('.sudots i', els => els.findIndex(e => e.classList.contains('on')));
  const shot = n => p.screenshot({path: `${OUT}/${n}.png`});
  await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(700);
  // welcome
  ok((await txt('.brand')) === 'StallBook' && !!(await p.$('.hero-ill')) && await dot() === 0, 'welcome: the picture, "StallBook", the first dot');
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.hero-ill .onion')).animationName) === 'bob', 'the onion gently moves');
  ok(!!(await p.$('[data-act="demo"]')) && (await txt('[data-act="sunext"]')).startsWith('Start'), '"See an example" and "Start"');
  await shot('1-welcome');
  // what do you sell
  await act('sunext');
  ok((await txt('.suq')).startsWith('What do you sell?') && await dot() === 1 && (await txt('.suchips .chip.on')).includes('Onions'), 'step 2: What do you sell? Onions is chosen');
  await act('suset', '[data-v="Yams"]'); await act('suset', '[data-v="sack"]');
  ok(await p.evaluate(() => S.settings.item === 'Yams' && S.settings.unit === 'sack'), 'tap Yams and sacks: chosen');
  await act('suset', '[data-v="Onions"]'); await act('suset', '[data-v="bag"]');
  await shot('2-sell');
  // what do you do
  await act('sunext');
  const cards = await p.$$eval('.docard', els => els.map(e => [e.querySelector('b').textContent, e.classList.contains('on')]));
  ok(cards.map(c => c[0]).join('|') === 'I buy|I give on credit|I sell for cash' && !cards[0][1] && cards[1][1] && cards[2][1], 'step 3: I buy, I give on credit, I sell for cash (credit and cash chosen)');
  await act('sudo', '[data-k="buy"]');
  ok(await p.evaluate(() => document.querySelector('.docard[data-k="buy"]').classList.contains('on') && getComputedStyle(document.querySelector('.docard[data-k="buy"]')).borderTopColor === 'rgb(180, 84, 26)'), 'tap I buy: it lights up in the buying colour');
  await shot('3-do');
  // where
  await act('sunext');
  ok((await txt('.suq')).startsWith('Where do you sell?') && await dot() === 3, 'step 4: Where do you sell?');
  await act('addloc'); await p.fill('#ls_new', 'Koko Shell'); await act('lsadd'); await act('lssave');
  await shot('4-where');
  await act('suback'); ok(await dot() === 2, 'Back goes one step back'); await act('sunext');
  await act('setupdone'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => S.setup && S.settings.buy === true && V.tab === 'buy') && (await txt('.band')).startsWith('Buy bags'), 'Start my book: "I buy" turned on Buy bags, and it opens there');
  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', e.message.split('\n').slice(0, 4).join(' | ')); process.exit(2); });
