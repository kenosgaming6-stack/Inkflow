// Automatic receipts: a stand-in for Arkesel records every message the phone sends.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({reducedMotion: 'reduce', viewport: {width: 390, height: 844}});
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_FAILED|net::|CORS|Access-Control/.test(m.text())) errs.push(m.text()); });
  await p.route(/fonts\.g/, r => r.abort());
  // the stand-in: mode 'cors' answers like Arkesel and lets the page read it; 'opaque' gives no CORS header;
  // 'refuse' answers Authentication Failed; 'down' fails like no signal
  const sent = []; let mode = 'cors';
  await p.route(/sms\.arkesel\.com/, r => {
    const u = new globalThis.URL(r.request().url()); const q = Object.fromEntries(u.searchParams);
    if (mode === 'down') return r.abort('internetdisconnected');
    const hdr = mode === 'opaque' ? {} : {'access-control-allow-origin': '*'};
    if (q.action === 'check-balance') return r.fulfill({headers: hdr, contentType: 'application/json', body: mode === 'refuse' ? '{"code":"102","message":"Authentication Failed"}' : '{"balance":500,"user":"Test"}'});
    if (mode === 'refuse') return r.fulfill({headers: hdr, contentType: 'application/json', body: '{"code":"102","message":"Authentication Failed"}'});
    sent.push(q); return r.fulfill({headers: hdr, contentType: 'application/json', body: '{"code":"ok","message":"Successfully Send","balance":499}'});
  });
  const act = async (a, extra = '') => { await p.click(`[data-act="${a}"]${extra}`); await p.waitForTimeout(90); };
  // make every waiting line 30 s old, then let the sender run, so the test needn't wait 20 s each time
  const age = () => p.evaluate(() => { const old = new Date(Math.max(Date.now() - 30000, Date.parse(SMS.since || 0) + 1)).toISOString(); const after = x => x && x >= SMS.since; S.entries.forEach(e => { if (e.type === 'give' && !e.rcpt && after(givenAt(e))) { if (e.off) e.off = old; else { const h = C().hand.get(e.id); if (h) h.date = old; } } if (e.type === 'pay' && e.rcpt === false && after(e.date)) e.date = old; }); VER++; });
  const run = async () => { await age(); await p.evaluate(() => smsRun()); await p.waitForTimeout(300); };

  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(() => { S = normalize(demoData()); S.setup = true; S.settings.momo = '0550000000'; V.stack = []; commit(); render(); });
  const amma = await p.evaluate(() => { const x = S.people.find(q => q.name === 'Amma'); return {id: x.id, phone: x.phone}; });

  // off by default: giving sends nothing
  await p.evaluate(id => { V.tab = 'give'; render(); openGive(id, ''); }, amma.id); await p.waitForTimeout(820); await act('gsave');
  await run();
  ok(sent.length === 0, 'switch off: nothing is sent');

  // switch on in Settings
  await act('tab', '[data-t="book"]'); await act('settings');
  ok((await p.textContent('#sms_status')).includes('Off'), 'Settings shows Receipts by SMS, off');
  await act('smstoggle'); await p.fill('#sms_key', 'test-key-123'); await p.fill('#sms_from', 'StallBook');
  ok((await p.textContent('#sms_status')).includes('On'), 'switched on with key and sender name');
  ok(!(await p.evaluate(() => JSON.stringify(S))).includes('test-key-123'), 'the key is not in the book (or its backups)');
  await act('smstest'); await p.waitForTimeout(400);
  ok(sent.length === 1 && sent[0].to === '233550000000' && sent[0].sms.includes('StallBook test'), 'test message goes to the MoMo number');
  await act('back'); await act('tab', '[data-t="give"]');

  // a give sends a receipt by itself, once, about 20 s later
  await p.evaluate(id => openGive(id, ''), amma.id); await p.waitForTimeout(820); await act('gsave');
  await p.waitForTimeout(5000);
  ok(sent.length === 1, 'not sent straight away (time for a quick correction)');
  await p.waitForTimeout(18000);
  const r1 = sent[sent.length - 1];
  ok(sent.length === 2 && r1.to === '233' + amma.phone.replace(/\D/g, '').slice(1) && /Amma, you took \d+ bags?/.test(r1.sms) && r1.from === 'StallBook' && r1.api_key === 'test-key-123', 'about 20 s after giving, Amma gets her receipt: ' + (r1 && r1.sms));
  await run();
  ok(sent.length === 2, 'no second copy');
  ok(await p.evaluate(() => pendingReceipts(null).size === 0 || ![...pendingReceipts(null).values()].flat().some(e => e.date >= SMS.since)), 'the receipt button has nothing new waiting');

  // a payment sends one too
  await p.evaluate(id => { V.tab = 'collect'; render(); }, amma.id);
  await act('pay', ':has-text("Amma")'); await act('note', '[data-n="100"]'); await act('paydone');
  ok(!(await p.$('.sheet a.btn')), 'no manual Receipt button when receipts go by themselves');
  await act('pfdone');
  await run();
  const r2 = sent[sent.length - 1];
  ok(sent.length === 3 && /Amma, you paid GHS 100/.test(r2.sms), 'payment receipt: ' + r2.sms);

  // held bags: the receipt goes when they are handed over
  await p.evaluate(id => { V.tab = 'give'; render(); openGive(id, ''); }, amma.id); await p.waitForTimeout(820); await act('ghold'); await act('gsave');
  await run();
  ok(sent.length === 3, 'held bags: no receipt yet');
  await p.evaluate(() => { const e = S.entries.filter(x => x.type === 'give' && !x.off && live(x)).pop(); act('hand', {id: e.id}); });
  await run();
  ok(sent.length === 4 && /you took \d+ bags?/.test(sent[3].sms), 'handed over: receipt sent');

  // no signal: waits, then sends when it comes back
  mode = 'down';
  await p.evaluate(id => openGive(id, ''), amma.id); await p.waitForTimeout(820); await act('gsave');
  await run();
  ok(sent.length === 4, 'no signal: waits');
  mode = 'cors'; await run();
  ok(sent.length === 5, 'signal back: sent');

  // Arkesel refuses the key: nothing marked as sent, and Settings says why
  mode = 'refuse'; await p.evaluate(() => { SMS.cors = null; SMS.err = ''; });
  await p.evaluate(id => openGive(id, ''), amma.id); await p.waitForTimeout(820); await act('gsave');
  await run();
  await act('tab', '[data-t="book"]'); await act('settings');
  ok((await p.textContent('#sms_status')).includes('Authentication Failed'), 'refused key: Settings says "Not sending: Authentication Failed"');
  mode = 'cors'; await p.fill('#sms_key', 'good-key'); await act('back'); await act('tab', '[data-t="give"]');
  await run();
  ok(sent.length === 6 && sent[5].api_key === 'good-key', 'new key: the waiting receipt goes out');

  // a server that can't be read by the page (no CORS): still sends, once
  mode = 'opaque'; await p.evaluate(() => { SMS.cors = null; });
  await p.evaluate(id => openGive(id, ''), amma.id); await p.waitForTimeout(820); await act('gsave');
  await run(); await run();
  ok(sent.length === 7, 'answers the page cannot read: sent once, no double');

  // customers without a number get nothing; lines from before the switch are left alone
  const noPhone = await p.evaluate(() => S.people.find(q => !q.phone).id);
  await p.evaluate(id => openGive(id, ''), noPhone); await p.waitForTimeout(820); await act('gsave');
  await run();
  ok(sent.length === 7, 'no number: no message');
  ok(!sent.some(q => /Esi|Mama Esi/.test(q.sms)), 'older lines from before the switch were not sent');

  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', e.message.split('\n').slice(0, 3).join(' | ')); process.exit(2); });
