// Smart colours: each place keeps one colour everywhere, each woman her own avatar colour,
// a kind with no photo takes the colour in its name, late is solid red, pay dates violet, the card menu by job.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
const fs = require('fs'), path = require('path'); const OUT = path.join(__dirname, 'out', 'colors'); fs.mkdirSync(OUT, {recursive: true});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, reducedMotion: 'reduce', hasTouch: true, isMobile: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const shot = n => p.screenshot({path: `${OUT}/${n}.png`});
  const css = (sel, prop) => p.evaluate(([sel, prop]) => { const el = document.querySelector(sel); return el ? getComputedStyle(el)[prop] : null; }, [sel, prop]);
  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(() => { localStorage.clear(); S = normalize(demoData()); S.setup = true; S.lastLoc = S.locs.find(l => l.town === 'Koko Shell').id; V.stack = []; V.tab = 'give'; commit(); render(); });
  await p.waitForTimeout(300);

  // places
  const locs = await p.evaluate(() => S.locs.map(l => ({town: l.town, c: l.c, col: pc(l.id)})));
  ok(locs.every(l => l.c >= 0) && new Set(locs.map(l => l.col)).size === locs.length, 'every place has its own colour: ' + locs.map(l => l.town + ' ' + l.col).join(', '));
  const koko = locs.find(l => l.town === 'Koko Shell').col;
  ok((await p.evaluate(() => getComputedStyle(document.querySelector('.ptabs .chip.on')).color)) === await p.evaluate(c => { const d = document.createElement('i'); d.style.color = c; document.body.appendChild(d); const v = getComputedStyle(d).color; d.remove(); return v; }, koko), 'the Koko Shell tab is written in Koko Shell\'s colour');
  await shot('1-give');
  await p.evaluate(() => { V.tab = 'collect'; render(); }); await p.waitForTimeout(250);
  const dots = await p.$$eval('#mid .row .pdot', els => els.map(e => e.style.getPropertyValue('--pc')));
  ok(dots.length > 0 && dots.includes(koko), 'on Take money each woman\'s place shows as a dot in that place\'s colour');
  ok(await p.evaluate(() => document.querySelectorAll('.chips .chip[style]').length) >= 2, 'the place chips carry their colours');
  // tags
  const late = await p.evaluate(() => { const t = [...document.querySelectorAll('#mid .tag')].find(x => /late|Missed|Refused/.test(x.textContent)); return t ? [t.className, getComputedStyle(t).backgroundColor, getComputedStyle(t).color] : null; });
  ok(late && late[0].includes('rr') && late[1] === 'rgb(209, 43, 54)' && late[2] === 'rgb(255, 255, 255)', 'late, missed or refused: solid red with white letters');
  ok((await css('#mid .sect.r', 'color')) === 'rgb(209, 43, 54)', '"Take now" is red');
  await shot('2-take-money');
  // a pay date is violet
  await p.evaluate(() => { const a = S.people.find(x => ledger(x.id).bal > 0 && !ledger(x.id).activePromise); S.entries.push({id: uid(), date: nowIso(), type: 'promise', pid: a.id, on: addDaysK(todayK(), 3), how: 'come'}); commit(); render(); });
  ok(await p.evaluate(() => { const t = [...document.querySelectorAll('#mid .tag.pd')]; return t.length > 0 && getComputedStyle(t[0]).color === 'rgb(109, 40, 217)'; }), 'a pay date tag is violet');

  // women
  const ama = await p.evaluate(() => S.people[0].name);
  await p.evaluate(() => { V.tab = 'give'; render(); });
  const faceStyles = await p.$$eval('.faces .face .av', els => els.map(e => e.getAttribute('style')));
  ok(faceStyles.length >= 2 && new Set(faceStyles).size >= 2, 'the faces row: women have different colours');
  const pid = await p.evaluate(() => S.people[0].id);
  const want = await p.evaluate(n => avc(n), ama);
  await p.evaluate(pid => push({v: 'person', pid}), pid); await p.waitForTimeout(200);
  ok((await p.$eval('.top .av', e => e.getAttribute('style'))) === want, `${ama} has the same colour on her page as everywhere else`);
  await shot('3-her-page');
  await p.evaluate(() => toRoot('book')); await p.waitForTimeout(200);
  await shot('4-book');

  // kinds with no photo
  await p.evaluate(() => { const c = givingCar(); c.items = [{id: 'k1', name: 'Red net', count: 10, price: 600}, {id: 'k2', name: 'Yellow sack', count: 10, price: 650}, {id: 'k3', name: 'Big', count: 10, price: 700}]; commit(); V.tab = 'give'; render(); });
  const kinds = await p.$$eval('.stock .leg .kimg', els => els.map(e => [getComputedStyle(e).backgroundColor, getComputedStyle(e).color]));
  ok(kinds[0] && kinds[0][0] === 'rgb(198, 40, 40)' && kinds[1][0] === 'rgb(242, 183, 5)' && kinds[1][1] === 'rgb(20, 22, 28)' && kinds[2][0] !== kinds[0][0], '"Red net" is red, "Yellow sack" yellow with dark letters, "Big" gets its own colour');
  await shot('5-kinds');

  // the card menu
  await p.click('[data-act="carmenu"]'); await p.waitForTimeout(200);
  const mis = await p.$$eval('.sheet .mi', els => els.map(e => getComputedStyle(e).backgroundColor));
  ok(mis.length >= 5 && mis[0] === mis[1] && new Set(mis).size >= 4, 'card menu: each action has a coloured icon; Counter and Count the car share the counting colour');
  await shot('6-menu');
  await p.evaluate(() => closeSheet());

  // a new place takes a colour nobody has
  ok(await p.evaluate(() => { const id = getLoc('New Town', ''); const l = locById(id); return l.c >= 0 && S.locs.filter(x => x.c === l.c).length === 1; }), 'a new place gets a colour no other place has');

  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', e.message.split('\n').slice(0, 4).join(' | ')); process.exit(2); });
