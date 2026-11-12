// Round 1: Count check, bags with no name, and the reminder.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/'; const SHOTS = require('path').join(__dirname, 'out', 'count-check');
require('fs').mkdirSync(SHOTS, {recursive: true});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({reducedMotion: 'reduce', viewport: {width: 390, height: 844}, deviceScaleFactor: 2, hasTouch: true, isMobile: true});
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(110); };
  const txt = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const left = async () => (await txt('.stock .big b'));
  const st = () => p.evaluate(() => { const c = givingCar(), s = carStats(c.id); return {free: s.free, inCar: s.inCar, gap: s.gap, wait: s.wait, loaded: s.loaded, gaps: gapsOn(c.id).map(g => ({id: g.id, bags: g.bags, loc: g.loc, itemId: g.itemId})), checks: S.entries.filter(e => e.type === 'check').length, lost: S.entries.filter(e => e.type === 'stock' && e.reason === 'lost').length, countFix: S.entries.filter(e => e.type === 'stock' && e.reason === 'count').length, checkedAt: c.checkedAt || ''}; });
  const count = async (delta, how) => { await act('count'); for (let i = 0; i < Math.abs(delta); i++) await act(delta < 0 ? 'ccminus' : 'ccplus'); if (how !== 'keep') await act('ccsave'); };
  const shot = n => p.screenshot({path: `${SHOTS}/${n}.png`});

  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(() => { S = normalize(demoData()); S.setup = true; S.lastLoc = S.locs.find(l => l.town === 'Koko Shell').id; V.stack = []; V.tab = 'give'; commit(); render(); });
  await p.waitForTimeout(250);
  let s = await st();
  ok(await left() === '40' && s.free === 40 && s.wait === 5, 'start: 40 left, 5 held');
  ok(await p.evaluate(() => document.querySelector('.stock .big').tagName === 'BUTTON'), 'the big number is a button');

  // same number: one tap, nothing is added but the check
  await act('count');
  ok((await txt('.sheet h3')).includes('How many left in the car?') && (await txt('.sheet .step .num')).startsWith('40'), 'tap the number: "How many left in the car?" starts at 40');
  ok((await txt('.sheet')).includes('The book says 40') && (await txt('.sheet')).includes('5 bags kept are not counted'), 'the sheet says what the book says and that kept bags are not counted');
  ok((await txt('[data-act="ccsave"]')) === 'Yes, 40', 'same number: the button says "Yes, 40"');
  await act('ccsave');
  s = await st();
  ok(s.checks === 1 && s.gaps.length === 0 && s.free === 40 && s.checkedAt, 'saved: one check, no gap, still 40');
  ok((await txt('#toast')).includes('Count ✓'), 'a short "Count ✓"');

  // 2 fewer than the book: they show with no name, in the place you are at
  await act('count'); await act('ccminus'); await act('ccminus');
  ok((await txt('.sheet')).includes('2 bags will show with no name') && (await txt('[data-act="ccsave"]')) === 'Save 38', 'two fewer: says "2 bags will show with no name", button "Save 38"');
  await shot('1-count-sheet');
  await act('ccsave'); await p.waitForTimeout(300);
  s = await st();
  ok(s.gaps.length === 1 && s.gaps[0].bags === 2 && s.free === 38 && s.gap === 2 && s.wait === 5, 'saved: 2 bags with no name, 38 left');
  ok(await left() === '38' && (await txt('.stock .leg')).includes('2 no name'), 'the card says 38 and "2 no name"');
  ok(await p.evaluate(() => [...document.querySelectorAll('#mid .row.held .mk')].some(m => m.textContent.trim() === '?')) && (await txt('#mid')).includes('Who took these?') && (await txt('#mid')).includes('No name'), 'an amber line "Who took these?" · "No name" sits in the list');
  ok(/Koko Shell\s*7/.test(await txt('.ptabs .chip.on')), 'the Koko Shell tab counts them (5 → 7)');
  await shot('2-gap-row');

  // naming: pick a face, 2 bags become a normal give
  const who = await p.evaluate(() => { const g = gapsOn(givingCar().id)[0]; return {id: g.id}; });
  await p.click(`#mid [data-act="gap"][data-id="${who.id}"] >> nth=0`); await p.waitForTimeout(150);
  ok((await txt('.sheet h3')).includes('Who took 2 bags?') && !!(await p.$('[data-act="gnminus"]')) && !!(await p.$('[data-act="gnlost"]')), 'tap the line: "Who took 2 bags?" with − + and "Nobody. They are lost"');
  await shot('3-name-sheet');
  const face = await p.evaluate(() => { const f = document.querySelector('.sheet [data-act="gnpick"]'); return {id: f.dataset.id, name: f.textContent.trim()}; });
  await p.click('.sheet [data-act="gnpick"] >> nth=0'); await p.waitForTimeout(250);
  s = await st();
  const named = await p.evaluate(id => { const gv = S.entries.filter(e => e.type === 'give' && e.fromGap); const g = gv[gv.length - 1]; const bal = ledger(g.pid).bal; return {pid: g.pid === id, bags: g.bags, amount: g.amount, loc: g.loc === S.lastLoc, off: !!g.off, bal}; }, face.id);
  ok(s.gaps.length === 0 && s.free === 38 && s.gap === 0 && named.pid && named.bags === 2 && named.amount === 1300 && named.loc && named.off, `named ${face.name}: 2 bags become a normal give (₵1,300, at Koko Shell), still 38 left`);
  ok(!(await txt('#mid')).includes('Who took these?'), 'the nameless line is gone from the list');

  // part of a gap: name 1 of 3, the other 2 stay
  await count(-3); s = await st();
  ok(s.gaps.length === 1 && s.gaps[0].bags === 3 && s.free === 35, 'three more missing: gap of 3, 35 left');
  await p.click('#mid [data-act="gap"] >> nth=0'); await p.waitForTimeout(150);
  await act('gnminus'); await act('gnminus');
  ok((await txt('.sheet h3')).includes('Who took 1 bag?'), 'the − − steps to 1 bag');
  await p.click('.sheet [data-act="gnpick"] >> nth=0'); await p.waitForTimeout(250);
  s = await st();
  ok(s.gaps.length === 1 && s.gaps[0].bags === 2 && s.free === 35, 'one bag named: the other 2 stay with no name');

  // a new name typed in the sheet
  await p.click('#mid [data-act="gap"] >> nth=0'); await p.waitForTimeout(150);
  await act('gnminus');
  await p.fill('#gn_q', 'Kwesi Newname'); await p.waitForTimeout(120);
  await p.click('.sheet .sg.new'); await p.waitForTimeout(250);
  s = await st();
  ok(s.gaps.length === 1 && s.gaps[0].bags === 1 && await p.evaluate(() => S.people.some(x => x.name === 'Kwesi Newname' && x.loc === S.lastLoc)), 'a new name typed: added at this place, 1 bag left with no name');

  // lost
  await p.click('#mid [data-act="gap"] >> nth=0'); await p.waitForTimeout(150);
  await act('gnlost'); await p.waitForTimeout(200);
  s = await st();
  ok(s.gaps.length === 0 && s.lost === 1 && s.free === 35, '"They are lost": the gap goes, a lost line is written, still 35 left');
  ok((await txt('#toast')).includes('1 bag lost'), 'short message "1 bag lost"');

  // found again: more than the book gives gap bags back first
  await count(-2); s = await st();
  ok(s.gaps.length === 1 && s.free === 33, 'two missing again: 33 left');
  await count(2); s = await st();
  ok(s.gaps.length === 0 && s.free === 35 && s.countFix === 0, 'counted 35 again: the nameless bags are found, no count fix needed');
  // truly more than the book: count is fixed
  const loaded0 = s.loaded;
  await count(3); s = await st();
  ok(s.free === 38 && s.countFix === 1 && s.loaded === loaded0 + 3, 'three more than the book: count fixed, 38 left, loaded +3');
  ok((await txt('#toast')).includes('3 bags more'), 'says "3 bags more. Book fixed."');

  // typing a number
  await act('count'); await act('ccnum'); await p.waitForTimeout(200);
  ok((await txt('#app')).includes('How many') && (await txt('#app')).includes('bags'), 'tap the number: a keypad opens');
  await p.click('[data-act="key"][data-k="3"]'); await p.click('[data-act="key"][data-k="6"]'); await act('numsave'); await p.waitForTimeout(350);
  ok((await txt('.sheet .step .num')).startsWith('36') && (await txt('.sheet')).includes('2 bags will show with no name'), 'typed 36: back in the sheet at 36, "2 bags will show with no name"');
  await p.evaluate(() => closeSheet());

  // closing waits for the nameless bags
  await count(-2); s = await st();
  ok(s.gaps.length === 1, 'a gap again before closing');
  await p.evaluate(() => { const c = givingCar(); openClose(c.id); }); await p.waitForTimeout(150);
  ok((await txt('.sheet')).includes('No name yet') && await p.isDisabled('[data-act="cldo"]'), 'closing: "No name yet: 2 bags" and Close is off');
  await act('gaplostall'); await p.waitForTimeout(250);
  s = await st();
  ok(s.gaps.length === 0 && s.lost === 2 && !(await txt('.sheet')).includes('No name yet') && (await txt('.sheet')).includes('Still kept for her'), 'all lost: "No name yet" is gone and the sheet moves on to the held bags');
  await act('releaseall'); await p.waitForTimeout(250);
  ok((await txt('.sheet')).includes('What happened to the') && !(await p.isDisabled('[data-act="clopt"][data-k="next"]')), 'then "What happened to the bags left?"');
  await p.evaluate(() => closeSheet());

  // report
  await p.evaluate(() => { const c = givingCar(); push({v: 'report', cid: c.id}); }); await p.waitForTimeout(250);
  const rep = await txt('#mid');
  ok(rep.includes('Lost, nobody took them') && rep.includes('Counted') && rep.includes('Count fixed'), 'the delivery report shows the lost lines, the counts and the count fix');
  await p.evaluate(() => toRoot('give')); await p.waitForTimeout(200);

  // ---- the reminder ----
  const spy = () => p.evaluate(() => { window.__d = 0; const o = window.__sfx || sfx; window.__sfx = o; window.sfx = k => { if (k === 'ding') window.__d++; return o(k); }; });
  const age = (mins) => p.evaluate(m => { const t = new Date(Date.now() - m * 60000).toISOString(); const c = givingCar(); S.entries.forEach(e => { if (e.carId === c.id && e.type === 'check') e.date = t; }); c.checkedAt = t; VER++; }, mins);
  await spy();
  ok(await p.evaluate(() => S.settings.checkMins === 10 && checkDue() === false), 'default: every 10 minutes, not due right after a count');
  await age(5); ok(await p.evaluate(() => checkDue() === false), '5 minutes later: not due');
  await age(11); ok(await p.evaluate(() => checkDue() === true), '11 minutes later: due');
  await p.evaluate(() => remindTick()); await p.waitForTimeout(250);
  ok(await p.evaluate(() => V.ask === true && !!document.querySelector('.stock .big b.ask')) && (await txt('.stock .big span')) === 'count?', 'the number glows amber and says "count?"');
  ok(await p.evaluate(() => window.__d === 1), 'a soft ding played once');
  await p.evaluate(() => remindTick());
  ok(await p.evaluate(() => window.__d === 1), 'the next tick does not ding again straight away');
  await shot('4-reminder');
  // typing a name when the reminder comes: the box keeps its focus and its letters
  await p.focus('#gq'); await p.fill('#gq', 'Am'); await p.waitForTimeout(80);
  await p.evaluate(() => { V.ask = false; paintAsk(); });
  await age(11); await p.evaluate(() => remindTick()); await p.waitForTimeout(120);
  ok(await p.evaluate(() => document.activeElement.id === 'gq' && document.getElementById('gq').value === 'Am' && V.ask === true && !!document.querySelector('.stock .big b.ask')), 'reminder while typing "Am": the glow comes on, the name box keeps focus and its letters');
  await p.fill('#gq', ''); await p.evaluate(() => document.activeElement.blur()); await p.evaluate(() => hideSuggest());
  await act('count'); await act('ccsave'); await p.waitForTimeout(250);
  ok(await p.evaluate(() => V.ask === false && !document.querySelector('.stock .big b.ask') && checkDue() === false), 'after a count the glow stops and the clock starts again');
  await p.evaluate(() => remindTick()); ok(await p.evaluate(() => V.ask === false), 'no new reminder right after');
  // not while typing a sheet, not on other tabs, not when idle for hours, not when switched off
  await age(11); await p.evaluate(() => { V.ask = false; sheet('<p>busy</p>'); remindTick(); });
  ok(await p.evaluate(() => V.ask === false), 'a sheet is open: no reminder');
  await p.evaluate(() => { closeSheet(); V.tab = 'collect'; render(); remindTick(); });
  ok(await p.evaluate(() => V.ask === false), 'on Collect: no reminder');
  await p.evaluate(() => { V.tab = 'give'; render(); });
  ok(await p.evaluate(() => { const n = Date.now; Date.now = () => n() + 5 * 3600e3; const r = checkDue(); Date.now = n; return r === false; }), 'nothing done for 5 hours: no reminder (the delivery is just sitting there)');
  await act('tab', '[data-t="book"]'); await act('settings');
  ok(!!(await p.$('[data-act="setseg"][data-k="checkMins"][data-v="0"]')) && (await txt('.setbox:has([data-k="checkMins"]) .seg .on')) === '10 min', 'Settings has "Count the car, every" with Never / 5 / 10 / 15 min, on 10');
  await act('setseg', '[data-k="checkMins"][data-v="0"]');
  ok(await p.evaluate(() => S.settings.checkMins === 0 && (age => true)()), 'switched to Never');
  await act('back'); await act('tab', '[data-t="give"]'); await age(60);
  ok(await p.evaluate(() => checkDue() === false), 'never: never due');
  await p.evaluate(() => { S.settings.checkMins = 10; });

  // ---- two sizes ----
  await p.evaluate(() => { S = normalize({v: 4, settings: {item: 'Onions', unit: 'bag', price: 650}, setup: true, locs: [{id: 'l1', town: 'Market', spot: ''}], lastLoc: 'l1', people: [{id: 'a', name: 'Ama', phone: '', loc: 'l1', note: ''}], cars: [{id: 'c1', date: new Date().toISOString(), label: 'Two sizes', items: [{id: 'i1', name: 'Small', count: 30, price: 600}, {id: 'i2', name: 'Big', count: 20, price: 900}], costs: [], phase: 'giving'}], entries: []}); V.stack = []; V.tab = 'give'; V.ask = false; commit(); render(); });
  await p.waitForTimeout(250);
  await act('count');
  ok((await p.$$('.sheet [data-act="ccminus"]')).length === 2 && (await txt('.sheet')).includes('Small') && (await txt('.sheet')).includes('Big') && (await txt('.sheet')).includes('The book says 30 + 20'), 'two sizes: one row each, "The book says 30 + 20"');
  await shot('5-two-sizes');
  await p.click('.sheet [data-act="ccminus"][data-i="0"]'); await p.click('.sheet [data-act="ccminus"][data-i="0"]'); await p.click('.sheet [data-act="ccminus"][data-i="1"]'); await p.waitForTimeout(120);
  await act('ccsave'); s = await st();
  const gg = await p.evaluate(() => gapsOn(givingCar().id).map(g => [g.itemId, g.bags, g.price].join(':')).sort().join(' '));
  ok(gg === 'i1:2:600 i2:1:900' && s.free === 47, `a gap for each size with its own price (${gg}), 47 left`);

  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', e.message.split('\n').slice(0, 4).join(' | ')); process.exit(2); });
