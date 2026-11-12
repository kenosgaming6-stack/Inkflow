// Voice: off by default; when on, the phone says each give, sale and payment, and asks for the count.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, reducedMotion: 'reduce', hasTouch: true, isMobile: true});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort());
  // listen to what the phone says, instead of a speaker
  await p.addInitScript(() => { window.SAID = []; const ss = window.speechSynthesis; if (ss) { ss.speak = u => window.SAID.push(u.text); ss.cancel = () => {}; } });
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(90); };
  const said = () => p.evaluate(() => window.SAID.slice());
  const last = async () => (await said()).slice(-1)[0] || '';
  const give = async (name, n, hold) => {
    await p.fill('#gq', name); await p.waitForTimeout(80); await p.click('[data-act="pick"][data-id]'); await p.waitForTimeout(150);
    { await act('gqmore'); await act('key', '[data-k="del"]'); for (const k of String(n)) await act('key', `[data-k="${k}"]`); await act('qtyuse'); }
    if (hold) await act('ghold');
    await p.waitForTimeout(820); await act('gsave');
  };
  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(() => { localStorage.clear(); S = normalize({v: 4, settings: {item: 'Onions', unit: 'bag', price: 600, half: true}, setup: true, locs: [{id: 'l1', town: 'Koko Shell', spot: ''}], lastLoc: 'l1',
    people: [{id: 'a', name: 'Ama', phone: '', loc: 'l1', note: ''}, {id: 'b', name: 'Esi', phone: '', loc: 'l1', note: ''}],
    cars: [{id: 'c1', date: new Date().toISOString(), label: 'Wankai', items: [{id: 'i1', name: '', count: 40, price: 600}], costs: [], phase: 'giving'}], entries: []}); V.stack = []; V.tab = 'give'; commit(); render(); });
  await p.waitForTimeout(200);

  await give('Ama', 2);
  ok((await said()).length === 0, 'Speak is off at first: nothing is said');
  await p.evaluate(() => { V.tab = 'book'; render(); }); await act('settings');
  ok((await p.textContent('.sheet, #app')).includes('Speak out loud'), 'Settings has "Speak out loud"');
  await act('togglevoice');
  ok(await last() === 'Speak is on.' && await p.evaluate(() => S.settings.voice === true), 'switching it on says "Speak is on."');
  await p.evaluate(() => toRoot('give')); await p.waitForTimeout(150);

  await give('Ama', 3);
  ok(await last() === 'Ama, 3 bags. 35 left.', 'a give is said: ' + await last());
  await give('Esi', 2, true);
  ok(await last() === 'Esi, 2 bags kept. 33 left.', 'keep for her is said: ' + await last());
  await give('Esi', 1);
  ok(/^Esi, 1 bag\. 32 left\.$/.test(await last()), 'one bag: ' + await last());
  await p.evaluate(() => { V.g = null; S.entries.push({id: 'h', date: new Date().toISOString(), type: 'give', pid: 'a', carId: 'c1', itemId: 'i1', bags: 0.5, price: 600, amount: 300, loc: 'l1', off: new Date().toISOString(), rcpt: true}); commit(); say(`Ama, ${bagsTxt(1.5)}. 1 left.`); });
  ok(/1 and a half/.test(await last()), 'a half bag is said as "and a half": ' + await last());

  await act('cash'); await p.waitForTimeout(150);
  if (await p.$('[data-act="cashitem"]')) await act('cashitem');
  ok(/^Sold one for 600 cedis\. 30 and a half left\.$/.test(await last()), 'a cash sale is said: ' + await last());

  await p.evaluate(() => { V.tab = 'collect'; render(); }); await p.waitForTimeout(200);
  await p.evaluate(() => openPay('a', {ctx: 'collect'})); await p.waitForTimeout(150);
  for (const k of '1000') await act('key', `[data-k="${k}"]`); await act('paydone');
  ok(await last() === 'Ama paid 1,000 cedis. 2,300 cedis left.', 'a payment is said: ' + await last());
  await act('pfdone');

  await p.evaluate(() => { V.tab = 'give'; V.ask = false; render(); checkDue = () => true; remindTick(); }); await p.waitForTimeout(100);
  ok(await last() === 'Count the bags.', 'the count reminder says "Count the bags."');

  await p.evaluate(() => { V.tab = 'book'; render(); }); await act('settings'); await act('togglevoice');
  const n = (await said()).length; await p.evaluate(() => toRoot('give')); await p.waitForTimeout(150); await give('Ama', 1);
  ok((await said()).length === n, 'switched off: quiet again');

  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', e.message.split('\n').slice(0, 4).join(' | ')); process.exit(2); });
