/* StallBook cloud book: a tiny Cloudflare Worker with a D1 database.
 *
 * It keeps ONE thing per book: a table of rows. Every row's contents (a give, a payment, a woman, a load, a photo)
 * is scrambled (AES-GCM) on the phone before it arrives here, with a key made from the book code that only the
 * phones know. This Worker and Cloudflare see random-looking text, row ids and edit times, never names, numbers
 * or money.
 *
 * Rows: k = kind (e entry, p person, c load, l place, t buying trip, s settings, h photo), id, u = edit time,
 * d = the scrambled contents, ts = when this server stored it (phones ask for "everything since ts").
 *   - entries (e) and photos (h) are written once and never change.
 *   - the others are replaced only by a newer edit time (the last edit wins).
 *
 * Setup (see README, "Keep one book on every phone"): create a D1 database, make a Worker, paste this file,
 * add the D1 binding named DB. The tables are made by themselves on the first request.
 */
const KINDS = 'epclths';
const MAX_ROWS = 100;          /* rows in one push */
const MAX_BODY = 3_000_000;    /* bytes in one push */
const PAGE_ROWS = 400;         /* rows in one pull */
const PAGE_BYTES = 800_000;    /* bytes in one pull (small pages keep the free plan's 10 ms of work per request) */
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, GET, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '86400',
};
let ready = false;

const json = (obj, status = 200) => new Response(JSON.stringify(obj), {status, headers: {...CORS, 'content-type': 'application/json'}});
async function sha256hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
async function ensure(db) {
  if (ready) return;
  await db.batch([
    db.prepare('CREATE TABLE IF NOT EXISTS books (id TEXT PRIMARY KEY, auth TEXT NOT NULL, made INTEGER NOT NULL)'),
    db.prepare("CREATE TABLE IF NOT EXISTS rows (book TEXT NOT NULL, k TEXT NOT NULL, id TEXT NOT NULL, u TEXT NOT NULL DEFAULT '', d TEXT NOT NULL, ts INTEGER NOT NULL, PRIMARY KEY (book, k, id))"),
    db.prepare('CREATE INDEX IF NOT EXISTS rows_by_ts ON rows (book, ts)'),
  ]);
  ready = true;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, {status: 204, headers: CORS});
    const url = new URL(request.url);
    if (request.method === 'GET') return json({ok: true, app: 'stallbook-sync', v: 1});
    if (request.method !== 'POST' || url.pathname !== '/v1/sync') return json({ok: false, err: 'path'}, 404);
    if (!env.DB) return json({ok: false, err: 'nodb'}, 500);
    const len = Number(request.headers.get('content-length') || 0);
    if (len > MAX_BODY) return json({ok: false, err: 'big'}, 413);

    let b;
    try { b = JSON.parse(await request.text()); } catch (e) { return json({ok: false, err: 'json'}, 400); }
    if (!b || typeof b.book !== 'string' || !/^[0-9a-f]{32}$/.test(b.book) || typeof b.auth !== 'string' || !/^[0-9a-f]{64}$/.test(b.auth)) return json({ok: false, err: 'bad'}, 400);

    try {
      await ensure(env.DB);
      const hash = await sha256hex(b.auth);
      let book = await env.DB.prepare('SELECT auth FROM books WHERE id = ?').bind(b.book).first();
      if (!book) {
        if (!b.create) return json({ok: false, err: 'nobook'}, 404);
        await env.DB.prepare('INSERT OR IGNORE INTO books (id, auth, made) VALUES (?, ?, ?)').bind(b.book, hash, Date.now()).run();
        book = await env.DB.prepare('SELECT auth FROM books WHERE id = ?').bind(b.book).first();
      }
      if (!book || book.auth !== hash) return json({ok: false, err: 'auth'}, 401);

      /* push: write the rows in one statement */
      if (Array.isArray(b.rows) && b.rows.length) {
        if (b.rows.length > MAX_ROWS) return json({ok: false, err: 'rows'}, 413);
        const clean = [];
        for (const r of b.rows) {
          if (!r || typeof r.k !== 'string' || r.k.length !== 1 || !KINDS.includes(r.k) || typeof r.id !== 'string' || !r.id || r.id.length > 80 || typeof r.d !== 'string' || !r.d || r.d.length > 1_500_000) return json({ok: false, err: 'row'}, 400);
          clean.push({k: r.k, id: r.id, u: typeof r.u === 'string' ? r.u.slice(0, 40) : '', d: r.d});
        }
        await env.DB.prepare(
          `INSERT INTO rows (book, k, id, u, d, ts)
           SELECT ?, json_extract(value, '$.k'), json_extract(value, '$.id'), json_extract(value, '$.u'), json_extract(value, '$.d'), ? * 100 + key
           FROM json_each(?) WHERE true
           ON CONFLICT (book, k, id) DO UPDATE SET d = excluded.d, u = excluded.u, ts = excluded.ts
           WHERE rows.k NOT IN ('e', 'h') AND excluded.u > rows.u`
        ).bind(b.book, Date.now(), JSON.stringify(clean)).run();
      }

      /* pull: everything stored after "since" */
      if (b.pull) {
        const since = Number.isFinite(b.since) ? Math.max(0, Math.floor(b.since)) : 0;
        const found = await env.DB.prepare(`SELECT k, id, u, d, ts FROM rows WHERE book = ? AND ts > ? ORDER BY ts LIMIT ${PAGE_ROWS}`).bind(b.book, since).all();
        const out = []; let bytes = 0, more = found.results.length >= PAGE_ROWS;
        for (const r of found.results) {
          if (out.length && bytes + r.d.length > PAGE_BYTES) { more = true; break; }
          out.push({k: r.k, id: r.id, u: r.u, d: r.d, ts: r.ts}); bytes += r.d.length;
        }
        return json({ok: true, rows: out, cursor: out.length ? out[out.length - 1].ts : since, more, now: Date.now()});
      }
      return json({ok: true});
    } catch (e) {
      return json({ok: false, err: 'server', msg: String(e && e.message || e).slice(0, 200)}, 500);
    }
  },
};
