// A load with ONE kind of bag: its picture (the photo, or the drawn bag in its colour) shows above the number, and tapping it
// gives one more, like the picture tiles of a load with several kinds. Same in the cash sale panel. No photo and no colour:
// nothing changes.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
const fs = require('fs'), path = require('path'); const OUT = path.join(__dirname, 'out', 'onekind'); fs.mkdirSync(OUT, {recursive: true});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, reducedMotion: 'reduce', hasTouch: true, isMobile: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(150); };
  const txt = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const has = sel => p.evaluate(sel => !!document.querySelector(sel), sel);
  await p.goto(URL); await p.waitForTimeout(300);
  const num = async () => parseFloat(await txt('.sheet .step .num'));
  const seed = item => p.evaluate(item => { closeSheet(); localStorage.clear(); const d = new Date().toISOString();
    const c = document.createElement('canvas'); c.width = c.height = 60; const g = c.getContext('2d'); g.fillStyle = '#C62828'; g.fillRect(0, 0, 60, 60); g.fillStyle = '#fff'; g.fillRect(10, 10, 20, 20); phPut('ph1', c.toDataURL('image/jpeg'));
    S = normalize({v: 4, settings: {item: 'Onions', unit: 'bag', price: 650}, setup: true, locs: [{id: 'l1', town: 'Koko Shell', spot: ''}], lastLoc: 'l1',
      people: [{id: 'a', name: 'Ama', phone: '', loc: 'l1', note: ''}], cars: [{id: 'c1', date: d, label: 'Abidjan', items: [Object.assign({id: 'i1', name: '', count: 40, price: 650}, item)], costs: [], phase: 'giving'}], entries: []});
    V.stack = []; V.tab = 'give'; commit(); render(); }, item);
  // one kind with a photo
  await seed({photo: 'ph1'}); await p.waitForTimeout(250);
  await act('give', '[data-id="a"]');
  ok(await has('.sheet .kt1 img.kimg') && await p.evaluate(() => { const i = document.querySelector('.sheet .kt1').getBoundingClientRect(), s = document.querySelector('.sheet .step').getBoundingClientRect(); return i.width >= 80 && i.height >= 80 && i.bottom <= s.top + 1; }), 'one kind with a photo: the photo shows, big, above the number');
  await p.screenshot({path: OUT + '/1-photo.png'});
  const start = await num();
  await act('gplus', '.kt1'); await act('gplus', '.kt1');
  ok((await num()) === start + 2, 'tap the picture twice: two more bags (' + start + ' to ' + (await num()) + ')');
  await p.click('.sheet .step .key:last-child'); await p.waitForTimeout(100); await p.click('.sheet .step .key:first-child'); await p.waitForTimeout(100);
  const want = await num();
  await act('gsave'); await p.waitForTimeout(300);
  ok(await p.evaluate(w => S.entries.some(e => e.type === 'give' && e.bags === w), want), 'Give: ' + want + ' bags saved');
  // the cash panel
  await act('cash'); await p.waitForTimeout(200);
  ok(await has('.cashsheet .kt1 img.kimg'), 'the cash panel shows the photo too');
  await act('csk', '.kt1'); await act('csk', '.kt1');
  ok((await txt('[data-act="cssave"]')).includes('₵1,950'), 'one bag to start, tap it twice: 3 bags, ₵1,950');
  await p.evaluate(() => closeSheet());
  // one kind with a colour, no photo
  await seed({col: 'yellow'}); await p.waitForTimeout(200); await act('give', '[data-id="a"]');
  ok(await has('.sheet .kt1 svg') && await p.evaluate(() => !!document.querySelector('.sheet .kt1 svg > path[fill="#F2B705"]')), 'no photo, yellow: the drawn yellow bag shows and can be tapped');
  await act('gplus', '.kt1'); ok(await p.evaluate(() => V.g.bags >= 2), 'and it adds a bag');
  // no photo and no colour: as before
  await seed({}); await p.waitForTimeout(200); await act('give', '[data-id="a"]');
  ok(!(await has('.sheet .kt1')) && await has('.sheet .step .num'), 'no photo and no colour: just the number, as before');
  // a small phone
  await seed({photo: 'ph1'}); await p.setViewportSize({width: 320, height: 568}); await p.waitForTimeout(250); await act('give', '[data-id="a"]'); await p.waitForTimeout(250);
  ok(await p.evaluate(() => { const g = document.querySelector('[data-act="gsave"]').getBoundingClientRect(); return g.bottom <= innerHeight && document.documentElement.scrollWidth <= innerWidth; }), 'small phone: the Give button is still on screen');
  await p.screenshot({path: OUT + '/2-small.png'});
  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', String(e.message).split('\n').slice(0, 10).join(' | ')); process.exit(2); });
