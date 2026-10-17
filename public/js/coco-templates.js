// 4 extra templates ported from coco-portfolio: Sketch Doors, Aurora Glow, Editorial Bold, Minimal Sidebar.
// They plug into the same {p, skills, education, experience, projects, posts} data as the original Folio templates.
(function ($) {
  const F = window.FOLIO, esc = F.esc;
  const initials = n => (n || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const hue = s => { let h = 0; for (const c of s || 'x') h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
  const ph = n => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#8b7cf6"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Georgia" font-size="150" fill="#fff">${initials(n)}</text></svg>`);

  // Folio data -> coco-style data
  const adapt = d => ({ profile: Object.assign({}, d.p), skills: d.skills, education: d.education, experience: d.experience, projects: d.projects, posts: d.posts || [] });

  const U = {
    avatar: p => p.image || ph(p.name),
    socials: p => (p.github ? `<a href="${esc(p.github)}" target="_blank" rel="noopener">GitHub</a>` : '') + (p.linkedin ? `<a href="${esc(p.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>` : '') + (p.email ? `<a href="mailto:${esc(p.email)}">Email</a>` : ''),
    rows(p) {
      const r = [];
      if (p.email) r.push(['Email', `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>`]);
      if (p.phone) r.push(['Phone', esc(p.phone)]);
      if (p.location) r.push(['Location', esc(p.location)]);
      if (p.github) r.push(['GitHub', `<a href="${esc(p.github)}" target="_blank" rel="noopener">${esc(p.github.replace(/^https?:\/\//, ''))}</a>`]);
      if (p.linkedin) r.push(['LinkedIn', `<a href="${esc(p.linkedin)}" target="_blank" rel="noopener">${esc(p.linkedin.replace(/^https?:\/\//, ''))}</a>`]);
      return `<ul class="info-list">${r.map(x => `<li><b>${x[0]}</b><span>${x[1]}</span></li>`).join('')}</ul>`;
    },
    skills(D) {
      if (!D.skills.length) return '<div class="empty">No skills added yet.</div>';
      const g = {}; D.skills.forEach(s => (g[s.category || 'General'] = g[s.category || 'General'] || []).push(s));
      return Object.keys(g).map(c => `<div class="skill-cat"><h3>${esc(c)}</h3><div class="skill-grid">${g[c].map(s => `<div class="skill"><div class="skill-top"><span>${esc(s.name)}</span><span>${s.level}%</span></div><div class="bar"><i data-w="${s.level}"></i></div></div>`).join('')}</div></div>`).join('');
    },
    timeline(D, s) {
      const list = D[s], edu = s === 'education';
      if (!list.length) return '<div class="empty">Nothing added yet.</div>';
      return '<div class="timeline">' + list.map(i => `<div class="t-item"><h3>${esc(edu ? i.degree : i.role)}</h3><div class="where">${esc(edu ? i.institute : i.company)}</div>${i.period ? `<span class="when">${esc(i.period)}</span>` : ''}${i.details ? `<p>${esc(i.details)}</p>` : ''}</div>`).join('') + '</div>';
    },
    manual(D) {
      return '<div class="cards">' + D.projects.map(p => {
        const tags = (p.tech || '').split(',').map(t => t.trim()).filter(Boolean).map(t => `<span class="tag">${esc(t)}</span>`).join('');
        return `<article class="card"><div class="card-img">${esc(initials(p.title))}</div><div class="card-body"><h3>${esc(p.title)}</h3><p>${esc(p.description || '')}</p><div class="tags">${tags}</div><div class="card-links">${p.link ? `<a class="btn btn-small" href="${esc(p.link)}" target="_blank" rel="noopener">Open project</a>` : ''}</div></div></article>`;
      }).join('') + '</div>';
    },
    // GitHub repos are filled in by app.js (live from the GitHub API) into #ccRepos
    work(D) {
      return (D.profile.github ? '<div id="ccRepos"></div>' : '') + `<h3 class="sub">Featured projects</h3>` + (D.projects.length ? U.manual(D) : '<div class="empty">No featured projects added yet.</div>');
    },
    posts(D) {
      return D.posts.length ? '<div class="pcards">' + D.posts.map(x => `<${x.link ? 'a href="' + esc(x.link) + '" target="_blank" rel="noopener"' : 'div'} class="pcard"><small>${x.link && /linkedin/i.test(x.link) ? 'LinkedIn post' : 'Article'}</small><h3>${esc(x.title)}</h3><p>${esc(x.content || '')}</p></${x.link ? 'a' : 'div'}>`).join('') + '</div>' : '<div class="empty">No posts added yet.</div>';
    },
    contact(D) {
      return `<div class="contact-grid"><div>${U.rows(D.profile)}</div><form class="cform contact-form"><label>Your name<input name="name"></label><label>Your email<input name="email" type="email"></label><label>Message<textarea name="message" rows="4"></textarea></label><ul class="cerr"></ul><button class="btn btn-primary" type="submit">Send message</button></form></div>`;
    },
  };
  const NOTE = 'Use "Edit" to write about yourself.';

  /* ---------------- repos block (called by app.js after GitHub loads) ---------------- */
  function repos(g) {
    return `<div class="gh-head"><img src="${esc(g.user.avatar)}" alt=""><div><b>${esc(g.user.name || g.user.login)}</b><br><span>${esc(g.user.bio || '@' + g.user.login)} &middot; ${g.user.public_repos} repos &middot; ${g.user.followers} followers</span></div></div>
    <h3 class="sub">From GitHub (${g.repos.length})</h3><div class="repos">${g.repos.map(r => `<a class="repo" href="${esc(r.url)}" target="_blank" rel="noopener"><h4>${esc(r.name)}</h4><p>${esc(r.description || 'No description yet.')}</p><div class="repo-meta">${r.language ? `<span><i class="lang-dot" style="background:hsl(${hue(r.language)} 65% 50%)"></i>${esc(r.language)}</span>` : ''}<span>★ ${r.stars}</span><span>⑂ ${r.forks}</span></div></a>`).join('')}</div>`;
  }

  /* ================= 1. SKETCH DOORS ================= */
  const DOORS = [{ id: 'about', label: 'About' }, { id: 'skills', label: 'Skills' }, { id: 'journey', label: 'Journey' }, { id: 'projects', label: 'Projects' }, { id: 'contact', label: 'Contact' }];
  const inHall = () => sessionStorage.getItem('skIn') === '1';
  const tree = `<svg class="sk-tree" viewBox="0 0 300 420" fill="none" stroke="#5d5a4a" stroke-width="2.4" stroke-linecap="round" filter="url(#rough)"><path d="M140 420 C146 330 138 270 128 220 M168 420 C160 330 168 270 176 215"/><path d="M130 250 C95 220 70 200 40 160 M128 232 C110 200 100 175 96 140 M172 240 C205 205 232 190 262 150 M176 220 C186 190 196 165 200 130 M150 200 C150 160 146 120 150 70"/><path d="M30 150 c-30-10-24-55 8-52 c-6-35 44-48 60-22 c14-30 62-26 66 6 c26-14 62 6 52 38 c32 2 36 44 6 54 c4 30-40 40-58 20 c-14 24-58 22-66-4 c-26 10-62-6-52-28 c-24-2-30-14-16-12z"/></svg>`;
  const plant = `<svg class="sk-plant" viewBox="0 0 120 200" fill="none" stroke="#5d5a4a" stroke-width="2.2" stroke-linecap="round" filter="url(#rough)"><path d="M60 120 C60 80 58 50 60 20 M60 100 C30 90 14 60 18 34 C44 40 58 70 60 100 M60 90 C92 84 108 56 102 30 C76 36 62 62 60 90"/><path d="M30 120 h60 l-8 70 h-44z"/></svg>`;
  let skDoor = null, skData = null;
  function panelBody(id, D) {
    const p = D.profile;
    if (id === 'about') return `<div class="sk-about"><img src="${U.avatar(p)}" alt="${esc(p.name)}"><div><h3>${esc(p.name)}</h3><p class="sk-role">${esc(p.title)}</p><p>${esc(p.about || NOTE)}</p>${p.tagline ? `<p class="sk-quote">“${esc(p.tagline)}”</p>` : ''}</div></div>${U.rows(p)}<div class="sk-links">${U.socials(p)}</div>`;
    if (id === 'skills') return U.skills(D);
    if (id === 'journey') return `<h3 class="sub">Education</h3>${U.timeline(D, 'education')}<h3 class="sub">Experience</h3>${U.timeline(D, 'experience')}`;
    if (id === 'projects') return U.work(D) + `<h3 class="sub">Posts &amp; articles</h3>` + U.posts(D);
    return U.contact(D);
  }
  function openPanel(id) {
    const d = DOORS.find(x => x.id === id); skDoor = id;
    $('#skPanel .sk-title').text(d.label); $('#skPanel .sk-body').html(panelBody(id, skData)).scrollTop(0);
    $('.sk-door').removeClass('open').filter(`[data-door=${id}]`).addClass('open');
    $('#skShade,#skPanel').removeClass('hidden'); bars(); if (id === 'projects') F.ccRepos();
  }
  function closePanel() { skDoor = null; $('#skShade,#skPanel').addClass('hidden'); $('.sk-door').removeClass('open'); }

  const R = {}, A = {};
  R.cdoors = D => {
    skData = D; const p = D.profile, stick = (D.skills.slice(0, 4).map(s => s.name).concat([p.title])).slice(0, 4);
    return `<div class="sk" data-view="${inHall() ? 'hall' : 'gate'}">
      <svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="rough"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5"/></filter></svg>
      <section class="sk-gate"><div class="sk-wall"></div>${tree}<div class="sk-window"><i></i><i></i><i></i><i></i></div><div class="sk-chains"><i></i><i></i></div><div class="sk-sign">${esc(p.name.split(' ')[0])}'s Portfolio</div><div class="sk-tag">${esc(p.title)}</div>
        <button class="sk-gdoor" aria-label="Open the door and enter"><span class="l"></span><span class="r"></span>${stick.map((t, i) => `<em class="st st${i}">${esc(t)}</em>`).join('')}</button>
        <div class="sk-hint"><b>Explorer</b><span>Click the door to walk in.</span></div></section>
      <section class="sk-hall"><div class="sk-back"></div><div class="sk-light"></div><div class="sk-floor"></div><div class="sk-frame"><img src="${U.avatar(p)}" alt=""><span>${esc(p.name)}</span></div>${plant}
        <div class="sk-doors">${DOORS.map(d => `<button class="sk-door" data-door="${d.id}" aria-label="Open ${d.label}"><span class="sk-plank">${d.label}</span><span class="sk-dframe"><span class="sk-in"></span><span class="sk-leaf"><i></i><i></i><b></b></span></span></button>`).join('')}</div>
        <div class="sk-hint"><b>Corridor</b><span>Click a door to open it.</span></div></section>
      <button class="sk-btn sk-home" aria-label="Back to the entrance">←</button><div id="skShade" class="sk-shade hidden"></div>
      <div id="skPanel" class="sk-paper hidden" role="dialog"><button class="sk-x" aria-label="Close">✕</button><h2 class="sk-title"></h2><div class="sk-body"></div></div></div>`;
  };
  A.cdoors = ($s) => {
    $s.off('.sk')
      .on('click.sk', '.sk-gdoor', function () { $(this).addClass('open'); setTimeout(() => { sessionStorage.setItem('skIn', '1'); $('.sk').attr('data-view', 'hall'); $(this).removeClass('open'); }, 750); })
      .on('click.sk', '.sk-door', function () { const id = $(this).data('door'); $('.sk-door').removeClass('open'); $(this).addClass('open'); setTimeout(() => openPanel(id), 600); })
      .on('click.sk', '.sk-x, #skShade', closePanel)
      .on('click.sk', '.sk-home', () => { if (skDoor) return closePanel(); sessionStorage.removeItem('skIn'); $('.sk').attr('data-view', 'gate'); });
    $(document).off('keydown.sk').on('keydown.sk', e => { if (e.key === 'Escape') closePanel(); });
    skDoor = null;
  };

  /* ================= 2. AURORA GLOW ================= */
  let typer;
  const auSec = (id, title, body) => `<section id="au-${id}" class="au-sec"><div class="au-wrap"><div class="au-h reveal"><h2>${title}</h2></div><div class="reveal">${body}</div></div></section>`;
  R.caurora = D => {
    const p = D.profile, chips = D.skills.slice(0, 5).map((s, i) => `<span class="au-chip c${i}">${esc(s.name)}</span>`).join('');
    const marq = D.skills.length ? `<div class="au-marq"><div>${[1, 2].map(() => D.skills.map(s => `<span>${esc(s.name)}</span>`).join('')).join('')}</div></div>` : '';
    return `<div class="au"><div class="au-orb o1"></div><div class="au-orb o2"></div><div class="au-orb o3"></div><div class="au-glow"></div>
      <header class="au-nav"><a href="#au-top" class="au-brand">${esc(p.name.split(' ')[0])}<i>.</i></a><nav><a href="#au-about">About</a><a href="#au-skills">Skills</a><a href="#au-journey">Journey</a><a href="#au-projects">Projects</a><a href="#au-posts">Posts</a><a href="#au-contact">Contact</a></nav></header>
      <section id="au-top" class="au-hero"><div class="au-wrap au-hero-grid"><div><p class="au-hi">Hi, I'm</p><h1>${esc(p.name)}</h1><h2 class="au-type"><span id="auTyped"></span><b>|</b></h2><p class="au-lead">${esc(p.tagline || '')}</p>
        <div class="au-cta"><a class="btn au-b1" href="#au-projects">See my work</a><a class="btn au-b2" href="#au-contact">Say hello</a></div><div class="au-soc">${U.socials(p)}</div></div>
        <div class="au-photo"><div class="au-ring"><img src="${U.avatar(p)}" alt="${esc(p.name)}"></div>${chips}</div></div></section>${marq}
      ${auSec('about', 'About me', `<div class="au-about"><p class="glass">${esc(p.about || NOTE)}</p><div class="glass">${U.rows(p)}<div class="au-nums"><span><b data-n="${D.projects.length}">0</b>Projects</span><span><b data-n="${D.skills.length}">0</b>Skills</span><span><b data-n="${D.experience.length}">0</b>Roles</span></div></div></div>`)}
      ${auSec('skills', 'Skills', U.skills(D))}
      ${auSec('journey', 'Journey', `<div class="au-two"><div><h3 class="sub">Education</h3>${U.timeline(D, 'education')}</div><div><h3 class="sub">Experience</h3>${U.timeline(D, 'experience')}</div></div>`)}
      ${auSec('projects', 'Projects', U.work(D))}${auSec('posts', 'Posts', U.posts(D))}${auSec('contact', 'Get in touch', U.contact(D))}
      <footer class="au-foot">© ${new Date().getFullYear()} ${esc(p.name)}</footer></div>`;
  };
  A.caurora = ($s, D) => {
    clearTimeout(typer);
    const words = [D.p.title, 'Problem solver', 'Always learning']; let w = 0, c = 0, del = false;
    (function tick() {
      const el = document.getElementById('auTyped'); if (!el) return;
      const word = words[w]; el.textContent = word.slice(0, c);
      if (!del && c === word.length) { del = true; typer = setTimeout(tick, 1300); return; }
      if (del && c === 0) { del = false; w = (w + 1) % words.length; }
      c += del ? -1 : 1; typer = setTimeout(tick, del ? 35 : 80);
    })();
    $s.find('.au-nums b').each(function () { const e = $(this), to = +e.data('n'); $({ n: 0 }).animate({ n: to }, { duration: 1000, step() { e.text(Math.floor(this.n)); }, complete() { e.text(to); } }); });
    $s.off('.au').on('mousemove.au', function (e) { this.style.setProperty('--mx', e.clientX + 'px'); this.style.setProperty('--my', e.clientY + 'px'); })
      .on('mousemove.au', '.skill,.repo,.card,.glass', function (e) { const r = this.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; this.style.transform = `perspective(700px) rotateX(${-y * 6}deg) rotateY(${x * 8}deg) translateY(-3px)`; })
      .on('mouseleave.au', '.skill,.repo,.card,.glass', function () { this.style.transform = ''; });
  };

  /* ================= 3. EDITORIAL BOLD ================= */
  const edBlk = (id, title, body, cls) => `<section id="ed-${id}" class="ed-sec ${cls || ''}"><div class="ed-in"><header class="ed-h"><h2>${title}</h2></header>${body}</div></section>`;
  R.ceditorial = D => {
    const p = D.profile, ticker = D.skills.length ? D.skills.map(s => s.name) : [p.title], strip = [1, 2, 3].map(() => ticker.map(t => `<span>${esc(t)}</span>`).join('')).join('');
    return `<div class="ed"><nav class="ed-nav"><a href="#ed-top"><b>${esc(p.name)}</b></a><div><a href="#ed-about">About</a><a href="#ed-skills">Skills</a><a href="#ed-journey">Journey</a><a href="#ed-projects">Projects</a><a href="#ed-posts">Posts</a><a href="#ed-contact">Contact</a></div></nav>
      <header id="ed-top" class="ed-hero"><div class="ed-in ed-hero-g"><div><h1>${esc(p.name)}</h1><p class="ed-stick">${esc(p.title)}</p><p class="ed-lead">${esc(p.tagline || '')}</p><div class="ed-soc">${U.socials(p)}</div></div><figure class="ed-fig"><img src="${U.avatar(p)}" alt="${esc(p.name)}"></figure></div></header>
      <div class="ed-strip"><div>${strip}</div></div>
      ${edBlk('about', 'About', `<div class="ed-two"><p class="ed-big">${esc(p.about || NOTE)}</p>${U.rows(p)}</div>`)}
      ${edBlk('skills', 'Skills', U.skills(D), 'ed-alt')}
      ${edBlk('journey', 'Journey', `<h3 class="sub">Education</h3>${U.timeline(D, 'education')}<h3 class="sub">Experience</h3>${U.timeline(D, 'experience')}`)}
      ${edBlk('projects', 'Projects', U.work(D), 'ed-alt')}${edBlk('posts', 'Posts', U.posts(D))}${edBlk('contact', 'Let\'s talk', U.contact(D), 'ed-yel')}
      <footer class="ed-foot">© ${new Date().getFullYear()} ${esc(p.name)}</footer></div>`;
  };

  /* ================= 4. MINIMAL SIDEBAR ================= */
  const mnBlk = (id, title, body) => `<section id="mn-${id}" class="mn-sec"><div class="mn-h"><h2>${title}</h2></div>${body}</section>`;
  R.cminimal = D => {
    const p = D.profile;
    return `<div class="mn"><aside class="mn-side"><img src="${U.avatar(p)}" alt="${esc(p.name)}"><h1>${esc(p.name)}</h1><p class="mn-role">${esc(p.title)}</p>
      <nav><a href="#mn-about" class="on">About</a><a href="#mn-skills">Skills</a><a href="#mn-education">Education</a><a href="#mn-experience">Experience</a><a href="#mn-projects">Projects</a><a href="#mn-posts">Posts</a><a href="#mn-contact">Contact</a></nav><div class="mn-soc">${U.socials(p)}</div></aside>
      <main class="mn-main">${mnBlk('about', 'About', `<p class="mn-about">${esc(p.about || NOTE)}</p>${p.tagline ? `<p class="mn-tag">${esc(p.tagline)}</p>` : ''}`)}
      ${mnBlk('skills', 'Skills', U.skills(D))}${mnBlk('education', 'Education', U.timeline(D, 'education'))}${mnBlk('experience', 'Experience', U.timeline(D, 'experience'))}
      ${mnBlk('projects', 'Projects', U.work(D))}${mnBlk('posts', 'Posts', U.posts(D))}${mnBlk('contact', 'Contact', U.contact(D))}
      <footer>© ${new Date().getFullYear()} ${esc(p.name)}</footer></main></div>`;
  };
  A.cminimal = () => {
    $(window).off('scroll.mn').on('scroll.mn', function () {
      let cur = ''; $('.mn-sec').each(function () { if (this.getBoundingClientRect().top < 160) cur = this.id; });
      if (cur) $('.mn-side nav a').removeClass('on').filter(`[href="#${cur}"]`).addClass('on');
    });
  };

  /* ---------------- shared glue ---------------- */
  function bars() { setTimeout(() => $('.cc .bar i').each(function () { $(this).css('width', $(this).data('w') + '%'); }), 60); }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('show'); io.unobserve(e.target); } }), { threshold: .12 });
  const reveal = () => document.querySelectorAll('.cc .reveal:not(.show)').forEach(el => io.observe(el));

  const CC = { cdoors: 'Sketch Doors', caurora: 'Aurora Glow', ceditorial: 'Editorial Bold', cminimal: 'Minimal Sidebar' };
  Object.keys(CC).forEach(k => { F.T[k] = d => R[k](adapt(d)); F.NAMES[k] = CC[k]; });
  F.isCC = k => !!CC[k];
  F.ccAfter = (k, d, $app) => { bars(); reveal(); if (A[k]) A[k]($app, d); };
  F.ccCleanup = () => { clearTimeout(typer); $(window).off('scroll.mn'); $('#app').off('.sk .au'); $(document).off('keydown.sk'); };
  F.ccRepos = () => { if (F._gh && $('#ccRepos').length) { $('#ccRepos').html(repos(F._gh)); bars(); reveal(); } };
})(jQuery);
