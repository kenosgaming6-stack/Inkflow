// Customer photos: off by default, and while off no camera shows anywhere. Turned on in Settings, her circle on her
// own page takes a photo; it then shows wherever her circle is, goes in the backup, and can be removed. Turned off,
// the letters come back.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
const fs = require('fs'), path = require('path'); const OUT = path.join(__dirname, 'out', 'faces'); fs.mkdirSync(OUT, {recursive: true});
const PHOTO = path.join(__dirname, 'testphotos', 'red-net.jpg');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, reducedMotion: 'reduce', hasTouch: true, isMobile: true, acceptDownloads: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(110); };
  const txt = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const cams = () => p.evaluate(() => document.querySelectorAll('[data-act="face"], #facein, .avcam').length);
  const herPage = async () => { await p.evaluate(() => { V.stack = []; V.tab = 'book'; render(); push({v: 'person', pid: 'w0'}); }); await p.waitForTimeout(150); };
  await p.goto(URL); await p.waitForTimeout(300);
  ok(await p.evaluate(() => blank().settings.faces === false && normalize({v: 4, settings: {item: 'Onions'}}).settings.faces === false), 'off for a new book and for an old book');
  ok(await p.evaluate(() => !CB_SET.includes('faces')), 'the switch stays on this phone (the cloud book does not carry it)');
  await p.evaluate(() => { localStorage.clear(); const d = n => new Date(Date.now() - n * 864e5).toISOString();
    S = normalize({v: 4, settings: {item: 'Onions', unit: 'bag', price: 650}, setup: true, locs: [{id: 'l1', town: 'Koko Shell', spot: ''}], lastLoc: 'l1',
      people: ['Ama', 'Esi'].map((n, i) => ({id: 'w' + i, name: n, phone: '', loc: 'l1', note: ''})),
      cars: [{id: 'c1', date: d(3), label: 'Abidjan', items: [{id: 'i1', name: '', count: 40, price: 650}], costs: [], phase: 'giving'}],
      entries: [{id: 'g0', date: d(2), type: 'give', pid: 'w0', carId: 'c1', itemId: 'i1', bags: 3, price: 650, amount: 1950, loc: 'l1', off: d(2), rcpt: true}]});
    V.stack = []; V.tab = 'give'; commit(); render(); });
  await p.waitForTimeout(200);
  // off: no camera on Give bags, Take money, the Book or her page
  let none = (await cams()) === 0;
  for (const t of ['collect', 'book']) { await p.evaluate(t => { V.tab = t; render(); }, t); await p.waitForTimeout(120); none = none && (await cams()) === 0; }
  await herPage(); none = none && (await cams()) === 0 && !!(await p.$('.top span.av.lg'));
  ok(none, 'off: no camera anywhere, her page shows her letters');
  // Settings: the switch, off, then on
  await p.evaluate(() => { V.stack = []; V.tab = 'book'; render(); }); await act('settings');
  ok((await p.getAttribute('[data-act="togglefaces"]', 'aria-pressed')) === 'false' && (await txt('.swnote')).startsWith('Off'), 'Settings: "Photos of customers" is off');
  await act('togglefaces');
  ok(await p.evaluate(() => S.settings.faces === true) && (await txt('.swnote')).includes('Ask her first'), 'switched on: "Tap her circle on her page. Ask her first."');
  await p.screenshot({path: OUT + '/1-setting.png'});
  // her page: the circle with a small camera
  await herPage();
  ok(!!(await p.$('.top .avbtn[data-act="face"] .avcam')), 'her page: her circle has a small camera');
  await act('face');
  ok((await txt('.sheet .camera')).includes('Take a photo') && (await txt('.sheet')).includes('Only if she says yes') && !(await p.$('[data-act="facedel"]')), 'tap it: "Take a photo", "Only if she says yes"');
  await p.setInputFiles('#facein', PHOTO); await p.waitForTimeout(700);
  const id1 = await p.evaluate(() => person('w0').photo);
  ok(!!id1 && await p.evaluate(id => /^data:image\/jpeg/.test(PH[id] || ''), id1) && !(await p.$('.sheet')), 'the photo is saved small (JPEG) and the sheet closes');
  ok(!!(await p.$('.top img.av.lg')) && !(await p.$('.top .avcam')), 'her page shows her photo');
  await p.screenshot({path: OUT + '/2-her-page.png'});
  // everywhere her circle is
  await p.evaluate(() => { V.stack = []; V.tab = 'book'; render(); }); await p.waitForTimeout(150);
  ok(!!(await p.$('.brow[data-id="w0"] img.av')) && !!(await p.$('.brow[data-id="w1"] span.av')), 'the Book: her photo; Esi (no photo) keeps her letters');
  await p.screenshot({path: OUT + '/3-book.png'});
  await p.evaluate(() => { V.tab = 'collect'; render(); }); await p.waitForTimeout(150);
  ok(!!(await p.$('#collist .row img.av')), 'Take money: her photo');
  await act('round'); ok(!!(await p.$('.rwrap img.av')), 'the round: her photo, big'); await act('roundstop');
  // the backup carries it
  await p.evaluate(() => { V.stack = []; V.tab = 'book'; render(); }); await act('settings');
  const [dl] = await Promise.all([p.waitForEvent('download'), act('backup')]);
  const bpath = OUT + '/backup.json'; await dl.saveAs(bpath); const bk = JSON.parse(fs.readFileSync(bpath, 'utf8'));
  ok(bk.photos && bk.photos[id1] && bk.stallbook.people.find(x => x.id === 'w0').photo === id1, 'the backup carries her photo');
  ok(await p.evaluate(id => cbPhotoIds().has(id), id1), 'a cloud book sends it to the other phones');
  // a new photo replaces the old one
  await herPage(); await act('face');
  ok((await txt('.sheet .camera')).includes('New photo') && !!(await p.$('.sheet .facebig')) && !!(await p.$('[data-act="facedel"]')), 'tap her photo: it shows big, with "New photo" and "Remove photo"');
  await p.screenshot({path: OUT + '/4-sheet.png'});
  await p.setInputFiles('#facein', PHOTO); await p.waitForTimeout(700);
  ok(await p.evaluate(old => { const id = person('w0').photo; return id && id !== old && !PH[old] && !!PH[id]; }, id1), 'a new photo replaces the old one (the old one is deleted)');
  // remove
  await act('face'); await act('facedel');
  ok(await p.evaluate(() => !person('w0').photo) && !!(await p.$('.top span.av.lg')) && !!(await p.$('.top .avcam')), 'Remove photo: her letters come back');
  // off again: letters everywhere, no camera
  await act('face'); await p.setInputFiles('#facein', PHOTO); await p.waitForTimeout(700);
  await p.evaluate(() => { V.stack = []; V.tab = 'book'; render(); }); await act('settings'); await act('togglefaces');
  await p.evaluate(() => { V.stack = []; V.tab = 'book'; render(); }); await p.waitForTimeout(150);
  ok(!(await p.$('img.av')) && (await cams()) === 0, 'switched off: letters everywhere, no camera');
  await herPage(); ok(!(await p.$('img.av')) && (await cams()) === 0, 'her page too');
  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', String(e.message).split('\n').slice(0, 10).join(' | ')); process.exit(2); });
