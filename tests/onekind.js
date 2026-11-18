// A load with ONE kind of bag and a picture: it is the same bag tile as a load with several kinds. You tap the bag itself to
// add the count; the number sits on the bag; − is on the tile. Same in the cash panel. No picture: the number and − / + as before.
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
  const tapBag = async () => { await p.click('.sheet .ktile .kt'); await p.waitForTimeout(150); };
  const badge = async () => parseFloat(await txt('.sheet .ktile .kn'));
  await p.goto(URL); await p.waitForTimeout(300);
  const seed = (item, extra) => p.evaluate(([item, extra]) => { closeSheet(); localStorage.clear(); const d = new Date().toISOString();
    const c = document.createElement('canvas'); c.width = c.height = 60; const g = c.getContext('2d'); g.fillStyle = '#C62828'; g.fillRect(0, 0, 60, 60); g.fillStyle = '#fff'; g.fillRect(10, 10, 20, 20); phPut('ph1', c.toDataURL('image/jpeg'));
    S = normalize({v: 4, settings: Object.assign({item: 'Onions', unit: 'bag', price: 650}, extra || {}), setup: true, locs: [{id: 'l1', town: 'Koko Shell', spot: ''}], lastLoc: 'l1',
      people: [{id: 'a', name: 'Ama', phone: '', loc: 'l1', note: ''}], cars: [{id: 'c1', date: d, label: 'Abidjan', items: [Object.assign({id: 'i1', name: '', count: 40, price: 650}, item)], costs: [], phase: 'giving'}], entries: []});
    V.stack = []; V.tab = 'give'; commit(); render(); }, [item, extra]);
  // one kind with a photo: the bag tile
  await seed({photo: 'ph1'}); await p.waitForTimeout(250);
  await act('give', '[data-id="a"]');
  ok(await has('.sheet .ktiles.solo .ktile img.kimg') && !(await has('.sheet .step')), 'one kind with a photo: the bag is a tile, like a load with several kinds (no − 1 + stepper)');
  ok((await p.$$('.sheet .ktile')).length === 1 && await p.evaluate(() => { const t = document.querySelector('.sheet .ktile').getBoundingClientRect(); return t.width >= 180 && t.height >= 140; }), 'one big tile');
  ok((await txt('.sheet .ktile .kcap')).includes('650') && (await txt('.sheet .ktile .kcap')).includes('left'), 'under the bag: the price and how many are left');
  ok((await badge()) === 1 && (await txt('[data-act="gsave"]')) === 'Give 1 bag', 'the number is on the bag (1), and the button says "Give 1 bag"');
  await p.screenshot({path: OUT + '/1-tile.png'});
  await tapBag(); await tapBag();
  ok((await badge()) === 3 && (await txt('[data-act="gsave"]')) === 'Give 3 bags' && (await txt('.sheet .ktot')).includes('₵1,950'), 'tap the bag twice: 3 on the bag, "Give 3 bags", ₵1,950');
  await act('gkless');
  ok((await badge()) === 2, '− on the tile: 2');
  await act('gsave'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => S.entries.some(e => e.type === 'give' && e.bags === 2 && e.itemId === 'i1')), 'Give: 2 bags saved');
  // the cash panel
  await act('cash'); await p.waitForTimeout(200);
  ok(await has('.cashsheet .ktiles.solo .ktile img.kimg') && !(await has('.cashsheet .step')), 'the cash panel: the same bag tile');
  await tapBag(); await tapBag();
  ok((await txt('[data-act="cssave"]')).includes('₵1,950'), 'one bag to start, tap the bag twice: 3 bags, ₵1,950');
  await p.evaluate(() => closeSheet());
  // her usual number is on the bag
  await p.evaluate(() => { const d = new Date().toISOString(); S.entries.push({id: 'u1', date: d, type: 'give', pid: 'a', carId: 'c1', itemId: 'i1', bags: 4, price: 650, amount: 2600, loc: 'l1', off: d, rcpt: true}); commit(); render(); });
  await p.evaluate(() => openGive('a')); await p.waitForTimeout(200);
  ok(await has('.sheet .ktile') && (await badge()) >= 1, 'a woman who comes often: her usual number is already on the bag (' + (await badge()) + ')');
  // no picture: as before
  await seed({}); await p.waitForTimeout(200); await act('give', '[data-id="a"]');
  ok(!(await has('.sheet .ktile')) && await has('.sheet .step .num'), 'no photo and no colour: the number and − / +, as before');
  // a colour (no photo): the drawn bag is the tile
  await seed({col: 'yellow'}); await p.waitForTimeout(200); await act('give', '[data-id="a"]');
  ok(await p.evaluate(() => !!document.querySelector('.sheet .ktile svg > path[fill="#F2B705"]')), 'no photo, yellow: the drawn yellow bag is the tile');
  await tapBag(); ok((await badge()) === 2, 'and tapping it adds a bag');
  // half bags still work
  await seed({photo: 'ph1'}, {half: true}); await p.waitForTimeout(200); await act('give', '[data-id="a"]');
  ok(await has('.sheet [data-act="ghalf"]'), 'half bags on: "± ½" under the bag');
  await act('ghalf'); ok((await txt('.sheet .ktile .kn')).includes('½') || (await badge()) === 1.5, 'it makes 1½ on the bag');
  // a small phone
  await seed({photo: 'ph1'}); await p.setViewportSize({width: 320, height: 568}); await p.waitForTimeout(250); await act('give', '[data-id="a"]'); await p.waitForTimeout(250);
  ok(await p.evaluate(() => { const g = document.querySelector('[data-act="gsave"]').getBoundingClientRect(); return g.bottom <= innerHeight && document.documentElement.scrollWidth <= innerWidth; }), 'small phone: the Give button is still on screen');
  await p.screenshot({path: OUT + '/2-small.png'});
  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', String(e.message).split('\n').slice(0, 10).join(' | ')); process.exit(2); });
