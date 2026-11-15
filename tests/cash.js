// Cash is as important as credit: a big green Cash button on the right, a cash panel (several bags, several kinds),
// every cash sale its own big line, cash on the load card, and cash in today's money.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
const fs = require('fs'), path = require('path'); const OUT = path.join(__dirname, 'out', 'cash'); fs.mkdirSync(OUT, {recursive: true});
const photo = f => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'testphotos', f)).toString('base64');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, reducedMotion: 'reduce', hasTouch: true, isMobile: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(90); };
  const txt = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const shot = n => p.screenshot({path: `${OUT}/${n}.png`});
  const left = async () => txt('.stock .big b');
  const setup = items => p.evaluate(([items, ph]) => {
    localStorage.clear(); PH.r = ph[0]; PH.b = ph[1];
    S = normalize({v: 4, settings: {item: 'Onions', unit: 'bag', price: 650}, setup: true, locs: [{id: 'l1', town: 'Koko Shell', spot: ''}], lastLoc: 'l1',
      people: [{id: 'a', name: 'Ama', phone: '', loc: 'l1', note: ''}],
      cars: [{id: 'c1', date: new Date().toISOString(), label: 'Wankai', items, costs: [], phase: 'giving'}], entries: []});
    V.stack = []; V.tab = 'give'; commit(); render();
  }, [items, [photo('red-net.jpg'), photo('brown-sack.jpg')]]);

  await p.goto(URL); await p.waitForTimeout(300);
  await setup([{id: 'i1', name: '', count: 20, price: 650}]); await p.waitForTimeout(200);
  // the button
  const pos = await p.evaluate(() => { const c = document.querySelector('[data-act="cash"]').getBoundingClientRect(), f = document.querySelector('.find').getBoundingClientRect(); return {right: c.left > f.right, h: c.height, fh: f.height, bg: getComputedStyle(document.querySelector('[data-act="cash"]')).backgroundColor}; });
  ok(pos.right && pos.h >= pos.fh - 1 && pos.bg === 'rgb(18, 128, 74)' && (await txt('[data-act="cash"]')) === 'Cash', 'Cash is a big green button on the right, as tall as the name box');
  // one kind: the panel opens at 1
  await act('cash');
  ok((await txt('.sheet .cashhead')) === 'Cash sale' && (await txt('.sheet .step .num')).startsWith('1') && (await txt('[data-act="cssave"]')) === 'Sold · ₵650', 'the green panel opens with 1 bag: "Sold · ₵650"');
  await act('csk'); await act('csk');
  ok((await txt('.sheet .ktot')).includes('₵1,950') && (await txt('[data-act="cssave"]')) === 'Sold · ₵1,950', '+ + makes 3 bags: ₵1,950');
  await shot('1-panel');
  await act('cssave'); await p.waitForTimeout(150);
  ok(await left() === '17' && (await p.$$('#mid .cashrow')).length === 1 && (await txt('#mid .cashrow .name')) === 'Cash' && (await txt('#mid .cashrow .qbox')) === '3' && (await txt('#mid .cashrow .sub')).includes('₵1,950'), 'saved: 17 left, one big CASH line with 3 and ₵1,950');
  // a woman's give and another cash sale: each its own line, in time order
  await p.evaluate(() => openGive('a')); await p.waitForTimeout(150); await p.waitForTimeout(820); await act('gsave'); await p.waitForTimeout(150);
  await p.waitForTimeout(850); await act('cash'); await act('cssave'); await p.waitForTimeout(150);
  const order = await p.$$eval('#mid .row', els => els.map(r => r.classList.contains('cashrow') ? 'cash' : (r.querySelector('.name') || {}).textContent));
  ok(order.join(',') === 'cash,Ama,cash', 'every sale is its own line, in order: ' + order.join(', '));
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('#mid .cashrow')).minHeight === getComputedStyle(document.querySelector('#mid .row:not(.cashrow)')).minHeight), 'a cash line is as big as a woman\'s line');
  // the card
  ok((await txt('.stock .leg .c')) === '4 cash' && await p.evaluate(() => parseFloat(document.querySelector('.sbar .c').style.width) > 0), 'the card shows "4 cash" in green, with a green part in the bar');
  await shot('2-lines');
  // change and remove
  await p.click('#mid .cashrow >> nth=0'); await p.waitForTimeout(120);
  ok((await txt('.sheet .cashhead')).includes('₵1,950'), 'tap a cash line: its panel');
  await act('cashedit'); await act('csless'); await p.waitForTimeout(850); await act('cssave'); await p.waitForTimeout(150);
  ok((await txt('#mid .cashrow >> nth=0 >> .qbox')) === '2' && await left() === '16', 'changed to 2 bags, still the first line: 16 left');
  await p.click('#mid .cashrow >> nth=1'); await p.waitForTimeout(120); await act('cashdrop'); await act('cashdropyes'); await p.waitForTimeout(150);
  ok((await p.$$('#mid .cashrow')).length === 1 && await left() === '17', 'removed the last cash sale: 17 left');
  // money in today
  await p.evaluate(() => { V.tab = 'collect'; render(); }); await p.waitForTimeout(200);
  ok((await txt('.csum .cr b')) === '₵1,300' && (await txt('.csum .cashsm')).includes('₵1,300 cash sales'), 'Take money: "In today" counts cash sales (₵1,300) and says so in green');
  await p.evaluate(() => { V.tab = 'book'; render(); }); await p.waitForTimeout(200);
  ok((await txt('.csum .cr b')) === '₵1,300', 'Book: this week counts cash sales');

  // several kinds: tap the photos
  await setup([{id: 'i1', name: 'Red net', count: 10, price: 650, photo: 'r'}, {id: 'i2', name: 'Brown sack', count: 10, price: 700, photo: 'b'}]); await p.waitForTimeout(200);
  await act('cash');
  ok((await p.$$('.sheet .ktile')).length === 2 && (await txt('[data-act="cssave"]')) === 'Tap a photo', 'several kinds: the photo tiles, "Tap a photo"');
  await p.click('.sheet .ktile >> nth=0 >> .kt'); await p.click('.sheet .ktile >> nth=1 >> .kt'); await p.click('.sheet .ktile >> nth=1 >> .kt'); await p.waitForTimeout(80);
  ok((await txt('[data-act="cssave"]')) === 'Sold · ₵2,050', '1 red net and 2 brown sacks: "Sold · ₵2,050"');
  await shot('3-kinds');
  await act('cssave'); await p.waitForTimeout(150);
  ok((await p.$$('#mid .cashrow')).length === 1 && (await p.$$eval('#mid .cashrow .kc b', els => els.map(e => e.textContent).join(' '))) === '1 2', 'one cash line with both photos: 1 and 2');
  // too many
  await p.waitForTimeout(850); await act('cash'); await p.click('.sheet .ktile >> nth=0 >> .kn').catch(() => {});
  await p.click('.sheet .ktile >> nth=0 >> .kt'); await p.click('.sheet .ktile >> nth=0 >> [data-act="csn"]'); await p.waitForTimeout(100);
  await act('key', '[data-k="2"]'); await act('key', '[data-k="0"]'); await act('qtyuse'); await act('cssave');
  ok((await txt('.sheet h3')).includes('Only 9 bags left'), 'selling 20 with 9 left: "Only 9 bags left"');
  await act('csback'); await p.evaluate(() => closeSheet());

  // a small phone
  await p.setViewportSize({width: 320, height: 568}); await p.waitForTimeout(250);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.querySelector('[data-act="cash"]').getBoundingClientRect().right <= innerWidth), 'small phone: the Cash button and the lines fit');
  await shot('4-small');

  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', e.message.split('\n').slice(0, 4).join(' | ')); process.exit(2); });
