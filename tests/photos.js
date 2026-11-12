// Bag kinds with photos: the new delivery flow, giving by tapping photos, and photos kept and backed up.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/'; const OUT = require('path').join(__dirname, 'out', 'photos'); const PHOTOS = __dirname + '/testphotos/';
const fs = require('fs'); fs.mkdirSync(OUT, {recursive: true});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({reducedMotion: 'reduce', viewport: {width: 390, height: 844}, deviceScaleFactor: 2, hasTouch: true, isMobile: true, acceptDownloads: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(110); };
  const keys = async s => { for (const k of s) await act('key', `[data-k="${k === 'x' ? '*' : k}"]`); };
  const txt = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const shot = n => p.screenshot({path: `${OUT}/${n}.png`});
  const photo = async f => { await p.setInputFiles('#camin', PHOTOS + f); await p.waitForTimeout(500); };

  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(() => { localStorage.clear(); });
  await p.evaluate(() => { S = normalize({v: 4, settings: {item: 'Onions', unit: 'bag', price: 600}, setup: true, locs: [{id: 'l1', town: 'Koko Shell', spot: ''}], lastLoc: 'l1', people: [{id: 'a', name: 'Ama', phone: '0241112222', loc: 'l1', note: ''}], cars: [], entries: []}); V.stack = []; V.tab = 'give'; commit(); render(); });
  await p.waitForTimeout(200);

  // the new delivery, one question at a time
  await act('newcar');
  ok((await txt('.q')).includes('Where is this load from?'), 'step 1: "Where is this load from?"');
  await p.fill('#w_label', 'Abidjan'); await act('wfrom');
  ok((await txt('.q')).includes('Take a photo of one kind of bag') && !!(await p.$('.camera')) && !!(await p.$('#camin[capture="environment"]')), 'step 2: "Take a photo of one kind of bag", a camera button that opens the back camera');
  await shot('1-camera');
  await photo('red-net.jpg');
  ok((await txt('.q')).includes('Is this the right bag?') && !!(await p.$('.photowrap img.kimg.hero')), 'the photo shows big: "Is this the right bag?"');
  const kb = await p.evaluate(() => { const it = V.w.items[0]; return {id: it.photo, len: (PH[it.photo] || '').length, w: 0}; });
  ok(kb.id && kb.len > 1000 && kb.len < 120000, `the photo is made small (${Math.round(kb.len / 1024)} KB)`);
  await shot('2-photo');
  await act('wphoto');
  ok((await txt('.q')).includes('How many of these bags?') && !!(await p.$('.photowrap img')), 'step 3: "How many of these bags?" with the photo small');
  await keys('10+4'); await act('wnext');
  ok((await txt('.q')).includes('Price for one bag?'), 'step 4: "Price for one bag?"');
  await keys('650'); await act('wnext');
  ok((await txt('.q')).includes('Another kind of bag?') && (await p.$$('.kindrow')).length === 1 && (await txt('.kindrow')).includes('14') && (await txt('.kindrow')).includes('650'), 'step 5: "Another kind of bag?" lists 14 at ₵650');
  await act('wmore'); await photo('brown-sack.jpg'); await act('wphoto'); await keys('20'); await act('wnext'); await keys('700'); await act('wnext');
  await act('wmore'); await act('wphoto'); await keys('6'); await act('wnext'); await keys('480'); await act('wnext');
  ok((await p.$$('.kindrow')).length === 3 && (await p.$$('.kstrip .kthumb')).length === 3, 'three kinds: two photos and one with no photo');
  await shot('3-kinds');
  // change one: retake the second photo
  await p.click('.kindrow >> nth=1'); await p.waitForTimeout(150);
  const before = await p.evaluate(() => V.w.items[1].photo);
  await act('wcam').catch(() => {}); await photo('white-bag.jpg');
  const after = await p.evaluate(() => V.w.items[1].photo);
  ok(before && after && before !== after, 'tap a kind to change it: retaking the photo replaces it');
  await act('wphoto'); await act('wnext'); await act('wnext');
  ok((await txt('.q')).includes('Another kind of bag?'), 'Next, Next goes back to the list with its number and price kept');
  await act('wdone');
  ok((await txt('.q')).includes('What did the load cost you?') && (await txt('.kp .key.ok')) === 'Start', 'last step: the cost, with "Start" on the keypad');
  await act('wfinish', '[data-skip]'); await p.waitForTimeout(250);
  const car = await p.evaluate(() => { const c = givingCar(); return {label: c.label, items: c.items.map(i => [i.count, i.price, !!i.photo].join(':'))}; });
  ok(car.label === 'Abidjan' && car.items.join(' ') === '14:650:true 20:700:true 6:480:false', 'the delivery starts: Abidjan, 14 × ₵650, 20 × ₵700, 6 × ₵480');
  ok((await p.$$('.stock .leg .kimg')).length === 3, 'the card shows each kind with its photo and how many are left');

  // give by tapping photos
  await p.fill('#gq', 'Ama'); await p.waitForTimeout(100); await p.click('[data-act="pick"][data-id]'); await p.waitForTimeout(150);
  ok((await p.$$('.sheet .ktile')).length === 3 && (await p.$$('.sheet .ktile img')).length === 2 && (await txt('[data-act="gsave"]')) === 'Tap a photo', 'give to Ama: three photo tiles, "Tap a photo" until one is tapped');
  await p.click('.sheet .ktile >> nth=0 >> .kt'); await p.click('.sheet .ktile >> nth=0 >> .kt'); await p.click('.sheet .ktile >> nth=0 >> .kt');
  await p.click('.sheet .ktile >> nth=1 >> .kt'); await p.click('.sheet .ktile >> nth=1 >> .kt'); await p.waitForTimeout(100);
  ok((await txt('.sheet .ktot')).includes('₵3,350') && (await txt('.sheet .ktot')).includes('5 bags') && (await txt('[data-act="gsave"]')) === 'Give 5 bags', 'three of the first, two of the second: ₵3,350, "Give 5 bags"');
  await shot('4-give-tiles');
  await p.click('.sheet .ktile >> nth=0 >> .kless'); await p.waitForTimeout(80);
  ok((await txt('.sheet .ktot')).includes('₵2,700'), 'the − on a tile takes one off (₵2,700)');
  await p.click('.sheet .ktile >> nth=0 >> .kn'); await p.waitForTimeout(150); await keys('2+2'); await act('qtyuse');
  ok((await txt('.sheet .ktile >> nth=0 >> .kn')) === '4' && (await txt('.sheet .ktot')).includes('₵4,000'), 'tap the number on a tile to type it: 2 + 2 = 4 (₵4,000)');
  await p.waitForTimeout(850); await act('gsave'); await p.waitForTimeout(250);
  const gv = await p.evaluate(() => S.entries.filter(e => e.type === 'give').map(e => [e.bags, e.price, e.amount].join(':')).join(' '));
  ok(gv === '4:650:2600 2:700:1400', 'saved as one line per kind: 4 at ₵650 and 2 at ₵700');
  ok(await p.evaluate(() => ledger('a').bal === 4000), 'Ama owes ₵4,000');
  // too many of one kind
  await p.fill('#gq', 'Ama'); await p.waitForTimeout(100); await p.click('[data-act="pick"][data-id]'); await p.waitForTimeout(150);
  await p.click('.sheet .ktile >> nth=2 >> .kn').catch(() => {});
  await p.click('.sheet .ktile >> nth=2 >> .kt'); await p.click('.sheet .ktile >> nth=2 >> .kn'); await p.waitForTimeout(150); await keys('9'); await act('qtyuse');
  await p.waitForTimeout(850); await act('gsave');
  ok((await txt('.sheet')).includes('Only 6 bags of these left'), 'nine of a kind with six left: "Only 6 bags of these left"');
  await act('gback'); await p.evaluate(() => closeSheet());

  // cash, price and count check show the photos
  await act('cash');
  ok((await p.$$('.sheet [data-act="cashitem"] img')).length === 2 && (await p.$$('.sheet [data-act="cashitem"]')).length === 3, 'sold for cash: "Which one?" shows the photos');
  await p.evaluate(() => closeSheet());
  await act('count');
  ok((await p.$$('.sheet .kimg')).length === 3 && (await txt('.sheet')).includes('The book says 10 + 18 + 6'), 'count check: one row per kind with its photo');
  await shot('5-count-kinds');
  await p.evaluate(() => closeSheet());

  // her page shows the photo on her lines
  await p.evaluate(() => push({v: 'person', pid: 'a'})); await p.waitForTimeout(250);
  ok((await p.$$('#mid .row .kimg')).length >= 1, 'her page: each line shows the kind of bag');
  await shot('6-her-page');
  await p.evaluate(() => toRoot('give'));

  // photos survive a reload, and go into the backup
  await p.reload(); await p.waitForTimeout(800);
  ok((await p.$$('.stock .leg img')).length === 2, 'after closing and opening the app the photos are still there');
  await p.evaluate(() => { V.tab = 'book'; render(); }); await act('settings');
  const [dl] = await Promise.all([p.waitForEvent('download'), act('backup')]);
  const bpath = OUT + '/backup.json'; await dl.saveAs(bpath);
  const bk = JSON.parse(fs.readFileSync(bpath, 'utf8'));
  ok(bk.photos && Object.keys(bk.photos).length === 2 && Object.values(bk.photos).every(v => v.startsWith('data:image/jpeg')), 'the backup file carries the 2 photos');
  // a new phone: no photos stored, restore brings them back
  await p.evaluate(() => new Promise(res => { Object.keys(PH).forEach(k => delete PH[k]); const r = indexedDB.deleteDatabase('stallbook-photos'); r.onsuccess = r.onerror = r.onblocked = () => res(); }));
  await p.evaluate(() => { localStorage.clear(); });
  await p.reload(); await p.waitForTimeout(600);
  ok(await p.evaluate(() => Object.keys(PH).length === 0), 'a fresh phone has no photos');
  await p.evaluate(() => { V.stack = []; V.tab = 'book'; render(); }); await act('settings');
  await p.setInputFiles('#restorefile', bpath); await p.waitForTimeout(300); await act('restoreyes'); await p.waitForTimeout(400);
  ok(await p.evaluate(() => Object.keys(PH).length === 2 && givingCar() && givingCar().items.filter(i => PH[i.photo]).length === 2), 'restore: the book and both photos are back');

  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', e.message.split('\n').slice(0, 4).join(' | ')); process.exit(2); });
