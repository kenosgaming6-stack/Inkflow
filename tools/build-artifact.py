"""Builds the Claude artifact version of StallBook from public/index.html.

The artifact keeps the same app and adds online saving: the book stays on the phone
and is copied to the artifact's db, under rules that only the owner can read or write.
"""
import re, sys

import os
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'index.html')
OUT = sys.argv[1]
s = open(SRC, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, f'{n} matches for: {old[:90]!r}'
    s = s.replace(old, new)


# ---- page skeleton: the artifact wraps the file in its own doctype, head and body
head_end = s.index('<style>')
s = ('<title>StallBook</title>\n'
     '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
     '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
     '<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap" rel="stylesheet">\n'
     + s[head_end:])
rep('</style>\n</head>\n<body>\n', '</style>\n')
rep('</script>\n</body>\n</html>', '</script>')

# ---- fonts come from Google Fonts (the same Atkinson Hyperlegible files, cedi sign included)
s, n = re.subn(r"/\* Atkinson Hyperlegible ships with the app.*?\*/\n(@font-face\{[^\n]*\}\n){4}", '', s, flags=re.S)
assert n == 1

# ---- the viewer pads the page for the notch and home bar, so the app adds nothing of its own
rep('#shell{position:relative;height:var(--app-h,100%);max-width:480px;margin:0 auto;background:var(--paper);overflow:hidden;padding-top:env(safe-area-inset-top,0px)}',
    '#shell{position:relative;height:100%;max-width:480px;margin:0 auto;background:var(--paper);overflow:hidden}')
rep('#shell::before{content:"";position:absolute;top:0;left:0;right:0;height:env(safe-area-inset-top,0px);background:var(--bar);z-index:60;pointer-events:none}\n', '')
s = s.replace('env(safe-area-inset-bottom,0px)', '0px')
assert 'safe-area' not in s

rep("const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);\n", '')
rep("const STANDALONE = window.navigator.standalone === true || !!(window.matchMedia && matchMedia('(display-mode: standalone)').matches);\n", '')
rep("${t('book', 'book', 'Book', 0, needsBackup())}</nav>", "${t('book', 'book', 'Book', 0, !CL.on && needsBackup())}</nav>")

# ---- header comment
rep('  One file, works offline, data stays on this phone (back it up to WhatsApp).',
    '  One file. The book is kept on this phone and saved online in the owner\'s Claude account.')

# ---- storage: every save also goes online
rep("function save() { if (V.demo) return; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }",
    r"""function saveLocal() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
function save() { if (V.demo) return; saveLocal(); clQueue(); }

/* ---------- saved online ----------
   The artifact's db keeps a copy of the book that only the owner can read or write.
   stallbook/book holds settings and the small fields; each list (entries, people, cars, locs)
   is split into pieces under stallbook/book/<list>/p0000, well below the 256 KB document limit.
   Rules: an unsaved change on this phone is never thrown away, and when this phone and the
   online copy both changed, the two are merged by line id, so nothing from either is lost. */
const CL = {db: null, on: false, pending: false, busy: false, again: false, syncing: false, timer: 0, syncTimer: 0, retry: 0, synced: {}, remoteRev: 0, full: false, sub: null};
const CL_ROOT = 'stallbook/book', CL_LISTS = ['entries', 'people', 'cars', 'locs'], CL_UNSAVED = 'stallbook_unsaved', CL_BASE = 'stallbook_base';
let DL = null;
function clDocs(s) {
  const out = {}, meta = {parts: {}};
  Object.keys(s).forEach(k => { if (!CL_LISTS.includes(k) && k !== 'migrated') meta[k] = s[k]; });
  for (const k of CL_LISTS) {
    const parts = []; let cur = [], size = 0;
    for (const x of s[k] || []) { const n = JSON.stringify(x).length + 1; if (cur.length && (cur.length >= 400 || size + n > 100000)) { parts.push(cur); cur = []; size = 0; } cur.push(x); size += n; }
    if (cur.length) parts.push(cur);
    parts.forEach((p, i) => { out[CL_ROOT + '/' + k + '/p' + String(i).padStart(4, '0')] = {i, items: p}; });
    meta.parts[k] = parts.length;
  }
  out[CL_ROOT] = meta; /* written last, so a count never goes up before its pieces */
  return out;
}
function clJson(docs) { const m = {}; for (const k in docs) m[k] = JSON.stringify(docs[k]); return m; }
function hasBook(s) { return !!(s && (s.setup || s.people.length || s.entries.length || s.cars.length)); }
function within(p, ms) { return Promise.race([p, new Promise((_, no) => setTimeout(() => no({code: 'unavailable'}), ms))]); }
/* Reads the online book. Resolves null when there is none yet. */
async function clLoad() {
  const m = await CL.db.doc(CL_ROOT).get();
  if (!m.exists) { CL.synced = {}; return null; }
  const meta = JSON.parse(JSON.stringify(m.data())); const parts = meta.parts || {}; delete meta.parts;
  const s = Object.assign({}, meta), stale = [];
  for (const k of CL_LISTS) {
    const n = Number(parts[k]) || 0, got = [];
    if (n) {
      const q = await CL.db.collection(CL_ROOT + '/' + k).get();
      q.docs.forEach(d => { const b = d.data(); if (b && b.i < n && Array.isArray(b.items)) got[b.i] = b.items; else stale.push(CL_ROOT + '/' + k + '/' + d.id); });
    }
    s[k] = [].concat(...got.filter(Array.isArray)).map(x => JSON.parse(JSON.stringify(x)));
  }
  CL.synced = clJson(clDocs(s)); stale.forEach(p => { CL.synced[p] = 'stale'; });
  return s;
}
/* Both sides changed: keep this phone's version of each line, add the lines only the other side has. */
function clMerge(mine, theirs) {
  const o = Object.assign({}, theirs, mine);
  for (const k of CL_LISTS) { const have = new Set((mine[k] || []).map(x => x.id)); o[k] = (mine[k] || []).concat((theirs[k] || []).filter(x => !have.has(x.id))); }
  o.rev = Math.max(mine.rev || 0, theirs.rev || 0) + 1;
  return o;
}
function clAdopt(remote) { S = normalize(remote); VER++; saveLocal(); CL.remoteRev = S.rev || 0; lsSet(CL_BASE, String(CL.remoteRev)); }
function clQueue() {
  CL.pending = true; lsSet(CL_UNSAVED, '1');
  if (!CL.on) return;
  clIcon(); clearTimeout(CL.timer); CL.timer = setTimeout(clFlush, 700);
}
async function clFlush() {
  clearTimeout(CL.timer);
  if (!CL.on) return;
  if (V.demo) { CL.timer = setTimeout(clFlush, 5000); return; }
  if (CL.busy) { CL.again = true; return; }
  CL.busy = true;
  try {
    do {
      CL.again = false;
      /* someone else saved since we last looked (another phone): merge first */
      const m = await within(CL.db.doc(CL_ROOT).get(), 20000);
      const rr = m.exists ? Number(m.data().rev) || 0 : 0;
      if (rr > CL.remoteRev) { const remote = await within(clLoad(), 30000); if (remote) { S = normalize(clMerge(S, remote)); VER++; saveLocal(); } CL.remoteRev = rr; }
      const docs = clDocs(S), rev = S.rev || 0;
      for (const path of Object.keys(docs)) {
        if (V.demo) throw {code: 'demo'};
        const j = JSON.stringify(docs[path]);
        if (CL.synced[path] === j) continue;
        await within(CL.db.doc(path).set(JSON.parse(j)), 20000);
        CL.synced[path] = j;
      }
      for (const path of Object.keys(CL.synced)) if (!(path in docs)) { await within(CL.db.doc(path).delete(), 20000); delete CL.synced[path]; }
      CL.remoteRev = Math.max(CL.remoteRev, rev); lsSet(CL_BASE, String(CL.remoteRev));
    } while (CL.again);
    CL.pending = false; CL.retry = 0; lsSet(CL_UNSAVED, '');
  } catch (e) {
    const code = e && e.code;
    if (code === 'demo') CL.timer = setTimeout(clFlush, 5000);
    else if (['invalid_argument', 'revoked', 'not_granted', 'capability_disabled', 'capability_removed', 'transform_error'].includes(code)) { CL.on = false; if (CL.sub) CL.sub(); }
    else if (code === 'quota_exceeded') { if (!CL.full) { CL.full = true; toast('Online space is full. Save a backup file in Settings.'); } CL.timer = setTimeout(clFlush, 120000); }
    else { CL.retry = Math.min(CL.retry + 1, 5); CL.timer = setTimeout(clFlush, 1500 * Math.pow(2, CL.retry)); } /* no signal: try again soon */
  } finally { CL.busy = false; clIcon(); }
}
/* Lines up this phone's book with the online one. Resolves true when the book on screen changed. */
function clLater(ms) { clearTimeout(CL.syncTimer); CL.syncTimer = setTimeout(() => clSync().then(clShow, () => {}), ms); }
function clShow(changed) {
  if (!changed || !STARTED) return;
  if (V.stack.length === 1 && V.stack[0].v === 'setup' && hasBook(S)) V.stack = [];
  render();
}
async function clSync() {
  if (CL.syncing || CL.on) return false;
  if (V.demo) { clLater(5000); return false; }
  CL.syncing = true;
  let remote;
  try { remote = await within(clLoad(), 30000); }
  catch (e) {
    CL.syncing = false;
    if (['invalid_argument', 'revoked', 'not_granted', 'capability_disabled', 'capability_removed'].includes(e && e.code)) return false;
    clLater(15000); return false; /* offline: the phone's copy is used until the online one can be read */
  }
  CL.syncing = false;
  const unsaved = CL.pending || lsGet(CL_UNSAVED) === '1', base = Number(lsGet(CL_BASE)) || 0;
  let changed = false;
  if (remote) {
    const rr = Number(remote.rev) || 0; CL.remoteRev = rr;
    if (!unsaved) { if (rr > (S.rev || 0) || !hasBook(S)) { clAdopt(remote); changed = true; } else if (rr < (S.rev || 0)) CL.pending = true; }
    else if (rr > base) { S = normalize(clMerge(S, remote)); VER++; saveLocal(); changed = true; CL.pending = true; }
    else CL.pending = true;
  } else if (hasBook(S)) CL.pending = true;
  CL.on = true;
  if (CL.pending) clFlush(); else clIcon();
  if (!CL.sub) CL.sub = CL.db.doc(CL_ROOT).onSnapshot(snap => {
    if (!snap.exists || snap.metadata.hasPendingWrites || CL.pending || CL.busy || V.demo) return;
    const rr = Number(snap.data().rev) || 0;
    if (rr <= CL.remoteRev || V.stack.length || layer.querySelector('.ov')) return;
    within(clLoad(), 30000).then(remote => {
      if (!remote || CL.pending || CL.busy || V.demo || V.stack.length || layer.querySelector('.ov')) return;
      if ((Number(remote.rev) || 0) > (S.rev || 0)) { clAdopt(remote); render(); }
    }).catch(() => {});
  }, () => { CL.sub = null; });
  return changed;
}
async function clConnect() {
  if (!(window.claude && window.claude.use)) return false;
  window.claude.use('downloads').then(x => { DL = x; }, () => {});
  let db = null; try { db = await window.claude.use('db'); } catch (e) {}
  if (!db) return false;
  CL.db = db; return clSync();
}
function clIcon() { document.querySelectorAll('[data-act="backupsheet"]').forEach(b => { b.outerHTML = backupBtn(); }); }
function clWake() { if (CL.db && !CL.on) clLater(0); else if (CL.pending) clFlush(); }
window.addEventListener('online', clWake);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') clWake(); });""")

rep("function commit() { VER++; if (!V.demo) S.changedAt = nowIso(); save(); smsSoon(); }",
    "function commit() { VER++; if (!V.demo) { S.changedAt = nowIso(); S.rev = Math.max(S.rev || 0, CL.remoteRev || 0) + 1; } save(); smsSoon(); }")
# the viewer blocks requests to other websites, so receipts cannot go by SMS from the artifact
rep("const SMS_OK = true;", "const SMS_OK = false;")

# the cloud icon at the top now means "saved online" when the online copy is on
rep("function needsBackup() { return !V.demo && !!S.changedAt && S.entries.length > 0 && (!S.lastBackup || S.changedAt > S.lastBackup); }",
    "function needsBackup() { if (V.demo) return false; if (CL.on) return CL.pending; return !!S.changedAt && S.entries.length > 0 && (!S.lastBackup || S.changedAt > S.lastBackup); }")
rep("""aria-label="${need ? 'Backup needed' : 'Backed up'}\"""",
    """aria-label="${CL.on ? (need ? 'Not saved online yet' : 'Saved online') : (need ? 'Backup needed' : 'Backed up')}\"""")

# ---- settings: backup section
rep("""<p class="small">${S.lastBackup ? 'Last backup: ' + dmy(S.lastBackup) : 'No backup yet.'} If this phone is lost, the backup file brings the book back.</p>
      <button class="btn ink" data-act="backup">${svg('cloud')} Back up (WhatsApp or Files)</button>""",
    """<p class="small">${CL.on ? 'Your book is saved online in your Claude account. ' : ''}${S.lastBackup ? 'Last backup file: ' + dmy(S.lastBackup) + '.' : 'No backup file yet.'}${CL.on ? '' : ' If this phone is lost, the backup file brings the book back.'}</p>
      <button class="btn ${CL.on ? 'ghost' : 'ink'}" data-act="backup">${svg('cloud')} Save a backup file</button>""")
rep("""      ${IOS && !STANDALONE ? `<div class="setbox"><button class="btn ghost" data-act="installhelp">Put StallBook on your Home Screen</button></div>` : ''}\n""", '')

# ---- backup file: the artifact viewer saves files through its downloads capability
rep("""  const done = () => { S.lastBackup = nowIso(); save(); render(); toast('Backup ready. Keep it in WhatsApp.'); };
  try { const file""",
    """  const done = () => { S.lastBackup = nowIso(); save(); render(); toast('Backup file saved'); };
  if (DL) { DL.save({filename: name, data: json}).then(done, x => { if (!x || x.code !== 'declined') toast('Saving a file does not work here'); }); return; }
  try { const file""")
rep("""function backupSheet() {
  const need = needsBackup();""",
    """function backupSheet() {
  const need = needsBackup();
  if (CL.on) return sheet(`<i class="grab"></i><h3>${need ? 'Not saved online yet' : 'Saved online ✓'}</h3><p>${need ? 'The newest changes are on this phone only. They go online by themselves when there is internet.' : 'Your book is saved in your Claude account. If this phone is lost, open StallBook on another phone signed in to the same account. Everything is there.'}</p>
    <button class="btn ghost" data-act="backup">${svg('cloud')} Also save a backup file</button><button class="btn ghost" data-act="sheetclose">Close</button>`);""")

# ---- wording that changes when the book is also online
rep("<p>This cannot be reversed. Back up first if you are not sure.</p>",
    "<p>This cannot be reversed.${CL.on ? ' It also deletes the copy saved online.' : ''} Back up first if you are not sure.</p>")
rep("It replaces the book on this phone.</p>", "It replaces the book on this phone${CL.on ? ' and online' : ''}.</p>")

# ---- messages: SMS links may do nothing inside the viewer, so the text can be copied too
rep("""    <p class="small center">${esc(p.phone)}</p>`);
}""",
    """    <button class="btn ghost" data-act="copymsg" data-t="${esc(text)}">Copy message</button>
    <p class="small center">${esc(p.phone)}</p>`);
}
function copyText(t) {
  const fail = () => toast('Press and hold the message to copy it');
  try { navigator.clipboard.writeText(t).then(() => toast('Message copied'), fail); } catch (e) { fail(); }
}""")
rep("  case 'msg': return msgSheet(d.id);", "  case 'msg': return msgSheet(d.id);\n  case 'copymsg': return copyText(d.t);")

# ---- no Home Screen tip, keyboard fitting or service worker inside the viewer
rep("  case 'installhelp': return installSheet();\n", '')
rep("  case 'installok': lsSet('stallbook_install_hint', '1'); return closeSheet();\n", '')
start = s.index('/* ---------- start ---------- */')
s = s[:start] + r"""/* ---------- start ---------- */
let STARTED = false;
function start() {
  if (STARTED) return; STARTED = true;
  if (S.migrated) { delete S.migrated; commit(); setTimeout(() => toast('Your book from version 1 is here. Nothing was lost.'), 500); }
  else if (S.upgraded) { delete S.upgraded; saveLocal(); }
  if (!givingCar() && debtors().some(x => x.st.sev >= 3)) V.tab = 'collect';
  try { history.replaceState({root: 1}, ''); history.pushState({g: 1}, ''); } catch (e) {}
  if (!S.setup && !S.people.length && !S.cars.length) { V.stack = [{v: 'setup'}]; try { history.pushState({d: 1}, ''); } catch (e) {} }
  render();
}
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
/* A phone that already has the book opens it at once. A new phone waits for the online copy. */
if (lsGet(KEY) || lsGet(V1KEY) || !(window.claude && window.claude.use)) start();
else { app.innerHTML = `<div class="empty" style="padding-top:64px"><h2>Opening your book…</h2><p>Getting it from your Claude account.</p></div>`; setTimeout(start, 15000); }
clConnect().then(changed => { if (!STARTED) start(); else clShow(changed); }, () => start());
""" + s[s.index('</script>'):]

for gone in ['serviceWorker', 'installSheet', 'visualViewport', 'STANDALONE', 'IOS', 'apple-touch', 'manifest', 'fonts/']:
    assert gone not in s, gone
open(OUT, 'w', encoding='utf-8').write(s)
print('wrote', OUT, len(s), 'bytes')
