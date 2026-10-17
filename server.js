// Folio Studio - Express + MySQL backend (multi-user portfolio generator)
const express = require('express'), mysql = require('mysql2/promise'), multer = require('multer'), cors = require('cors');
const crypto = require('crypto'), path = require('path'), fs = require('fs');

const PORT = process.env.PORT || 3000, DBNAME = 'folio_studio_db';
const CFG = { host: process.env.DB_HOST || 'localhost', user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '' };
const TEMPLATES = ['sketch', 'minimal', 'editorial', 'gradient', 'noir', 'cdoors', 'caurora', 'ceditorial', 'cminimal'];
const app = express(); let db;

app.use(cors(), express.json({ limit: '1mb' }));
app.use((req, res, next) => { console.log(`${new Date().toLocaleTimeString()}  ${req.method.padEnd(6)} ${req.url}`); next(); }); // custom logger middleware
app.use(express.static(path.join(__dirname, 'public')));
const UP = path.join(__dirname, 'public', 'uploads'); fs.mkdirSync(UP, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({ destination: UP, filename: (q, f, cb) => cb(null, Date.now() + '-' + crypto.randomBytes(3).toString('hex') + path.extname(f.originalname).toLowerCase()) }),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (q, f, cb) => /^image\/(png|jpe?g|webp|gif)$/.test(f.mimetype) ? cb(null, true) : cb(new Error('Only image files (png, jpg, webp, gif) are allowed'))
});
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);
const rmFile = p => { if (p && p.startsWith('/uploads/')) fs.unlink(path.join(__dirname, 'public', p), () => {}); };

// ---------- security helpers ----------
const hashPin = pin => { const s = crypto.randomBytes(8).toString('hex'); return s + ':' + crypto.scryptSync(pin, s, 32).toString('hex'); };
const checkPin = (pin, h) => { const [s, x] = h.split(':'); return crypto.timingSafeEqual(Buffer.from(x, 'hex'), crypto.scryptSync(String(pin), s, 32)); };
const token = (slug, hash) => crypto.createHash('sha256').update(slug + ':' + hash + ':folio').digest('hex');
const auth = wrap(async (req, res, next) => {
  const [r] = await db.query('SELECT * FROM portfolios WHERE slug=?', [req.params.slug]);
  if (!r.length) return res.status(404).json({ errors: ['Portfolio not found'] });
  if ((req.headers.authorization || '').replace('Bearer ', '') !== token(r[0].slug, r[0].pin_hash)) return res.status(401).json({ errors: ['Owner login required'] });
  req.pf = r[0]; next();
});

// ---------- validation ----------
const COLS = { skills: ['name', 'level', 'category'], education: ['degree', 'institute', 'period', 'details'], experience: ['role', 'company', 'period', 'details'], projects: ['title', 'description', 'tech', 'link'], posts: ['title', 'content', 'link'] };
const REQ = { skills: ['name'], education: ['degree', 'institute'], experience: ['role', 'company'], projects: ['title', 'description'], posts: ['title'] };
const LBL = { skills: 'Skill', education: 'Education', experience: 'Experience', projects: 'Project', posts: 'Post' };
const isUrl = v => !v || /^https?:\/\/\S+$/i.test(v);
function parse(req) {
  let d; try { d = JSON.parse(req.body.data || '{}'); } catch { return { errors: ['Invalid form data'] }; }
  const e = [], p = d.p || {}, out = { p, errors: e };
  if (!String(p.name || '').trim()) e.push('Name is required');
  if (!String(p.title || '').trim()) e.push('Professional title is required');
  if (!String(p.about || '').trim()) e.push('About me is required');
  if (!/^\S+@\S+\.\S+$/.test(String(p.email || '').trim())) e.push('A valid email is required');
  if (!isUrl(p.github)) e.push('GitHub link must start with http:// or https://');
  if (!isUrl(p.linkedin)) e.push('LinkedIn link must start with http:// or https://');
  for (const t in COLS) {
    out[t] = (Array.isArray(d[t]) ? d[t] : []).filter(r => r && Object.values(r).some(v => String(v || '').trim()));
    out[t].forEach((r, i) => {
      REQ[t].forEach(k => { if (!String(r[k] || '').trim()) e.push(`${LBL[t]} #${i + 1}: ${k} is required`); });
      if (t === 'skills' && !(+r.level >= 0 && +r.level <= 100)) e.push(`Skill #${i + 1}: level must be 0-100`);
      if (r.link && !isUrl(r.link)) e.push(`${LBL[t]} #${i + 1}: link must start with http:// or https://`);
    });
  }
  return out;
}
const PF = ['name', 'title', 'tagline', 'about', 'email', 'phone', 'location', 'github', 'linkedin'];
const val = (r, k) => k === 'level' ? Math.round(+r.level || 0) : (String(r[k] ?? '').trim() || null);
async function saveChildren(c, id, d) {
  for (const t in COLS) {
    await c.query(`DELETE FROM ${t} WHERE portfolio_id=?`, [id]);
    for (const r of d[t]) await c.query(`INSERT INTO ${t} (portfolio_id,${COLS[t]}) VALUES (?,${COLS[t].map(() => '?')})`, [id, ...COLS[t].map(k => val(r, k))]);
  }
}
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'me';

// ---------- portfolios ----------
app.get('/api/portfolios', wrap(async (req, res) => { const [r] = await db.query('SELECT slug,name,title,image,template FROM portfolios ORDER BY id DESC LIMIT 12'); res.json(r); }));

app.post('/api/portfolios', upload.single('image'), wrap(async (req, res) => {
  const d = parse(req), pin = String(req.body.pin || '');
  if (pin.length < 4) d.errors.push('Choose an edit PIN of at least 4 characters');
  if (d.errors.length) { if (req.file) rmFile('/uploads/' + req.file.filename); return res.status(400).json({ errors: d.errors }); }
  let slug = slugify(d.p.name); const [ex] = await db.query('SELECT id FROM portfolios WHERE slug=?', [slug]);
  if (ex.length) slug += '-' + crypto.randomBytes(2).toString('hex');
  const tpl = TEMPLATES.includes(d.p.template) ? d.p.template : 'sketch', hash = hashPin(pin), c = await db.getConnection();
  try {
    await c.beginTransaction();
    const [r] = await c.query(`INSERT INTO portfolios (slug,${PF},image,template,pin_hash) VALUES (?,${PF.map(() => '?')},?,?,?)`, [slug, ...PF.map(k => val(d.p, k)), req.file ? '/uploads/' + req.file.filename : null, tpl, hash]);
    await saveChildren(c, r.insertId, d); await c.commit();
  } catch (e) { await c.rollback(); throw e; } finally { c.release(); }
  res.status(201).json({ slug, token: token(slug, hash) });
}));

app.get('/api/p/:slug', wrap(async (req, res) => {
  const [r] = await db.query('SELECT * FROM portfolios WHERE slug=?', [req.params.slug]);
  if (!r.length) return res.status(404).json({ errors: ['Portfolio not found'] });
  if (req.query.v) await db.query('UPDATE portfolios SET views=views+1 WHERE id=?', [r[0].id]);
  const { pin_hash, id, ...p } = r[0], out = { p };
  for (const t in COLS) [out[t]] = await db.query(`SELECT * FROM ${t} WHERE portfolio_id=? ORDER BY id`, [id]);
  res.json(out);
}));

app.post('/api/p/:slug/login', wrap(async (req, res) => {
  const [r] = await db.query('SELECT slug,pin_hash FROM portfolios WHERE slug=?', [req.params.slug]);
  if (!r.length) return res.status(404).json({ errors: ['Portfolio not found'] });
  if (!checkPin(req.body.pin || '', r[0].pin_hash)) return res.status(401).json({ errors: ['Wrong PIN'] });
  res.json({ token: token(r[0].slug, r[0].pin_hash) });
}));

app.put('/api/p/:slug', auth, upload.single('image'), wrap(async (req, res) => {
  const d = parse(req); if (d.errors.length) { if (req.file) rmFile('/uploads/' + req.file.filename); return res.status(400).json({ errors: d.errors }); }
  const c = await db.getConnection();
  try {
    await c.beginTransaction();
    await c.query(`UPDATE portfolios SET ${PF.map(k => k + '=?')}${req.file ? ',image=?' : ''} WHERE id=?`, [...PF.map(k => val(d.p, k)), ...(req.file ? ['/uploads/' + req.file.filename] : []), req.pf.id]);
    await saveChildren(c, req.pf.id, d); await c.commit();
  } catch (e) { await c.rollback(); throw e; } finally { c.release(); }
  if (req.file) rmFile(req.pf.image); res.json({ ok: true });
}));

app.post('/api/p/:slug/template', auth, wrap(async (req, res) => {
  if (!TEMPLATES.includes(req.body.template)) return res.status(400).json({ errors: ['Unknown template'] });
  await db.query('UPDATE portfolios SET template=? WHERE id=?', [req.body.template, req.pf.id]); res.json({ ok: true });
}));
app.delete('/api/p/:slug', auth, wrap(async (req, res) => { await db.query('DELETE FROM portfolios WHERE id=?', [req.pf.id]); rmFile(req.pf.image); res.json({ ok: true }); }));

// ---------- contact messages ----------
app.post('/api/p/:slug/messages', wrap(async (req, res) => {
  const b = req.body, e = [];
  if (!String(b.name || '').trim()) e.push('name is required'); if (!/^\S+@\S+\.\S+$/.test(String(b.email || ''))) e.push('a valid email is required'); if (!String(b.message || '').trim()) e.push('message is required');
  if (e.length) return res.status(400).json({ errors: e });
  const [r] = await db.query('SELECT id FROM portfolios WHERE slug=?', [req.params.slug]); if (!r.length) return res.status(404).json({ errors: ['Portfolio not found'] });
  await db.query('INSERT INTO messages (portfolio_id,name,email,message) VALUES (?,?,?,?)', [r[0].id, b.name.trim(), b.email.trim(), b.message.trim()]); res.status(201).json({ ok: true });
}));
app.get('/api/p/:slug/messages', auth, wrap(async (req, res) => { const [r] = await db.query('SELECT * FROM messages WHERE portfolio_id=? ORDER BY id DESC', [req.pf.id]); res.json(r); }));
app.delete('/api/p/:slug/messages/:id', auth, wrap(async (req, res) => { await db.query('DELETE FROM messages WHERE id=? AND portfolio_id=?', [req.params.id, req.pf.id]); res.json({ ok: true }); }));

// ---------- GitHub integration (public API, cached 10 min) ----------
const cache = {};
async function ghFetch(u, force) {
  const bad = (status, msg) => Object.assign(new Error(msg), { status, errors: [msg] });
  if (!/^[A-Za-z0-9-]{1,39}$/.test(u)) throw bad(400, 'Invalid GitHub username');
  if (!force && cache[u] && Date.now() - cache[u].t < 6e5) return cache[u].d;
  const H = { headers: { 'User-Agent': 'folio-studio', Accept: 'application/vnd.github+json' } };
  const [ur, rr] = await Promise.all([fetch(`https://api.github.com/users/${u}`, H), fetch(`https://api.github.com/users/${u}/repos?per_page=100&sort=updated`, H)]);
  if (ur.status === 404) throw bad(404, 'GitHub user not found');
  if (!ur.ok || !rr.ok) throw bad(502, 'GitHub is unavailable or rate-limited. Try again later.');
  const g = await ur.json(), repos = await rr.json();
  const d = { user: { login: g.login, name: g.name, avatar: g.avatar_url, bio: g.bio, followers: g.followers, public_repos: g.public_repos, url: g.html_url },
    repos: repos.filter(r => !r.fork).map(r => ({ name: r.name, description: r.description, language: r.language, stars: r.stargazers_count, forks: r.forks_count, url: r.html_url })).sort((a, b) => b.stars - a.stars).slice(0, 12) };
  cache[u] = { t: Date.now(), d }; return d;
}
const sendErr = (res, e) => e.errors ? res.status(e.status).json({ errors: e.errors }) : null;
app.get('/api/github/:user', wrap(async (req, res) => {
  try { res.json(await ghFetch(req.params.user)); } catch (e) { if (!sendErr(res, e)) throw e; }
}));

// Owner "Sync GitHub": add any repo that is not already a project (matched by link). Nothing is removed or changed.
app.post('/api/p/:slug/sync/github', auth, wrap(async (req, res) => {
  const u = String(req.pf.github || '').replace(/\/+$/, '').split('/').pop();
  if (!u) return res.status(400).json({ errors: ['Add your GitHub link first (Edit portfolio)'] });
  let g; try { g = await ghFetch(u, true); } catch (e) { if (sendErr(res, e)) return; throw e; }
  const [have] = await db.query('SELECT link FROM projects WHERE portfolio_id=?', [req.pf.id]), seen = new Set(have.map(r => r.link));
  let added = 0;
  for (const r of g.repos.slice(0, 8)) {
    if (seen.has(r.url)) continue;
    await db.query('INSERT INTO projects (portfolio_id,title,description,tech,link) VALUES (?,?,?,?,?)', [req.pf.id, r.name.slice(0, 150), r.description || 'GitHub repository', r.language || null, r.url]); added++;
  }
  res.json({ ok: true, added, total: g.repos.length });
}));

// ---------- LinkedIn posts (LinkedIn has no public feed API, so we read the Open Graph preview of each post link) ----------
const liOk = v => { try { const u = new URL(v); return u.protocol === 'https:' && /(^|\.)linkedin\.com$/i.test(u.hostname) ? u : null; } catch { return null; } };
const decode = s => String(s || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/\s+/g, ' ').trim();
const og = (html, k) => { const m = html.match(new RegExp('<meta[^>]+(?:property|name)=["\']' + k + '["\'][^>]*content=["\']([^"\']*)["\']', 'i')) || html.match(new RegExp('<meta[^>]+content=["\']([^"\']*)["\'][^>]*(?:property|name)=["\']' + k + '["\']', 'i')); return m ? decode(m[1]) : ''; };
async function linkedinPost(raw) {
  const u = liOk(String(raw || '').trim()); if (!u) throw Object.assign(new Error('Not a LinkedIn link'), { status: 400, errors: ['Only https://www.linkedin.com post links are supported'] });
  const link = (u.origin + u.pathname).slice(0, 255); let title = '', content = '', fetched = false;
  try {
    const r = await fetch(u.href, { redirect: 'manual', signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FolioStudio/1.0; link preview)', Accept: 'text/html', 'Accept-Language': 'en' } });
    if (r.status === 200) { const html = (await r.text()).slice(0, 300000); title = og(html, 'og:title'); content = og(html, 'og:description') || og(html, 'description'); fetched = !!(title || content); }
  } catch { /* LinkedIn may block the request - fall back to the link itself */ }
  if (!title) { // fall back to the readable part of /posts/<name>_<slug>-activity-123
    const m = u.pathname.match(/\/posts\/[^_/]+_([^/]+?)-(?:share|activity|ugcPost)-\d+/i);
    title = m ? decode(m[1].replace(/-/g, ' ')).replace(/^./, c => c.toUpperCase()) : 'LinkedIn post';
  }
  return { title: title.slice(0, 200), content: content.slice(0, 600), link, fetched };
}
app.get('/api/linkedin/preview', wrap(async (req, res) => { try { res.json(await linkedinPost(req.query.url)); } catch (e) { if (!sendErr(res, e)) throw e; } }));
app.post('/api/p/:slug/sync/linkedin', auth, wrap(async (req, res) => {
  const urls = [...new Set((Array.isArray(req.body.urls) ? req.body.urls : []).map(x => String(x).trim()).filter(Boolean))].slice(0, 10);
  if (!urls.length) return res.status(400).json({ errors: ['Paste at least one LinkedIn post link'] });
  const [have] = await db.query('SELECT link FROM posts WHERE portfolio_id=?', [req.pf.id]), seen = new Set(have.map(r => r.link));
  let added = 0, skipped = 0; const errors = [];
  for (const raw of urls) {
    try {
      const p = await linkedinPost(raw); if (seen.has(p.link)) { skipped++; continue; }
      await db.query('INSERT INTO posts (portfolio_id,title,content,link) VALUES (?,?,?,?)', [req.pf.id, p.title, p.content || null, p.link]); seen.add(p.link); added++;
    } catch (e) { errors.push(`${raw.slice(0, 60)}: ${(e.errors || [e.message])[0]}`); }
  }
  if (!added && errors.length) return res.status(400).json({ errors });
  res.json({ ok: true, added, skipped, errors });
}));

// ---------- pages + errors ----------
app.get('/p/:slug', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.use('/api', (req, res) => res.status(404).json({ errors: ['Route not found'] }));
app.use((err, req, res, next) => { console.error('  ! ' + err.message); res.status(/image|File too large/i.test(err.message) ? 400 : 500).json({ errors: [err.message] }); });

(async () => {
  try {
    const c = await mysql.createConnection({ ...CFG, multipleStatements: true });
    await c.query(fs.readFileSync(path.join(__dirname, 'folio_studio_db.sql'), 'utf8')); await c.end();
    db = mysql.createPool({ ...CFG, database: DBNAME, waitForConnections: true, connectionLimit: 10 }); await db.query('SELECT 1');
    console.log(`\u2714 MySQL connected  (${DBNAME})`);
    app.listen(PORT, () => console.log(`\u2714 Folio Studio running at http://localhost:${PORT}`));
  } catch (e) { console.error('\u2718 Could not start: ' + e.message + '\n  Check MySQL is running and DB_USER / DB_PASSWORD are correct.'); process.exit(1); }
})();
