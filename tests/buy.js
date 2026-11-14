// Buy bags: the buying trip. Off by default; on, it is the first tab. Each buy is a line (photo, how many, paid for one);
// the card shows bags bought, money spent and what is left. "Car is here" turns the trip into a load: only selling prices are asked.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
const fs = require('fs'), path = require('path'); const OUT = path.join(__dirname, 'out', 'buy'); fs.mkdirSync(OUT, {recursive: true});
const PHOTOS = path.join(__dirname, 'testphotos');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, reducedMotion: 'reduce', hasTouch: true, isMobile: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(90); };
  const keys = async s => { for (const k of s) await act('key', `[data-k="${k}"]`); };
  const txt = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const shot = n => p.screenshot({path: `${OUT}/${n}.png`});
  const photo = async (sel, f) => { await p.setInputFiles(sel, path.join(PHOTOS, f)); await p.waitForTimeout(500); };
  const tabs = () => p.$$eval('.tabs .tab span:not(.badge):not(.tabdot)', els => els.map(e => e.textContent));

  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(() => { localStorage.clear(); S = normalize({v: 4, settings: {item: 'Onions', unit: 'bag', price: 600}, setup: true, locs: [{id: 'l1', town: 'Koko Shell', spot: ''}], lastLoc: 'l1', people: [{id: 'a', name: 'Ama', phone: '', loc: 'l1', note: ''}], cars: [], entries: []}); V.stack = []; V.tab = 'give'; commit(); render(); });
  await p.waitForTimeout(200);
  ok((await tabs()).join('|') === 'Give bags|Take money|Book', 'off at first: three tabs, the app is as before');

  await p.evaluate(() => { V.tab = 'book'; render(); }); await act('settings');
  await act('togglebuy'); await p.evaluate(() => toRoot('buy')); await p.waitForTimeout(150);
  ok((await tabs()).join('|') === 'Buy bags|Give bags|Take money|Book', 'switched on: Buy bags is the first of four tabs');
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.band')).backgroundColor) === 'rgb(180, 84, 26)' && await p.evaluate(() => getComputedStyle(document.getElementById('shell')).backgroundColor) === 'rgb(255, 246, 236)', 'Buy bags has its own world: clay band, warm paper');
  await shot('1-empty');

  // start a trip
  await act('tripnew'); await p.fill('#tp_in', 'Abidjan'); await act('tpgo');
  ok((await txt('.band')).includes('Abidjan') && (await txt('.stock .big')).startsWith('0'), 'Start buying: "Abidjan" in the band, 0 bought');
  // first buy: photo, 20, ₵450
  await act('buyadd');
  ok((await txt('.sheet h3')) === 'Photo of this kind', 'the first buy asks for a photo of the kind');
  await photo('#bcamin', 'red-net.jpg');
  ok((await txt('.sheet .title b')) === 'How many bags?' && !!(await p.$('.sheet .hrow img.kimg')), 'then "How many bags?" with the photo');
  await keys('20'); await act('bnext');
  ok((await txt('.sheet .title b')) === 'Paid for one bag?', 'then "Paid for one bag?"');
  await keys('450'); await act('bsave'); await p.waitForTimeout(150);
  ok((await txt('#mid .row .name')) === '20 bags × ₵450' && (await txt('#mid .row .amt')) === '₵9,000', 'line: 20 bags × ₵450 = ₵9,000');
  // second buy: a new kind
  await act('buyadd');
  ok((await p.$$('.sheet .ktiles button')).length === 2 && !!(await p.$('.sheet .ktiles img')), '"Which kind?": the red net photo, and New kind');
  await act('bnew'); await photo('#bcamin', 'brown-sack.jpg'); await keys('15'); await act('bnext'); await keys('520'); await act('bsave'); await p.waitForTimeout(120);
  // third: the red net again, same price as before
  await act('buyadd'); await p.click('.sheet .ktiles button >> nth=0'); await p.waitForTimeout(100); await keys('10'); await act('bnext');
  ok((await txt('[data-act="blast"]')).includes('₵450'), '"Same as before · ₵450"');
  await act('blast'); await p.waitForTimeout(120);
  ok(await p.evaluate(() => { const t = buyTrip(); return t.buys.length === 3 && t.items.length === 2 && tripStats(t).bags === 45 && tripStats(t).spent === 21300; }), 'three buys, two kinds: 45 bags, ₵21,300 spent');
  ok((await txt('.stock .big b')) === '45' && (await txt('.stock .spent b')) === '₵21,300' && (await p.$$('.stock .leg .kimg')).length === 2, 'the card: 45 bought, ₵21,300 spent, each kind with its photo');
  // money you came with
  await act('tripcash'); await keys('25000'); await act('numsave'); await p.waitForTimeout(150);
  ok((await txt('.cashleft')).includes('Came with ₵25,000') && (await txt('.cashleft')).includes('₵3,700 left'), 'came with ₵25,000: ₵3,700 left');
  await shot('2-trip');
  // fix a line: the first was really 18
  await p.click('#mid .row >> nth=0'); await p.waitForTimeout(120); await act('buyfix');
  await act('key', '[data-k="del"]'); await act('key', '[data-k="del"]'); await keys('18'); await act('bnext');
  ok((await txt('.sheet .disp .v')).includes('450'), 'changing it keeps the price it had');
  await act('bsave'); await p.waitForTimeout(120);
  ok((await txt('#mid .row >> nth=0 >> .name')) === '18 bags × ₵450' && await p.evaluate(() => tripStats(buyTrip()).spent) === 20400, 'changed: 18 × ₵450, spent now ₵20,400');

  // done buying, on the way
  await act('tripmenu'); await act('tripdone'); await p.waitForTimeout(150);
  ok((await txt('#mid')).includes('On the way') && !!(await p.$('[data-act="tripcar"]')), 'Done buying: the trip shows "On the way" with "Car is here"');
  await p.evaluate(() => { V.tab = 'give'; render(); }); await p.waitForTimeout(150);
  ok((await txt('[data-act="tripcar"]')).includes('Car is here · Abidjan · 43 bags'), 'Give bags shows the button: "Car is here · Abidjan · 43 bags"');
  await shot('3-car-is-here');

  // car is here: only the selling prices
  await act('tripcar'); await p.waitForTimeout(150);
  ok((await txt('.q')).includes('Selling price for one bag?') && (await txt('.qs')).includes('You paid ₵450') && (await txt('.qs')).includes('28 bags'), 'Car is here: "Selling price for one bag?" and "You paid ₵450 · 28 bags"');
  await shot('4-selling-price');
  await keys('650'); await act('wnext');
  ok((await txt('.qs')).includes('You paid ₵520'), 'then the next kind: "You paid ₵520"');
  await keys('700'); await act('wnext');
  ok((await p.$$('.kindrow')).length === 2, 'both kinds listed with their counts and prices');
  await act('wdone');
  ok((await txt('.disp .v')).includes('20,400'), 'the load cost starts with what you paid for the onions (₵20,400)');
  await act('key', '[data-k="+"]'); await keys('3000'); await act('wfinish'); await p.waitForTimeout(250);
  const car = await p.evaluate(() => { const c = givingCar(); return c && {label: c.label, items: c.items.map(i => [i.count, i.price, !!i.photo].join(':')).join(' '), cost: sum(c.costs, x => x.amount), trip: c.tripId && tripById(c.tripId).carId === c.id}; });
  ok(car && car.label === 'Abidjan' && car.items === '28:650:true 15:700:true' && car.cost === 23400 && car.trip, 'the load starts: Abidjan, 28 at ₵650 and 15 at ₵700 with their photos, cost ₵23,400 (onions + driver)');
  ok((await txt('.band')).startsWith('Give bags') && (await txt('.stock .big b')) === '43', 'you are on Give bags with 43 left');
  await p.evaluate(() => { V.tab = 'buy'; render(); }); await p.waitForTimeout(120);
  ok((await txt('#mid')).includes('arrived') && !(await p.$('[data-act="tripcar"]')), 'the trip is kept under Trips as "arrived"');

  // a small phone: four tabs fit
  await p.setViewportSize({width: 320, height: 568}); await p.waitForTimeout(250);
  ok(await p.evaluate(() => [...document.querySelectorAll('.tabs .tab span:not(.badge):not(.tabdot)')].every(s => s.scrollWidth <= s.parentElement.clientWidth + 1) && document.documentElement.scrollWidth <= innerWidth), 'small phone: the four tab names fit');
  await shot('5-small');
  // switched off again
  await p.evaluate(() => { V.tab = 'book'; render(); }); await act('settings'); await act('togglebuy'); await p.evaluate(() => toRoot()); await p.waitForTimeout(100);
  ok((await tabs()).length === 3, 'switched off: three tabs again');

  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', e.message.split('\n').slice(0, 4).join(' | ')); process.exit(2); });
