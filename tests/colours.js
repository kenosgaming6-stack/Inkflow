// Bag colours: with no photo, "No photo" asks "What colour is the bag?"; each kind is a drawn onion bag in its own colour
// (new load and the buy flow), and two kinds never look alike.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
const fs = require('fs'), path = require('path'); const OUT = path.join(__dirname, 'out', 'colours'); fs.mkdirSync(OUT, {recursive: true});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, reducedMotion: 'reduce', hasTouch: true, isMobile: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(120); };
  const keys = async s => { for (const k of s) await act('key', `[data-k="${k}"]`); };
  const txt = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const has = sel => p.evaluate(sel => !!document.querySelector(sel), sel);
  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(() => { localStorage.clear(); S = normalize({v: 4, settings: {item: 'Onions', unit: 'bag', price: 650}, setup: true, locs: [{id: 'l1', town: 'Koko Shell', spot: ''}], lastLoc: 'l1',
    people: [{id: 'a', name: 'Ama', phone: '', loc: 'l1', note: ''}], cars: [], entries: []}); V.stack = []; V.tab = 'give'; commit(); render(); });
  await p.waitForTimeout(200);
  // new load, first kind: No photo, red
  await act('newcar'); await act('wfrom');
  ok((await txt('.q')).includes('Take a photo') && await has('[data-act="wcam"]') && (await txt('[data-act="wnophoto"]')) === 'No photo', 'the photo step: the camera, and "No photo"');
  await act('wnophoto');
  ok((await txt('.q')) === 'What colour is the bag?' && (await p.$$('.colgrid .colbtn')).length === 8, '"No photo" asks "What colour is the bag?" with 8 colours');
  await p.screenshot({path: OUT + '/1-colours.png'});
  await act('wcolor', '[data-c="red"]');
  ok((await txt('.q')).startsWith('How many') && await has('.kimg.none svg path[fill="#C62828"]'), 'red: on to "How many", and the bag is drawn red');
  await keys('20'); await act('wnext'); await keys('650'); await act('wnext');
  // second kind: yellow
  await act('wmore'); await act('wnophoto'); await act('wcolor', '[data-c="yellow"]'); await keys('10'); await act('wnext'); await keys('600'); await act('wnext');
  await p.screenshot({path: OUT + '/2-two-kinds.png'});
  await act('wdone'); await act('wfinish', '[data-skip]'); await p.waitForTimeout(250);
  ok(await p.evaluate(() => { const it = S.cars[0].items; return it.length === 2 && it[0].col === 'red' && it[1].col === 'yellow'; }), 'the load keeps each kind\'s colour (red, yellow)');
  // give: two tiles, two different bags
  await p.evaluate(() => { V.stack = []; V.tab = 'give'; render(); }); await act('give', '[data-id="a"]'); await p.waitForTimeout(250);
  const fills = await p.$$eval('.ktile .kimg svg > path:first-of-type', els => els.map(e => e.getAttribute('fill')));
  ok(fills.length === 2 && fills[0] !== fills[1] && fills.includes('#C62828') && fills.includes('#F2B705'), 'giving: the two kinds are a red bag and a yellow bag');
  await p.screenshot({path: OUT + '/3-give.png'});
  await p.evaluate(() => closeSheet());
  // a kind with no colour and no photo (an older load) still looks different from its neighbour
  await p.evaluate(() => { S.cars[0].items.forEach(i => { i.col = ''; }); commit(); V.stack = []; render(); });
  const f2 = await p.evaluate(() => S.cars[0].items.map(i => kindCol(i)));
  ok(f2[0] !== f2[1], 'an older load with no colour: the kinds still get different colours');
  // the buy flow
  await p.evaluate(() => { S.settings.buy = true; commit(); V.stack = []; V.tab = 'buy'; render(); });
  await p.waitForTimeout(150); await act('tripnew'); await p.fill('#tp_in', 'Abidjan'); await act('tpgo');
  await act('buyadd'); await act('bnophoto');
  ok((await txt('.sheet h3')) === 'What colour is the bag?', 'buying: "No photo" asks the colour too');
  await act('bcolor', '[data-c="brown"]'); await keys('15'); await act('bnext'); await keys('500'); await act('bsave'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => { const t = buyTrip(); return t.items.length === 1 && t.items[0].col === 'brown' && t.buys.length === 1; }) && await has('.stock .leg .kimg svg path[fill="#8D5A2B"]'), 'the buy is saved with a brown bag on the card');
  await p.screenshot({path: OUT + '/4-buy.png'});
  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', String(e.message).split('\n').slice(0, 10).join(' | ')); process.exit(2); });
