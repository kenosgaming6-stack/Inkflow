// Several kinds given together make one line: her name once, each kind's photo and count side by side.
// More kinds wrap inside the same line; the name always keeps its room.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
const fs = require('fs'), path = require('path'); const OUT = path.join(__dirname, 'out', 'one-line'); fs.mkdirSync(OUT, {recursive: true});
const photo = f => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'testphotos', f)).toString('base64');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, reducedMotion: 'reduce', hasTouch: true, isMobile: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(90); };
  const txt = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const shot = n => p.screenshot({path: `${OUT}/${n}.png`});
  // give by tapping photos: counts is [bags of kind 1, kind 2, kind 3]
  const give = async (pid, counts, keep) => {
    await p.evaluate(pid => openGive(pid), pid); await p.waitForTimeout(150);
    for (let i = 0; i < counts.length; i++) for (let k = 0; k < counts[i]; k++) await p.click(`.sheet .ktile >> nth=${i} >> .kt`);
    if (keep) await act('ghold');
    await p.waitForTimeout(820); await act('gsave'); await p.waitForTimeout(150);
  };
  const rows = () => p.$$eval('#mid .row', els => els.map(r => ({multi: r.classList.contains('multi'), name: (r.querySelector('.name') || {}).textContent || '', chips: [...r.querySelectorAll('.kc b')].map(b => b.textContent), imgs: r.querySelectorAll('.kc img').length, h: r.getBoundingClientRect().height})));
  const room = () => p.evaluate(() => [...document.querySelectorAll('#mid .row.multi')].map(r => {
    const w = r.querySelector('.who').getBoundingClientRect(), k = r.querySelector('.kchips').getBoundingClientRect(), rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return {gap: k.left - w.right, nameW: w.width / rem, inside: k.right <= r.getBoundingClientRect().right + 0.5};
  }));

  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(ph => {
    localStorage.clear(); PH.y = ph[0]; PH.r = ph[1]; PH.w = ph[2];
    S = normalize({v: 4, settings: {item: 'Onions', unit: 'bag', price: 600}, setup: true, locs: [{id: 'l1', town: 'Koko Shell', spot: ''}], lastLoc: 'l1',
      people: [{id: 'a', name: 'Akosua', phone: '', loc: 'l1', note: ''}, {id: 'm', name: 'Ama', phone: '', loc: 'l1', note: ''}, {id: 'e', name: 'Esi Mensah Owusu', phone: '', loc: 'l1', note: ''}],
      cars: [{id: 'c1', date: new Date().toISOString(), label: 'Wankai', items: [{id: 'i1', name: 'Yellow bag', count: 30, price: 600, photo: 'y'}, {id: 'i2', name: 'Red net', count: 30, price: 700, photo: 'r'}, {id: 'i3', name: 'White sack', count: 30, price: 500, photo: 'w'}], costs: [], phase: 'giving'}], entries: []});
    V.stack = []; V.tab = 'give'; commit(); render();
  }, [photo('brown-sack.jpg'), photo('red-net.jpg'), photo('white-bag.jpg')]);
  await p.waitForTimeout(200);

  await give('a', [2, 6]);
  let r = await rows();
  ok(r.length === 1 && r[0].multi && r[0].name === 'Akosua' && r[0].chips.join(' ') === '2 6' && r[0].imgs === 2, 'Akosua takes 2 yellow and 6 red: ONE line, her name once, two photos with 2 and 6');
  ok(await p.evaluate(() => S.entries.filter(e => e.type === 'give').every(e => e.grp && e.grp === S.entries[0].grp)), 'the two kinds are saved together as one group');
  await give('m', [0, 3]);
  r = await rows();
  ok(r.length === 2 && !r[1].multi && r[1].name === 'Ama', 'Ama takes one kind: a normal line');
  await give('e', [2, 1, 4]);
  r = await rows();
  ok(r.length === 3 && r[2].multi && r[2].chips.join(' ') === '2 1 4' && r[2].imgs === 3, 'Esi takes three kinds: one line with three photos');
  ok(r[2].h > r[1].h + 10, `three kinds wrap and the line grows taller (${Math.round(r[1].h)} → ${Math.round(r[2].h)}px)`);
  let rm = await room();
  ok(rm.every(x => x.gap >= 0 && x.nameW >= 6.4 && x.inside), 'the photos never cover the name, which keeps at least 6.5 rem: ' + rm.map(x => x.nameW.toFixed(1)).join(', '));
  ok((await txt('#mid .row.multi >> nth=1 >> .name')) === 'Esi Mensah Owusu' || (await p.evaluate(() => { const n = document.querySelectorAll('#mid .row.multi .name')[1]; return n.scrollWidth > n.clientWidth; })), 'a long name is cut with … rather than pushed under the photos');
  await shot('1-one-line');

  // change one kind's count: tap its photo
  await p.click('#mid .row.multi >> nth=0 >> .kc >> nth=1'); await p.waitForTimeout(120);
  ok(!!(await p.$('#mid .row.editing .kimg')) && (await txt('#mid .row.editing .qstep b')) === '6', 'tap the red-net photo: − 6 + for that kind only, with its photo');
  await act('qminus'); await act('qsave'); await p.waitForTimeout(150);
  r = await rows();
  ok(r[0].multi && r[0].chips.join(' ') === '2 5', 'saved: still one line, now 2 and 5');

  // tap her name: which bag?
  await p.click('#mid .row.multi >> nth=0 >> .who'); await p.waitForTimeout(150);
  ok((await txt('.sheet h3')) === 'Akosua' && (await p.$$('.sheet [data-act="entry"]')).length === 2, 'tap her name: "Which bag?" with both kinds');
  await shot('2-which');
  await p.click('.sheet [data-act="entry"] >> nth=0'); await p.waitForTimeout(150);
  ok(!!(await p.$('.sheet [data-act="eswho"]')) && (await txt('.sheet .step .num')).startsWith('2'), 'pick one: her usual line panel for that kind (2 bags)');
  await p.evaluate(() => closeSheet());

  // kept for her, two kinds: one amber line
  await give('m', [1, 1], true);
  r = await rows();
  const kept = await p.$$eval('#mid .row.multi.held', els => els.length);
  ok(kept === 1 && r.some(x => x.multi && x.name === 'Ama' && x.chips.join(' ') === '1 1'), 'kept for her, two kinds: one amber line');

  // an older book (no group id): same woman, same moment, two kinds still make one line
  await p.evaluate(() => { const t = Date.now() - 60000; S.entries.push(
    {id: 'o1', date: new Date(t).toISOString(), type: 'give', pid: 'e', carId: 'c1', itemId: 'i1', bags: 3, price: 600, amount: 1800, loc: 'l1', off: new Date(t).toISOString(), rcpt: true},
    {id: 'o2', date: new Date(t + 4).toISOString(), type: 'give', pid: 'e', carId: 'c1', itemId: 'i3', bags: 2, price: 500, amount: 1000, loc: 'l1', off: new Date(t).toISOString(), rcpt: true}); commit(); render(); });
  r = await rows();
  ok(r.some(x => x.multi && x.name === 'Esi Mensah Owusu' && x.chips.join(' ') === '3 2'), 'an older book: the same woman given two kinds at the same moment shows as one line');

  // a small phone
  await p.setViewportSize({width: 320, height: 568}); await p.waitForTimeout(300);
  rm = await room();
  ok(rm.every(x => x.gap >= 0 && x.nameW >= 6.4 && x.inside) && await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'small phone: names keep their room, nothing goes sideways');
  await shot('3-small');

  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', e.message.split('\n').slice(0, 4).join(' | ')); process.exit(2); });
