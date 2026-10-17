// Folio Studio front end (jQuery AJAX): landing + wizard + portfolio viewer
$(function () {
  const { T, NAMES, esc } = FOLIO, KEYS = Object.keys(NAMES);
  const slug = (location.pathname.match(/^\/p\/([^/]+)/) || [])[1];
  const tk = s => localStorage.getItem('folio-token:' + s), hdr = () => (slug && tk(slug)) ? { Authorization: 'Bearer ' + tk(slug) } : {};
  const errs = x => (x.responseJSON || {}).errors || ['Something went wrong. Is the server running?'];
  const J = (url, type, data) => $.ajax({ url, type: type || 'GET', data: data ? JSON.stringify(data) : undefined, contentType: data ? 'application/json' : undefined, headers: hdr() });
  const ghUser = u => (u || '').replace(/\/+$/, '').split('/').pop();
  function toast(m, bad) { const t = $('<div class="toast' + (bad ? ' bad' : '') + '">').text(m).appendTo('#toasts'); setTimeout(() => t.addClass('show'), 10); setTimeout(() => { t.removeClass('show'); setTimeout(() => t.remove(), 400); }, 3200); }
  const modal = (html, cls) => { $('#ov').html(`<div class="${cls || 'mod'}"><button class="x2" data-close>&#10005;</button>${html}</div>`).addClass('open'); };
  const closeM = () => $('#ov').removeClass('open').empty();
  $(document).on('click', '[data-close]', closeM);
  $('#ov').on('mousedown', e => { if (e.target.id === 'ov') closeM(); });
  const tplCards = (cur, pick) => `<div class="tpls ${pick ? 'pick' : ''}">${KEYS.map(k => `<div class="tcard ${k === cur ? 'on' : ''}" data-tpl="${k}"><div class="mini m-${k}"></div>${NAMES[k]}</div>`).join('')}</div>`;

  /* ================= LANDING ================= */
  function landing() {
    $('#app').html(`<div class="land"><header><div>&#10022; <span>Folio</span> Studio</div></header>
    <section class="lhero"><h1>Your portfolio,<br><span>built in minutes.</span></h1><p>Answer a few questions, pick one of 9 designer templates, and get your own live portfolio link. Connect GitHub and LinkedIn. Anyone can make one.</p><button class="cta" id="start">Create my portfolio &rarr;</button></section>
    <section class="lsec"><h2>9 templates to choose from</h2>${tplCards('', false)}</section>
    <section class="lsec"><h2>Recent portfolios</h2><div class="gal" id="gal"><p>Loading...</p></div></section>
    <div class="land"><footer>Made with &#9829; &middot; HTML, CSS, jQuery AJAX, Node.js, Express &amp; MySQL</footer></div></div>`);
    $.getJSON('/api/portfolios').done(r => $('#gal').html(r.map(x => `<a class="gcard2" href="/p/${esc(x.slug)}"><img src="${esc(x.image || FOLIO.av(x.name))}" alt=""><b>${esc(x.name)}</b><span>${esc((x.title || '').split('|')[0])}</span><br><small>${esc(NAMES[x.template] || x.template)}</small></a>`).join('') || '<p>No portfolios yet. Be the first!</p>')).fail(() => $('#gal').html('<p>Cannot reach the server.</p>'));
  }
  $(document).on('click', '#start', () => wizard(blank(), null));

  /* ================= WIZARD (create + edit) ================= */
  let W, STEP = 0, EDIT = null;
  const blank = () => ({ p: { template: 'sketch' }, skills: [{ name: '', level: 80, category: '' }], education: [{}], experience: [{}], projects: [{}], posts: [{}], pin: '', file: null });
  const STEPS = () => ['About you', 'Skills & links', 'Experience & education', 'Projects & posts', EDIT ? 'Template' : 'Template & PIN'];
  const inp = (k, l, ty, req, ph) => `<label>${l}${req ? ' <b>*</b>' : ''}</label><input type="${ty || 'text'}" data-p="${k}" value="${esc(W.p[k])}" placeholder="${esc(ph || '')}">`;
  function rows(key, fields, cls, label) {
    return `<div>${W[key].map((r, i) => `<div class="row-e ${cls || ''}">${fields.map(([f, ph, ty]) => ty === 'textarea' ? `<textarea rows="2" data-r="${key}" data-i="${i}" data-f="${f}" placeholder="${ph}">${esc(r[f])}</textarea>` : `<input type="${ty || 'text'}" ${ty === 'number' ? 'min="0" max="100"' : ''} data-r="${key}" data-i="${i}" data-f="${f}" placeholder="${ph}" value="${esc(r[f])}">`).join('')}<button type="button" class="x" data-del="${key}:${i}">&#10005;</button></div>`).join('')}<button type="button" class="ghost" data-add="${key}">+ Add ${label}</button></div>`;
  }
  function stepHtml() {
    if (STEP === 0) return `<div class="g2"><div>${inp('name', 'Full name', 'text', 1, 'e.g. Tehreem Malik')}</div><div>${inp('title', 'Professional title', 'text', 1, 'Full Stack Developer | UI Designer')}</div></div>${inp('tagline', 'Short tagline', 'text', 0, 'One line that sells you')}
      <label>About me <b>*</b></label><textarea rows="4" data-p="about" placeholder="Write 2-4 sentences about yourself.">${esc(W.p.about)}</textarea>
      <div class="g2"><div>${inp('email', 'Email', 'email', 1, 'you@example.com')}</div><div>${inp('phone', 'Phone', 'text')}</div></div>${inp('location', 'Location', 'text', 0, 'City, Country')}
      <label>Profile photo</label><input type="file" id="imgFile" accept="image/*"><img class="prev" id="prev" src="${esc(W.preview || W.p.image || FOLIO.av(W.p.name))}" alt="">`;
    if (STEP === 1) return `<div class="g2"><div>${inp('github', 'GitHub profile URL', 'url', 0, 'https://github.com/username')}</div><div>${inp('linkedin', 'LinkedIn profile URL', 'url', 0, 'https://linkedin.com/in/username')}</div></div><h3>Skills</h3><p class="hint">Name, level (0-100) and a category such as Frontend.</p>${rows('skills', [['name', 'Skill'], ['level', 'Level', 'number'], ['category', 'Category']], 'sk3', 'skill')}`;
    if (STEP === 2) return `<h3>Experience</h3>${rows('experience', [['role', 'Role'], ['company', 'Company'], ['period', 'Period (2024 - Present)'], ['details', 'What you did', 'textarea']], 'wide', 'experience')}<h3>Education</h3>${rows('education', [['degree', 'Degree / Program'], ['institute', 'Institute'], ['period', 'Period (2023 - 2027)'], ['details', 'Details', 'textarea']], 'wide', 'education')}`;
    if (STEP === 3) return `<h3>Projects</h3><button type="button" class="bt gh sm" id="impGh" style="margin-bottom:10px">&#11015; Import my GitHub repos</button><span class="hint"> uses the GitHub link from step 2</span>${rows('projects', [['title', 'Project title'], ['tech', 'Tech (comma separated)'], ['link', 'Link (https://...)'], ['description', 'Description', 'textarea']], 'wide', 'project')}<h3>Posts &amp; articles</h3><p class="hint">LinkedIn does not let sites pull your whole feed, so paste the link of a post and we fetch its title and text for you.</p><div class="lirow"><input id="liUrl" placeholder="https://www.linkedin.com/posts/..."><button type="button" class="bt gh sm" id="impLi">&#11015; Add LinkedIn post</button></div>${rows('posts', [['title', 'Post title'], ['link', 'Post link (LinkedIn URL)'], ['content', 'Short summary', 'textarea']], 'wide', 'post')}`;
    return `<h3>Choose your template</h3>${tplCards(W.p.template, true)}${EDIT ? '' : `<h3>Edit PIN</h3><p class="hint">You will use this PIN to edit your portfolio later (min 4 characters). Keep it safe.</p><input type="password" data-pin placeholder="e.g. 4821" value="${esc(W.pin)}" style="max-width:260px">`}`;
  }
  function wizard(data, editSlug) {
    W = data; EDIT = editSlug; STEP = 0; W.file = null; W.preview = null; drawWz();
  }
  function drawWz() {
    const last = STEP === 4;
    modal(`<h2>${EDIT ? 'Edit your portfolio' : 'Let\'s build your portfolio'}</h2><div class="dots">${STEPS().map((s, i) => `<i class="${i <= STEP ? 'on' : ''}"></i>`).join('')}</div><p class="hint">Step ${STEP + 1} of 5 &middot; <b>${STEPS()[STEP]}</b></p>${stepHtml()}<ul class="wzerr" id="wzErr"></ul>
      <div class="wzf"><button class="ghost" data-nav="-1">${STEP === 0 ? 'Cancel' : '&larr; Back'}</button><button class="bt" data-nav="1">${last ? (EDIT ? 'Save changes' : 'Create my portfolio &#10024;') : 'Next &rarr;'}</button></div>`, 'wz');
  }
  // live binding
  $(document).on('input change', '[data-p]', function () { W.p[$(this).data('p')] = $(this).val(); });
  $(document).on('input change', '[data-r]', function () { const t = $(this); W[t.data('r')][t.data('i')][t.data('f')] = t.val(); });
  $(document).on('input', '[data-pin]', function () { W.pin = $(this).val(); });
  $(document).on('change', '#imgFile', function () { const f = this.files[0]; if (!f) return; W.file = f; W.preview = URL.createObjectURL(f); $('#prev').attr('src', W.preview); });
  $(document).on('click', '[data-add]', function () { const k = $(this).data('add'); W[k].push(k === 'skills' ? { name: '', level: 80, category: '' } : {}); drawWz(); });
  $(document).on('click', '[data-del]', function () { const [k, i] = $(this).data('del').split(':'); W[k].splice(+i, 1); if (!W[k].length) W[k].push({}); drawWz(); });
  $(document).on('click', '.wz [data-tpl]', function () { W.p.template = $(this).data('tpl'); drawWz(); });
  $(document).on('click', '#impGh', function () {
    const u = ghUser(W.p.github); if (!u) return $('#wzErr').html('<li>Add your GitHub link in step 2 first.</li>');
    $.getJSON('/api/github/' + encodeURIComponent(u)).done(d => {
      const have = new Set(W.projects.map(x => x.link)); W.projects = W.projects.filter(x => x.title || x.description || x.link);
      d.repos.slice(0, 8).forEach(r => { if (!have.has(r.url)) W.projects.push({ title: r.name, description: r.description || 'GitHub repository', tech: r.language || '', link: r.url }); });
      if (!W.projects.length) W.projects.push({}); toast('Imported ' + Math.min(8, d.repos.length) + ' repos'); drawWz();
    }).fail(x => $('#wzErr').html('<li>' + esc(errs(x)[0]) + '</li>'));
  });
  $(document).on('click', '#impLi', function () {
    const u = ($('#liUrl').val() || '').trim(); if (!u) return $('#wzErr').html('<li>Paste a LinkedIn post link first.</li>');
    const b = $(this).prop('disabled', true).text('Fetching...');
    $.getJSON('/api/linkedin/preview', { url: u }).done(r => {
      W.posts = W.posts.filter(x => x.title || x.content || x.link);
      if (!W.posts.some(x => x.link === r.link)) W.posts.push({ title: r.title, content: r.content, link: r.link });
      toast(r.fetched ? 'LinkedIn post added' : 'Added (LinkedIn hid the text, please edit the title)'); drawWz();
    }).fail(x => { b.prop('disabled', false).html('&#11015; Add LinkedIn post'); $('#wzErr').html('<li>' + esc(errs(x)[0]) + '</li>'); });
  });
  $(document).on('click', '[data-nav]', function () {
    const dir = +$(this).data('nav');
    if (dir < 0) { if (STEP === 0) return closeM(); STEP--; return drawWz(); }
    if (STEP === 0) { const e = []; if (!(W.p.name || '').trim()) e.push('Please enter your name'); if (!(W.p.title || '').trim()) e.push('Please enter your professional title'); if (!(W.p.about || '').trim()) e.push('Please write a short about me'); if (!/^\S+@\S+\.\S+$/.test((W.p.email || '').trim())) e.push('Please enter a valid email'); if (e.length) return $('#wzErr').html(e.map(m => `<li>&#9888; ${m}</li>`).join('')); }
    if (STEP < 4) { STEP++; return drawWz(); }
    submit();
  });
  function submit() {
    const fd = new FormData(); if (W.file) fd.append('image', W.file);
    fd.append('data', JSON.stringify({ p: W.p, skills: W.skills, education: W.education, experience: W.experience, projects: W.projects, posts: W.posts })); if (!EDIT) fd.append('pin', W.pin);
    $('[data-nav="1"]').prop('disabled', true).text('Saving...');
    $.ajax({ url: EDIT ? '/api/p/' + EDIT : '/api/portfolios', type: EDIT ? 'PUT' : 'POST', data: fd, processData: false, contentType: false, headers: hdr() })
      .done(r => { if (EDIT) { closeM(); toast('Saved'); view(); } else { localStorage.setItem('folio-token:' + r.slug, r.token); location.href = '/p/' + r.slug; } })
      .fail(x => { drawWz(); STEP = 4; $('#wzErr').html(errs(x).map(m => `<li>&#9888; ${esc(m)}</li>`).join('')); if (x.status === 401) { localStorage.removeItem('folio-token:' + slug); } });
  }

  /* ================= PORTFOLIO VIEWER ================= */
  let D;
  function view() {
    const seen = sessionStorage.getItem('v:' + slug);
    $.getJSON('/api/p/' + encodeURIComponent(slug) + (seen ? '' : '?v=1')).done(d => { sessionStorage.setItem('v:' + slug, 1); D = d; draw(); })
      .fail(() => $('#app').html('<div class="nf">Portfolio not found.<br><a href="/" style="color:#E8845E">Create yours &rarr;</a></div>'));
  }
  function draw() {
    const tpl = T[D.p.template] ? D.p.template : 'sketch'; if (FOLIO.ccCleanup) FOLIO.ccCleanup();
    document.title = D.p.name + ' | Portfolio'; $('body').css('background', '');
    $('#app').html(`<div class="${FOLIO.isCC(tpl) ? 'cc' : 'tpl'} t-${tpl}">${T[tpl](D)}</div>${tk(slug) ? `<div id="obar"><button data-o="edit">&#9998; Edit</button><button data-o="sync">&#128260; Sync</button><button data-o="tpl">&#127912; Template</button><button data-o="inbox">&#128236; Inbox</button><button data-o="share">&#128279; Copy link</button><button data-o="out">Log out</button><button data-o="del" class="danger">&#128465;</button></div>` : `<div id="obar"><button data-o="login">&#128274; Owner login</button><a href="/">&#10024; Make yours</a></div>`}`);
    after();
  }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  function after() {
    $('.rv,.sk').each((i, e) => io.observe(e));
    const tp = T[D.p.template] ? D.p.template : 'sketch'; FOLIO._gh = null; if (FOLIO.isCC(tp)) FOLIO.ccAfter(tp, D, $('#app'));
    $('[data-type]').each(function () { // typing effect
      const el = $(this), list = String(el.data('type')).split('|').map(s => s.trim()).filter(Boolean); if (!list.length) return; let i = 0, j = 0, del = false;
      (function step() { if (!document.contains(el[0])) return; const w = list[i]; j += del ? -1 : 1; el.text(w.slice(0, j) + '|'); let d = del ? 40 : 90; if (!del && j === w.length) { del = true; d = 1500; } else if (del && j === 0) { del = false; i = (i + 1) % list.length; d = 300; } setTimeout(step, d); })();
    });
    const u = ghUser(D.p.github); if (!u) return;
    $.getJSON('/api/github/' + encodeURIComponent(u)).done(g => {
      FOLIO._gh = g; FOLIO.ccRepos();
      $('#ghBox').html(`<div class="gh-top"><img src="${esc(g.user.avatar)}" alt=""><div><b>${esc(g.user.name || g.user.login)}</b><br><span>${esc(g.user.bio || '@' + g.user.login)} &middot; ${g.user.public_repos} repos &middot; ${g.user.followers} followers</span></div><a class="tbtn" target="_blank" rel="noopener" href="${esc(g.user.url)}">Open GitHub &#8599;</a></div>
        <div class="gimg"><img alt="GitHub contributions" src="https://ghchart.rshah.org/${esc(g.user.login)}"></div>
        <div class="grid">${g.repos.map(r => `<a class="gcard rv" target="_blank" rel="noopener" href="${esc(r.url)}"><h3>${esc(r.name)}</h3><p>${esc(r.description || 'No description')}</p><small>${r.language ? esc(r.language) + ' &middot; ' : ''}&#9733; ${r.stars} &middot; &#9095; ${r.forks}</small></a>`).join('')}</div>`);
      $('#github').show(); $('#ghBox .rv').each((i, e) => io.observe(e));
    });
  }
  // contact form
  $(document).on('submit', '.cform', function (e) {
    e.preventDefault(); const f = this, o = Object.fromEntries(new FormData(f));
    J('/api/p/' + slug + '/messages', 'POST', o).done(() => { f.reset(); $(f).find('.cerr').empty(); toast('Message sent. Thank you!'); }).fail(x => $(f).find('.cerr').html(errs(x).map(m => `<li>&#9888; ${esc(m)}</li>`).join('')));
  });
  // owner actions
  $(document).on('click', '[data-o]', function () {
    const a = $(this).data('o');
    if (a === 'login') return modal(`<h2>Owner login</h2><p>Enter the PIN you chose when creating this portfolio.</p><input type="password" id="pinIn" placeholder="PIN" style="margin:10px 0"><ul class="wzerr" id="lerr"></ul><button class="bt" id="doLogin">Unlock editing</button>`);
    if (a === 'out') { localStorage.removeItem('folio-token:' + slug); return draw(); }
    if (a === 'share') return navigator.clipboard.writeText(location.href).then(() => toast('Link copied!'));
    if (a === 'edit') { const c = o => (o || []).map(({ id, portfolio_id, ...r }) => r), p = { ...D.p }; return wizard({ p, skills: c(D.skills), education: c(D.education), experience: c(D.experience), projects: c(D.projects), posts: c(D.posts), pin: '', file: null }, slug); }
    if (a === 'sync') return modal(`<h2>Sync</h2><div class="syn"><h3>GitHub</h3><p class="hint">${D.p.github ? 'Pulls your latest public repos into Projects (repos already added are skipped).' : 'Add your GitHub link first (Edit &rarr; step 2).'}</p><button class="bt sm" id="syncGh" ${D.p.github ? '' : 'disabled'}>&#128260; Sync GitHub repos</button>
      <h3>LinkedIn posts</h3><p class="hint">LinkedIn does not allow sites to read your feed, so paste your post links (one per line). We fetch the title and text of each one and add it to Posts.</p><textarea id="liUrls" rows="4" placeholder="https://www.linkedin.com/posts/...&#10;https://www.linkedin.com/feed/update/urn:li:activity:..."></textarea><button class="bt sm" id="syncLi">&#128260; Sync LinkedIn posts</button><ul class="wzerr" id="synMsg"></ul></div>`);
    if (a === 'tpl') return modal(`<h2>Pick a template</h2><p class="hint">Click one to apply it instantly.</p>${tplCards(D.p.template, true)}`, 'mod');
    if (a === 'del') { if (confirm('Delete this portfolio permanently? This cannot be undone.')) J('/api/p/' + slug, 'DELETE').done(() => { localStorage.removeItem('folio-token:' + slug); location.href = '/'; }).fail(x => toast(errs(x)[0], true)); return; }
    if (a === 'inbox') J('/api/p/' + slug + '/messages').done(m => modal(`<h2>Inbox</h2>${m.map(x => `<div class="inb"><b>${esc(x.name)}</b> <small>${esc(x.email)} &middot; ${new Date(x.created_at).toLocaleString()}</small><p>${esc(x.message)}</p><button class="bt sm" data-dm="${x.id}">Delete</button></div>`).join('') || '<p>No messages yet.</p>'}`)).fail(x => toast(errs(x)[0], true));
  });
  $(document).on('click', '#syncGh', function () {
    const b = $(this).prop('disabled', true).text('Syncing...');
    J('/api/p/' + slug + '/sync/github', 'POST', {}).done(r => { toast(r.added ? 'Added ' + r.added + ' new repo(s) to Projects' : 'Already up to date'); closeM(); view(); }).fail(x => { b.prop('disabled', false).html('&#128260; Sync GitHub repos'); $('#synMsg').html('<li>&#9888; ' + esc(errs(x)[0]) + '</li>'); });
  });
  $(document).on('click', '#syncLi', function () {
    const urls = ($('#liUrls').val() || '').split(/\s+/).map(s => s.trim()).filter(Boolean); if (!urls.length) return $('#synMsg').html('<li>Paste at least one LinkedIn post link.</li>');
    const b = $(this).prop('disabled', true).text('Syncing...');
    J('/api/p/' + slug + '/sync/linkedin', 'POST', { urls }).done(r => { toast('Added ' + r.added + ' post(s)' + (r.skipped ? ', ' + r.skipped + ' skipped' : '')); closeM(); view(); }).fail(x => { b.prop('disabled', false).html('&#128260; Sync LinkedIn posts'); $('#synMsg').html(errs(x).map(m => '<li>&#9888; ' + esc(m) + '</li>').join('')); });
  });
  $(document).on('click', '#doLogin', function () {
    J('/api/p/' + slug + '/login', 'POST', { pin: $('#pinIn').val() }).done(r => { localStorage.setItem('folio-token:' + slug, r.token); closeM(); toast('Editing unlocked'); draw(); }).fail(x => $('#lerr').html('<li>&#9888; ' + esc(errs(x)[0]) + '</li>'));
  });
  $(document).on('click', '[data-dm]', function () { const b = $(this); J('/api/p/' + slug + '/messages/' + b.data('dm'), 'DELETE').done(() => b.closest('.inb').remove()); });
  $(document).on('click', '.mod [data-tpl]', function () {
    const k = $(this).data('tpl'); J('/api/p/' + slug + '/template', 'POST', { template: k }).done(() => { D.p.template = k; closeM(); draw(); toast('Template changed'); }).fail(x => toast(errs(x)[0], true));
  });
  $(document).on('keydown', e => { if (e.key === 'Escape') closeM(); });

  slug ? view() : landing();
});
