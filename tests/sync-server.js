// The real Worker (worker/stallbook-sync.mjs) running on this computer, with a small stand-in for D1 made from
// Node's built-in SQLite. The sync tests talk to it like the phones talk to Cloudflare.
//   node tests/sync-server.js [port]      (default 8769)
// Extra test-only paths: POST /__reset (empty the database), GET /__rows (what the server holds, to check it is scrambled).
const http = require('http');
const { DatabaseSync } = require('node:sqlite');

function makeD1() {
  const db = new DatabaseSync(':memory:');
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    async run() { const r = db.prepare(sql).run(...args); return {success: true, meta: {changes: r.changes}}; },
    async all() { return {success: true, results: db.prepare(sql).all(...args).map(x => ({...x}))}; },
    async first() { const r = db.prepare(sql).get(...args); return r ? {...r} : null; },
  });
  return {
    db,
    prepare: sql => stmt(sql),
    async batch(list) {
      db.exec('BEGIN');
      try { const out = []; for (const s of list) out.push(await s.run()); db.exec('COMMIT'); return out; }
      catch (e) { db.exec('ROLLBACK'); throw e; }
    },
  };
}

async function start(port = 8769) {
  const worker = (await import('../worker/stallbook-sync.mjs')).default;
  let d1 = makeD1();
  const server = http.createServer(async (req, res) => {
    const chunks = []; for await (const c of req) chunks.push(c);
    const body = Buffer.concat(chunks);
    const url = `http://127.0.0.1:${port}${req.url}`;
    if (req.url === '/__reset') { d1 = makeD1(); res.writeHead(200, {'access-control-allow-origin': '*'}); return res.end('ok'); }
    if (req.url === '/__rows') {
      let rows = []; try { rows = d1.db.prepare('SELECT book, k, id, u, d, ts FROM rows ORDER BY ts').all().map(x => ({...x})); } catch (e) {}
      res.writeHead(200, {'content-type': 'application/json', 'access-control-allow-origin': '*'}); return res.end(JSON.stringify(rows));
    }
    const request = new Request(url, {method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body});
    const out = await worker.fetch(request, {DB: d1});
    res.writeHead(out.status, Object.fromEntries(out.headers));
    res.end(Buffer.from(await out.arrayBuffer()));
  });
  await new Promise(r => server.listen(port, '127.0.0.1', r));
  return server;
}
module.exports = { start, makeD1 };
if (require.main === module) start(Number(process.argv[2]) || 8769).then(() => console.log('sync server on 8769'));
