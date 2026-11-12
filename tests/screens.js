// Things that change while the app is open: keyboard, rotation, a screen that settles to a different size, a resized window.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const URL = process.env.URL || 'http://127.0.0.1:8768/';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const geo = p => p.evaluate(() => { const r = document.getElementById('shell').getBoundingClientRect(), t = document.querySelector('.tabs'), d = document.querySelector('.dock');
  return {top: Math.round(r.top), bottom: Math.round(r.bottom), w: Math.round(r.width), ih: innerHeight, iw: innerWidth, s: +getComputedStyle(document.documentElement).getPropertyValue('--s'), kb: document.documentElement.classList.contains('kb'),
    short: document.documentElement.classList.contains('short'), tabs: t ? t.getBoundingClientRect().height > 0 : false, dockBottom: d ? Math.round(d.getBoundingClientRect().bottom) : null, fs: parseFloat(getComputedStyle(document.documentElement).fontSize)}; });
const boot = async (b, w, h, mobile) => { const ctx = await b.newContext({viewport: {width: w, height: h}, deviceScaleFactor: 2, hasTouch: mobile, isMobile: mobile}); const p = await ctx.newPage(); p.errs = [];
  p.on('pageerror', e => p.errs.push(e.message)); await p.route(/fonts\.g/, r => r.abort()); await p.goto(URL); await wait(250);
  await p.evaluate(() => { S = normalize(demoData()); S.setup = true; S.lastLoc = S.locs[0].id; V.stack = []; V.tab = 'give'; commit(); render(); }); await wait(200); return p; };
(async () => {
  const b = await chromium.launch();

  // keyboard on a phone: the page gets shorter, the app stays the same size and the bar stays above the keyboard
  let p = await boot(b, 390, 844, true); let g = await geo(p);
  ok(g.s === 1 && g.bottom === 844 && g.tabs && !g.kb, 'iPhone 12: scale 1, fills 844, tabs shown');
  await p.click('#gq'); await wait(150);
  await p.setViewportSize({width: 390, height: 520}); await wait(500); g = await geo(p);
  ok(g.kb && g.s === 1 && g.bottom === 520 && !g.tabs && g.dockBottom <= 520 && g.dockBottom >= 500, `keyboard open (height 520): app stays scale 1, ends at ${g.bottom}, tabs hidden, bar at ${g.dockBottom}`);
  await p.setViewportSize({width: 390, height: 844}); await wait(500); await p.evaluate(() => document.activeElement.blur()); await wait(600); g = await geo(p);
  ok(!g.kb && g.bottom === 844 && g.tabs && g.dockBottom <= 844, 'keyboard closed: fills 844 again, tabs back');

  // rotate and come back
  await p.setViewportSize({width: 844, height: 390}); await wait(500); g = await geo(p);
  ok(g.bottom === 390 && g.top === 0 && g.s === 0.8 && !g.kb, `rotated to landscape: fills 390 tall, scale ${g.s}`);
  await p.setViewportSize({width: 390, height: 844}); await wait(500); g = await geo(p);
  ok(g.bottom === 844 && g.s === 1 && !g.kb, 'back to portrait: fills 844, scale 1');

  // the screen first reports a shorter size, then settles (a home-screen app can do this at launch)
  await p.setViewportSize({width: 390, height: 788}); await wait(300);
  await p.setViewportSize({width: 390, height: 844}); await wait(500); g = await geo(p);
  ok(g.bottom === 844 && g.dockBottom <= 844 && !g.kb, 'a launch size that settles taller: no white strip at the bottom');
  await p.setViewportSize({width: 390, height: 664}); await wait(400); g = await geo(p);
  ok(g.bottom === 664 && g.short && g.s === 1 && !g.kb && g.tabs, 'the visible height drops to 664 without a keyboard (Safari toolbars): fills it, tabs stay, compact, scale 1');
  ok(p.errs.length === 0, 'no errors');

  // desktop: resizing the window changes the scale with it, and the app always fills the window
  p = await boot(b, 1280, 800, false); g = await geo(p);
  ok(g.bottom === 800 && g.s > 1.2 && g.w < 1280, `desktop 1280×800: fills the height, scale ${g.s}, column ${g.w}px`);
  await p.setViewportSize({width: 1280, height: 500}); await wait(300); g = await geo(p);
  ok(g.bottom === 500 && g.s < 1.0, `window made shorter (500): still fills, scale ${g.s}`);
  await p.setViewportSize({width: 700, height: 900}); await wait(300); g = await geo(p);
  ok(g.bottom === 900 && g.w <= 700 && g.s > 1, `narrow window (700×900): fills, scale ${g.s}, width ${g.w}`);
  await p.setViewportSize({width: 1920, height: 1200}); await wait(300); g = await geo(p);
  ok(g.bottom === 1200 && g.s === 1.35 && g.fs === 21.6, `big screen: scale capped at ${g.s}, text ${g.fs}px`);

  // iPad: keyboard open on a tablet keeps the scale
  p = await boot(b, 820, 1180, true); g = await geo(p); const s0 = g.s; await p.click('#gq'); await wait(150);
  await p.setViewportSize({width: 820, height: 700}); await wait(500); g = await geo(p);
  ok(g.kb && g.s === s0 && g.bottom === 700, `iPad keyboard: scale stays ${s0}, app ends at the top of the keyboard`);
  await p.setViewportSize({width: 820, height: 1180}); await wait(500); g = await geo(p);
  ok(!g.kb && g.bottom === 1180, 'iPad keyboard hidden with its own key (the text box keeps focus): fills again');

  // text is never clipped sideways on any size: nothing wider than the screen
  for (const [w, h, m] of [[320, 568, true], [768, 1024, true], [1366, 768, false]]) { const q = await boot(b, w, h, m); const o = await q.evaluate(() => document.documentElement.scrollWidth - innerWidth); ok(o <= 0, `${w}×${h}: no sideways overflow`); }
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', e.message.split('\n').slice(0, 3).join(' | ')); process.exit(2); });
