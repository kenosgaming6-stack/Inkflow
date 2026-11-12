const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const SHOTS = require('path').join(__dirname, 'out', 'book'); require('fs').mkdirSync(SHOTS, {recursive: true}); const URL = process.env.URL || 'http://127.0.0.1:8768/';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({reducedMotion: 'reduce',  viewport: { width: 390, height: 844 }, acceptDownloads: true, hasTouch: true });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_FAILED|net::/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(90); };
  const txt = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const shot = n => p.screenshot({ path: `${SHOTS}/${n}.png` });
  const keys = async s => { for (const k of s) await act('key', `[data-k="${k}"]`); };
  const left = async () => (await txt('.stock .big b'));
  const names = () => p.$$eval('#mid .row .name', els => els.map(e => e.textContent.trim()));
  const tabNames = () => p.$$eval('.ptabs [data-act="gtab"]', els => els.map(e => e.childNodes[0].textContent.trim()));
  const swipe = async dx => { await p.evaluate(dx => { const m = document.getElementById('mid'); const mk = (type, x) => { const t = new Touch({identifier: 1, target: m, clientX: x, clientY: 300}); m.dispatchEvent(new TouchEvent(type, {touches: type === 'touchend' ? [] : [t], changedTouches: [t], bubbles: true})); }; mk('touchstart', 220); for (let i = 1; i <= 5; i++) mk('touchmove', 220 + dx * i / 5); mk('touchend', 220 + dx); }, dx); await p.waitForTimeout(250); };
  const state = () => p.evaluate(() => JSON.parse(localStorage.getItem('stallbook_v2')));
  const addLoc = async name => { await act('addloc'); await p.fill('#ls_new', name); await act('lsadd'); await act('lssave'); };
  const placeId = async name => (await state()).locs.find(l => l.town === name).id;
  const setHere = async name => {
    await act('here');
    const l = (await state()).locs.find(x => x.town === name);
    if (l) await act('lspick', `[data-id="${l.id}"]`); else { if (await p.$('.sheet [data-act="lsaddplace"]')) await act('lsaddplace'); await p.fill('#ls_new', name); await act('lsadd'); }
  };
  const newGive = async (name, {phone, place, qty, hold} = {}) => {
    if (place) await setHere(place);
    await p.fill('#gq', name); await p.waitForTimeout(80);
    const exist = await p.$(`.suggest [data-act="pick"][data-id]`);
    if (await p.$('.suggest .sg.new')) await act('pick', '[data-name]'); else await act('pick', '[data-id]');
    if (phone && await p.$('#gph')) await p.fill('#gph', phone);
    if (qty) { await act('gqmore'); await keys(String(qty)); await act('qtyuse'); }
    if (hold) await act('ghold');
    await p.waitForTimeout(820); await act('gsave');
  };

  await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  ok((await txt('#app')).includes('Set up your book'), 'first open shows setup');
  await addLoc('Bakwai Market'); await addLoc('Koko Shell'); await addLoc('Bechem');
  const setupTxt = await txt('#mid');
  ok(['Bakwai Market', 'Koko Shell', 'Bechem'].every(n => setupTxt.includes(n)) && !/spot|town/i.test(setupTxt), 'setup lists three places, no towns or spots');
  ok(await p.evaluate(() => getComputedStyle(document.body).backgroundColor) === 'rgb(255, 255, 255)', 'background is white');
  await shot('01-setup');
  await act('setupdone');
  ok((await txt('#app')).includes('No load open'), 'after setup: no load open');

  // new delivery Wankai, 12 bags at 650
  await act('newcar'); await p.fill('#w_label', 'Wankai'); await act('wfrom'); await act('wphoto'); await keys('12'); await act('wnext'); await keys('650'); await act('wnext'); await act('wdone'); await act('wfinish', '[data-skip]');
  ok(await left() === '12' && (await txt('.stock .dl')).includes('Wankai'), 'delivery Wankai: 12 left');

  // The give panel for a new name: phone, + and −, Hold for her. Nothing else.
  await setHere('Bakwai Market');
  ok((await txt('.ptabs .chip.on')).includes('Bakwai Market') && !!(await p.$('.ptabs [data-act="here"]')), 'under the card: a Bakwai Market tab and a + to add a place');
  ok(await p.evaluate(() => document.querySelector('.stock').getBoundingClientRect().top < document.querySelector('.ptabs').getBoundingClientRect().top), 'the card is above the place tabs');
  await p.fill('#gq', 'Amma'); await p.waitForTimeout(80); await act('pick', '[data-name]');
  const gs = await txt('.sheet');
  ok(!!(await p.$('#gph')) && !!(await p.$('.sheet [data-act="gplus"]')) && !!(await p.$('.sheet [data-act="gminus"]')) && !!(await p.$('.sheet [data-act="ghold"]')), 'new customer: phone, + and −, Hold for her');
  ok(!(await p.$('.sheet [data-act="gloc"]')) && !(await p.$('.sheet .qty')) && !/Paid cash|Where does she sell|½/.test(gs), 'no place question, no 1-6 row, no Paid cash, no half');
  await act('gplus'); await act('gplus');
  ok((await txt('.sheet .step .num')).startsWith('3'), '+ twice from 1: 3 bags');
  await act('gminus');
  ok((await txt('.sheet .step .num')).startsWith('2'), '− once: 2 bags');
  await act('sheetclose');

  // Scenario 1: hold 3 for Amma at Bakwai Market
  await newGive('Amma', { phone: '0245550101', qty: 3, hold: true });
  ok((await state()).people.find(x => x.name === 'Amma').loc === await placeId('Bakwai Market'), 'new customer gets the place you are at');
  ok(await left() === '9' && (await txt('.stock .leg')).includes('3 kept'), 'keep 3 for her: 9 left, 3 kept');
  await shot('02-held');
  await act('tab', '[data-t="book"]');
  ok((await txt('#booklist')).includes('3 bags kept') && (await txt('.csum')).includes('₵0'), 'Book: Amma has 3 kept and owes nothing');
  await act('tab', '[data-t="give"]');

  // Scenario 2: hand over to Kwame
  await act('entry'); await p.fill('#es_by', 'Kwame'); await shot('03-handover-sheet'); await act('hand');
  ok(await left() === '9' && !(await txt('.stock .leg')).includes('held') && (await txt('.stock .leg')).includes('3 given'), 'hand over: left stays 9, 3 given, 0 held');
  await act('tab', '[data-t="collect"]');
  ok((await txt('.csum')).includes('₵1,950'), 'Collect: Amma now owes ₵1,950');
  await act('tab', '[data-t="give"]');

  // Esi 3 given, then fix to 2 in the row, undo, fix again
  await newGive('Esi', { qty: 3 });
  ok(await left() === '6', 'Esi 3 given: 6 left');
  ok(!(await p.$('#toast')), 'no message after giving: the line flashes instead');
  let ns = await names();
  ok(ns[0] === 'Amma' && ns[ns.length - 1] === 'Esi', 'list reads top-down: Amma first, Esi right under');
  ok(await p.evaluate(() => { const m = document.getElementById('mid'), r = m.querySelector('.row'); return r.getBoundingClientRect().top - m.getBoundingClientRect().top < 60; }), 'the list starts at the top, not at the bottom');
  const esiRow = '.row:has-text("Esi") [data-act="qedit"]';
  await p.click(esiRow); await p.waitForTimeout(80); await act('qminus'); await shot('04-row-edit'); await act('qsave');
  ok(await left() === '7' && (await txt('#toast')).includes('3 → 2'), 'in-row fix 3 → 2: 7 left');
  ok(!(await txt('#toast')).includes('Undo'), 'no Undo button');
  await p.click(esiRow); await p.waitForTimeout(80); await act('qplus'); await act('qsave');
  ok(await left() === '6', 'change it back to 3 in the row: 6 left');
  await p.click(esiRow); await p.waitForTimeout(80); await act('qminus'); await act('qsave');
  ok(await left() === '7', 'fix again: 7 left');

  // Cash at the car is its own button: no name needed
  ok((await txt('[data-act="cash"]')) === '', 'cash button is a sign, no words');
  await p.waitForTimeout(1600); // the message from the fix above is gone by now (1.5 s)
  await act('cash'); await act('cash');
  ok(await left() === '5' && (await txt('#mid .cashline')).includes('2 bags'), 'cash twice: 5 left, cash line shows 2 bags');
  ok(!(await p.$('#toast')), 'no message after a cash sale');
  await act('cashfix'); await act('cashless'); await act('sheetclose');
  ok(await left() === '6', 'tap the cash line and take one off: 6 left');
  await act('cash');
  ok(await left() === '5', 'cash again: 5 left');
  let st;

  // Oversell guard
  await newGive('Efua', { qty: 6 });
  ok((await txt('.sheet')).includes('Only 5 bags left'), 'oversell: "Only 5 bags left"');
  await act('gback'); await act('sheetclose');

  // Amma takes 1 at Koko Shell: no extra question, the line keeps Koko Shell, her place stays
  await newGive('Amma', { place: 'Koko Shell', qty: 1 });
  ok(!(await p.$('.sheet')), 'giving at another place asks nothing more');
  st = await state(); let amma = st.people.find(x => x.name === 'Amma'); const loc = id => { const l = st.locs.find(x => x.id === id); return l ? l.town : ''; };
  const ammaGives = st.entries.filter(e => e.type === 'give' && e.pid === amma.id).map(e => loc(e.loc));
  ok(loc(amma.loc) === 'Bakwai Market' && ammaGives[0] === 'Bakwai Market' && ammaGives[1] === 'Koko Shell', 'line says Koko Shell, her place is still Bakwai Market');
  ok(await left() === '4', '4 left');
  // tabs: one per place, no All; each shows only its place; swipe moves between them
  let tn = await tabNames();
  ok(tn.join('|') === 'Bakwai Market|Koko Shell' && !(await txt('.ptabs')).includes('All'), 'tabs: Bakwai Market, Koko Shell, no All');
  ns = await names();
  ok((await txt('.ptabs .chip.on')).includes('Koko Shell') && ns.join('|') === 'Amma', 'Koko Shell tab shows only the Koko Shell line');
  await swipe(150);
  ns = await names();
  ok((await txt('.ptabs .chip.on')).includes('Bakwai Market') && ns.includes('Esi') && ns.includes('Amma'), 'swipe right: back to Bakwai Market');
  await swipe(-150);
  ok((await txt('.ptabs .chip.on')).includes('Koko Shell'), 'swipe left: Koko Shell again');
  await act('gtab', `[data-id="${await placeId('Bakwai Market')}"]`);
  ok((await txt('.ptabs .chip.on')).includes('Bakwai Market'), 'tapping a tab works too');
  await act('gtab', `[data-id="${await placeId('Koko Shell')}"]`);
  await act('tab', '[data-t="book"]');
  ok(!(await p.$('[data-act="calc"]')), 'no calculator');
  await act('person', ':has-text("Amma")'); await act('ploc');
  await act('lspick', `[data-id="${await placeId('Koko Shell')}"]`); await act('lssave');
  st = await state(); amma = st.people.find(x => x.name === 'Amma');
  ok(loc(amma.loc) === 'Koko Shell', 'changed on her page: Amma now sells at Koko Shell');
  ok((await txt('.dock [data-act="msg"]')) === '' && (await txt('.dock .btn.call')) === '', 'call and message are signs, no words');
  await act('back'); await act('tab', '[data-t="give"]');

  // Book filter by town and spot; her page history
  await act('tab', '[data-t="book"]'); await act('ftown', '[data-t="Koko Shell"]');
  const kk = await txt('#booklist');
  ok(kk.includes('Amma') && !kk.includes('Esi') && !(await p.$('[data-act="floc"]')), 'Book › Koko Shell shows Amma, not Esi; no second row of spots');
  await shot('05-book-filter');
  await act('person', ':has-text("Amma")');
  const hist = await txt('#mid');
  ok(hist.includes('Moved to Koko Shell') && hist.includes('Bakwai Market') && hist.includes('to Kwame'), 'her page: moved line, old line keeps Bakwai Market, handover to Kwame');
  ok((await txt('#mid .row .line')).includes('Moved to Koko Shell') && await p.evaluate(() => { const m = document.getElementById('mid'), r = m.querySelector('.row'); return r.getBoundingClientRect().top - m.getBoundingClientRect().top < 60; }), 'her page starts at the top with her newest line');
  await shot('06-her-page');
  await act('back'); await act('ftown', '[data-t=""]');

  // Scenario: partial payment in place on Collect
  await act('tab', '[data-t="collect"]');
  await act('pay', ':has-text("Amma")');
  await act('note', '[data-n="200"]'); await act('note', '[data-n="200"]'); await act('note', '[data-n="100"]');
  ok((await txt('.sheet .disp')).includes('₵500') && (await txt('.sheet .disp')).includes('₵2,100 left'), 'pay pad: 200+200+100 = ₵500, ₵2,100 left');
  await shot('07-pay-pad');
  await act('paydone');
  ok((await txt('.sheet .pf-head')).includes('₵500') && (await txt('.sheet .pf-left')).includes('₵2,100') && !!(await p.$('.sheet .pf-stamp')) && !!(await p.$('.sheet .pf-note')), 'the proof turned to her: paid ₵500, "− 500" on her line, ₵2,100 left circled, a PAID stamp');
  await p.waitForTimeout(1700); await shot('07b-proof'); await act('pfdone');
  ok((await txt('#collist')).includes('₵2,100') && (await txt('#collist')).includes('−₵500'), 'row now ₵2,100 with −₵500');
  ok(!(await p.$('#app [data-act="back"]')), 'no page change: still on the Collect list');

  // Overpayment needs a choice
  await act('pay', ':has-text("Esi")');
  await keys('1500');
  ok((await txt('.sheet')).includes('more than she owes'), 'overpay: pad says more than she owes');
  await act('paydone');
  ok((await txt('.sheet')).includes('Choose what happens to the extra'), 'overpay: asks to choose');
  await act('pover', '[data-v="change"]'); await act('paydone');
  ok((await txt('.sheet .pf-left')).includes('Nothing left to pay') && (await txt('.sheet')).includes('Gave ₵200 change') && (await p.$$('.sheet .pf-strike')).length >= 1, 'Esi cleared: her lines are struck through, "Nothing left to pay", "Gave ₵200 change"');
  await act('pfdone');
  ok((await txt('#collist')).includes('Paid today'), 'Esi paid: shows under Paid today');
  st = await state(); const esiPay = st.entries.find(e => e.type === 'pay' && e.pid === st.people.find(x => x.name === 'Esi').id);
  ok(esiPay.amount === 1300 && esiPay.change === 200, 'gave change: records ₵1,300 paid and ₵200 change');

  // Closing with a held bag is blocked until released; leftovers kept for next
  await act('tab', '[data-t="give"]');
  await newGive('Akosua', { qty: 1, hold: true });
  await act('carmenu'); await p.click('.sheet [data-act="closecar"]'); await p.waitForTimeout(90);
  ok((await txt('.sheet')).includes('Still kept for her') && await p.isDisabled('[data-act="cldo"]'), 'close blocked while 1 bag is kept for her');
  await act('releaseall');
  ok((await txt('.sheet')).includes('What happened to the 4 bags left'), 'after release: asks about the 4 left');
  await act('clopt', '[data-k="next"]'); await shot('08-close'); await act('cldo');
  ok((await txt('#app')).includes('4 bags waiting for the next one'), 'closed: 4 bags waiting for the next delivery');
  await act('newcar'); await act('wfrom'); await act('wphoto');
  ok((await txt('.disp')).includes('4'), 'next delivery starts with 4 counted');
  await act('wback'); await act('wback'); await act('wback');

  // Reopen from Book › Deliveries
  await act('tab', '[data-t="book"]'); await act('bseg', '[data-s="cars"]'); await act('report');
  ok((await txt('#mid')).includes('For the next load'), 'report shows "For the next load"');
  await act('carmenu'); await p.click('.sheet [data-act="reopen"]'); await p.waitForTimeout(90);
  ok(await left() === '4', 'reopen: 4 left again');
  st = await state(); ok(st.carry === 0, 'reopen takes the 4 back from the next delivery');

  // New delivery while one is open asks to close it first
  await act('carmenu'); await p.click('.sheet [data-act="closecar"]'); await p.waitForTimeout(80);
  await act('sheetclose');
  await act('tab', '[data-t="book"]'); await act('bseg', '[data-s="cars"]'); await act('newcar');
  ok((await txt('.sheet')).includes('First close'), 'new delivery while one is open: "First close …"');
  await act('sheetclose'); await act('bseg', '[data-s="people"]');

  // Persistence + backup + restore
  await p.reload(); await p.waitForTimeout(300);
  await act('tab', '[data-t="book"]');
  ok((await txt('.csum')).includes('₵2,100'), 'after reload: owed ₵2,100');
  await act('settings');
  const [dl] = await Promise.all([p.waitForEvent('download'), act('backup')]);
  const bpath = SHOTS + '/backup.json'; await dl.saveAs(bpath);
  await act('wipe'); await act('wipeyes');
  ok((await txt('#app')).includes('Set up your book'), 'delete everything shows setup again');
  await act('setupdone'); await act('tab', '[data-t="book"]'); await act('settings');
  await p.setInputFiles('#restorefile', bpath); await p.waitForTimeout(200); await act('restoreyes');
  await act('tab', '[data-t="book"]');
  ok((await txt('.csum')).includes('₵2,100'), 'restored: owed ₵2,100');

  // Example book: Collect with Next and a promise
  await act('settings'); await act('demo');
  await shot('09-demo-give');
  ok(await left() === '40' && (await txt('.stock .leg')).includes('5 kept'), 'example: 40 left, 5 kept');
  await act('tab', '[data-t="collect"]'); await shot('10-demo-collect');
  const firstName = await txt('#collist .row .name');
  await act('pay', ''); await act('note', '[data-n="100"]');
  const hasNext = !!(await p.$('[data-act="paynext"]'));
  await act('paynext');
  ok(!!(await p.$('.sheet .proof')) && !!(await p.$('.sheet [data-act="pfnext"]')), 'Next first shows her the proof, with Next ›');
  await act('pfnext');
  const nextName = await txt('.sheet .title b');
  ok(hasNext && nextName && nextName !== firstName, `Next saves ${firstName} and opens ${nextName}`);
  await p.click('.sheet [data-act="promise"]'); await p.waitForTimeout(90); await act('prsave');
  ok((await txt('#toast')).includes('Pay date: '), 'Not today saves a pay date');
  await act('tab', '[data-t="book"]'); await act('mom'); await shot('11-mom'); await act('back');
  await act('leavedemo');

  // Half bags only when switched on in Settings
  await act('tab', '[data-t="book"]'); await act('settings'); await act('togglehalf'); await act('back');
  await act('tab', '[data-t="give"]');
  await p.fill('#gq', 'Esi'); await p.waitForTimeout(80); await act('pick', '[data-id]');
  ok(!!(await p.$('.sheet [data-act="ghalf"]')), 'half bags switched on: the give panel offers ± ½');
  await act('ghalf');
  ok((await txt('.sheet .step .num')).includes('½'), '± ½ adds half a bag');
  await act('sheetclose');

  ok(!(await p.content()).includes('>Undo<'), 'Undo appears nowhere');
  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close();
})().catch(e => { console.log('CRASH', e.message.split('\n').slice(0,4).join(' | ')); process.exit(1); });
