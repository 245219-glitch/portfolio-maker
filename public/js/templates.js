// 5 portfolio templates. Each renders the same data: {p, skills, education, experience, projects, posts}
window.FOLIO = (function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tags = s => String(s || '').split(',').map(x => x.trim()).filter(Boolean);
  const av = n => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#FFD9BF"/><stop offset="1" stop-color="#F29C78"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><text x="200" y="262" font-size="200" text-anchor="middle" fill="#fff" font-family="Georgia">${esc((n || '?').trim()[0] || '?').toUpperCase()}</text></svg>`);
  const nm = p => { const w = (p.name || 'Your Name').trim().split(/\s+/); return { first: w[0], last: w.slice(1).join(' ') }; };
  const photo = p => p.image || av(p.name);
  const avg = d => d.skills.length ? Math.round(d.skills.reduce((a, s) => a + s.level, 0) / d.skills.length) : 0;
  const jr = d => [...d.experience.map(e => ({ a: e.role, b: e.company, t: e.period, x: e.details, k: 'Work' })), ...d.education.map(e => ({ a: e.degree, b: e.institute, t: e.period, x: e.details, k: 'Education' }))];
  const soc = p => [p.github && ['GitHub', p.github], p.linkedin && ['LinkedIn', p.linkedin], p.email && ['Email', 'mailto:' + p.email]].filter(Boolean);
  const lk = (p, c = '') => soc(p).map(([n, u]) => `<a class="${c}" href="${esc(u)}" target="_blank" rel="noopener">${n}</a>`).join('');
  const grp = d => { const g = {}; d.skills.forEach(s => (g[s.category || 'General'] = g[s.category || 'General'] || []).push(s)); return g; };
  const bars = l => l.map(s => `<div class="sk"><div><span>${esc(s.name)}</span><b>${s.level}%</b></div><i><u style="--w:${s.level}%"></u></i></div>`).join('');
  const empty = t => `<p class="none">No ${t} added yet.</p>`;
  const form = () => `<form class="cform"><input name="name" placeholder="Your name"><input name="email" type="email" placeholder="Your email"><textarea name="message" rows="4" placeholder="Tell me about your project"></textarea><ul class="cerr"></ul><button class="tbtn">Send message</button></form>`;
  const ghSlot = `<section id="github" class="gh-sec" style="display:none"><div class="wrap"><h2 class="h2">Live from GitHub</h2><div id="ghBox"></div></div></section>`;
  const cover = (x, i) => `<div class="cov c${i % 4}"><em>${['✦', '◐', '❋', '▲', '●', '◆'][(x.id || i) % 6]}</em></div>`;
  const proj = (d, cls) => d.projects.map((x, i) => `<${x.link ? 'a href="' + esc(x.link) + '" target="_blank" rel="noopener"' : 'div'} class="${cls} rv">${cover(x, i)}<h3>${esc(x.title)}</h3><p>${esc(x.description)}</p><div class="tg">${tags(x.tech).map(t => `<span>${esc(t)}</span>`).join('')}</div></${x.link ? 'a' : 'div'}>`).join('') || empty('projects');
  const posts = (d, cls) => d.posts.map(x => `<${x.link ? 'a href="' + esc(x.link) + '" target="_blank" rel="noopener"' : 'div'} class="${cls} rv"><small>${x.link && /linkedin/i.test(x.link) ? 'LinkedIn post' : 'Article'}</small><h3>${esc(x.title)}</h3><p>${esc(x.content || '')}</p></${x.link ? 'a' : 'div'}>`).join('') || empty('posts');
  const marq = d => d.skills.length ? `<div class="marq"><div>${[1, 2].map(() => d.skills.map(s => `<span>${esc(s.name)}</span>`).join('')).join('')}</div></div>` : '';
  const T = {};

  /* ---------- 1. SKETCH (hand-drawn, warm paper) ---------- */
  T.sketch = d => { const p = d.p, n = nm(p), g = grp(d); return `
<header class="nav"><a class="logo" href="#top">✦ ${esc(n.first)}</a><nav><a href="#about">About</a><a href="#skills">Skills</a><a href="#journey">Journey</a><a href="#work">Work</a><a href="#contact">Contact</a></nav></header>
<section class="hero" id="top"><span class="fl f1">✦</span><span class="fl f2">✿</span><span class="fl f3">★</span>
 <div class="ht"><span class="hand">hey there, I'm</span><h1><mark>${esc(n.first)}</mark> ${esc(n.last)}</h1><p class="role" data-type="${esc(p.title)}"></p><p class="lead">${esc(p.tagline || '')}</p>
 <div class="btns"><a class="tbtn" href="#work">see my work ✦</a><a class="tbtn alt" href="#contact">say hello</a></div><div class="soc">${lk(p)}</div></div>
 <div class="hi"><div class="blob"><img src="${esc(photo(p))}" alt=""></div><span class="sticker">open to work ✌</span></div></section>
${marq(d)}
<section id="about" class="sec"><div class="wrap"><h2 class="h2"><span>about me</span></h2><div class="note rv"><i class="tape"></i><p>${esc(p.about)}</p><div class="nums"><div><b>${d.projects.length}</b>projects</div><div><b>${d.skills.length}</b>skills</div><div><b>${avg(d)}%</b>avg level</div>${p.location ? `<div><b>📍</b>${esc(p.location)}</div>` : ''}</div></div></div></section>
<section id="skills" class="sec"><div class="wrap"><h2 class="h2"><span>skills</span></h2><div class="grid">${Object.keys(g).map(c => `<div class="paper rv"><h3>${esc(c)}</h3>${bars(g[c])}</div>`).join('') || empty('skills')}</div></div></section>
<section id="journey" class="sec"><div class="wrap"><h2 class="h2"><span>my journey</span></h2><div class="tline">${jr(d).map(x => `<div class="ti rv"><small>${esc(x.t)} · ${x.k}</small><h3>${esc(x.a)}</h3><em>${esc(x.b)}</em><p>${esc(x.x || '')}</p></div>`).join('') || empty('experience')}</div></div></section>
<section id="work" class="sec"><div class="wrap"><h2 class="h2"><span>things I've made</span></h2><div class="grid">${proj(d, 'pol')}</div></div></section>
${ghSlot}
<section class="sec"><div class="wrap"><h2 class="h2"><span>words &amp; posts</span></h2><div class="grid">${posts(d, 'pst')}</div></div></section>
<section id="contact" class="sec"><div class="wrap two"><div><h2 class="h2"><span>let's talk</span></h2><p class="lead">${esc(p.email)}${p.phone ? '<br>' + esc(p.phone) : ''}${p.location ? '<br>' + esc(p.location) : ''}</p><div class="soc">${lk(p)}</div></div>${form()}</div></section>
<footer>made with ♥ by ${esc(p.name)}</footer>`; };

  /* ---------- 2. MINIMAL (outline name, black & white) ---------- */
  T.minimal = d => { const p = d.p, n = nm(p); return `
<header class="nav"><span class="avail"><i></i>Available for New Project</span><nav><a href="#work">Work <sup>[${d.projects.length}]</sup></a><a href="#skills">Skills <sup>[${d.skills.length}]</sup></a><a href="#journey">Experience <sup>[${jr(d).length}]</sup></a><a href="#contact">Contact</a></nav><a class="tbtn dark" href="#contact">Let's Talk ↗</a></header>
<section class="hero" id="top"><h1><span class="out">${esc(n.first)}</span> <b>${esc(n.last)}</b></h1><img class="me" src="${esc(photo(p))}" alt="">
 <div class="hl"><h3>${esc((p.title || '').split('|')[0])}</h3><p>${esc(p.tagline || '')}</p><a class="tbtn dark" href="#contact">Let's collaborate ↗</a></div>
 <div class="hr">${lk(p, 'pill')}</div></section>
<section id="about" class="sec"><div class="wrap two"><h2 class="h2">About</h2><p class="big">${esc(p.about)}</p></div></section>
<section id="work" class="sec"><div class="wrap"><h2 class="h2">Selected Work <sup>${d.projects.length}</sup></h2><div class="grid">${proj(d, 'wk')}</div></div></section>
<section id="skills" class="sec"><div class="wrap"><h2 class="h2">Skills <sup>${d.skills.length}</sup></h2><div class="pills">${d.skills.map(s => `<span class="rv">${esc(s.name)} <sup>${s.level}</sup></span>`).join('') || empty('skills')}</div></div></section>
<section id="journey" class="sec"><div class="wrap"><h2 class="h2">Experience <sup>${jr(d).length}</sup></h2>${jr(d).map(x => `<div class="row rv"><div><h3>${esc(x.a)}</h3><small>${esc(x.t)}</small></div><p>${esc(x.b)}${x.x ? ' — ' + esc(x.x) : ''}</p><span class="tagp">${x.k}</span></div>`).join('') || empty('experience')}</div></section>
${ghSlot}
<section class="sec"><div class="wrap"><h2 class="h2">Writing</h2><div class="grid">${posts(d, 'pst')}</div></div></section>
<section id="contact" class="sec"><div class="wrap two"><div><h2 class="h2 huge">Let's work together.</h2><a class="mail" href="mailto:${esc(p.email)}">${esc(p.email)}</a></div>${form()}</div></section>
<footer>© ${new Date().getFullYear()} ${esc(p.name)}</footer>`; };

  /* ---------- 3. EDITORIAL (big "Hello", light grey) ---------- */
  T.editorial = d => { const p = d.p, n = nm(p); return `
<header class="nav"><a class="logo" href="#top">◆</a><nav><a href="#about">About Me</a><a href="#work">Portfolio</a><a href="#journey">Journey</a><a href="#blog">Blog</a></nav><a class="call" href="#contact">Book A Call ↗</a></header>
<section class="hero" id="top"><div class="vt">${esc((p.title || '').split('|')[0])}</div>
 <div class="hl"><div class="st"><div><b>+${d.projects.length}</b>Projects completed</div><div><b>+${d.skills.length}</b>Skills mastered</div></div><h1>Hello</h1><p>— It's ${esc(p.name)}, ${esc((p.title || '').split('|')[0])}</p><a class="scr" href="#about">Scroll down ↓</a></div>
 <img class="me" src="${esc(photo(p))}" alt=""></section>
<section id="about" class="sec"><div class="wrap ab"><div><h2 class="h2">About Me</h2><p class="muted">${esc(p.tagline || '')}</p></div><div class="cardw"><span class="ico">◎</span><b class="pct">${avg(d)}%</b><p>Average skill level across ${d.skills.length} skills</p><img src="${esc(photo(p))}" alt=""></div>
 <ul class="plus">${String(p.about).split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 4).map(s => `<li><i>+</i>${esc(s)}</li>`).join('')}</ul></div></section>
<section id="work" class="sec"><div class="wrap"><span class="eyebrow">● Portfolio</span><h2 class="h2">Latest Works</h2></div><div class="hscroll">${proj(d, 'wk')}</div></section>
<section id="journey" class="sec"><div class="wrap"><span class="eyebrow">● Experiences</span><h2 class="h2">Explore My Journey</h2>${jr(d).map(x => `<div class="row rv"><div><h3>${esc(x.a)}, ${esc(x.b)}</h3><small>· ${esc(x.t)}</small></div><p>${esc(x.x || '')}</p><span class="tagp">${x.k}</span></div>`).join('') || empty('experience')}</div></section>
<section class="sec"><div class="wrap"><div class="banner"><small>(Book your free consultation now)</small><h2>Got a vision? Let's bring it to life!</h2><a class="tbtn light" href="#contact">Let's talk ↗</a></div></div></section>
<section id="skills" class="sec"><div class="wrap"><span class="eyebrow">● Skills</span><h2 class="h2">Toolbox</h2><div class="pills">${d.skills.map(s => `<span class="rv">${esc(s.name)} <sup>${s.level}%</sup></span>`).join('') || empty('skills')}</div></div></section>
${ghSlot}
<section id="blog" class="sec"><div class="wrap"><span class="eyebrow">● Blogs</span><h2 class="h2">Insights &amp; Trends</h2><div class="grid">${posts(d, 'pst')}</div></div></section>
<section id="contact" class="sec"><div class="wrap two"><div><h2 class="h2">Got a Vision? Let's Bring It to Life!</h2><p class="muted">${esc(p.location || '')}</p><div class="soc">${lk(p, 'pill')}</div></div>${form()}</div></section>
<footer><nav><a href="#about">About Me</a><a href="#work">Portfolio</a><a href="#journey">Journey</a></nav><a class="mail" href="mailto:${esc(p.email)}">${esc(p.email)}</a></footer>`; };

  /* ---------- 4. GRADIENT (purple / orange glass) ---------- */
  T.gradient = d => { const p = d.p, n = nm(p), g = grp(d), t = (p.title || '').split('|')[0].trim().split(' '); return `
<div class="frame"><header class="nav"><i class="lg">${esc(n.first.toLowerCase())}</i><nav><a href="#top">Home</a><a href="#about">About</a><a href="#work">Portfolio</a><a href="#journey">Journey</a></nav><a class="tbtn grad" href="#contact">Let's Collaborate ↗</a></header>
<section class="hero" id="top"><img class="me" src="${esc(photo(p))}" alt=""><div class="ht"><span class="it">I Am ${esc(p.name)}</span><h1>${esc(t.slice(0, -1).join(' ') || t[0])}</h1><h1 class="arr"><s>→</s>${esc(t.length > 1 ? t[t.length - 1] : '')}</h1></div>${marq(d)}</section></div>
<section id="about" class="sec"><div class="wrap"><span class="chip">About</span><h2 class="lede"><b>${esc(p.tagline || p.title)}</b> ${esc(p.about.slice(0, 140))}</h2>
 <div class="cards3"><div class="gc one rv"><b>${d.projects.length}</b>projects built</div><div class="gc two rv"><b>${avg(d)}%</b>average skill level</div><div class="gc three rv"><b>${jr(d).length}</b>experience &amp; education entries</div></div></div></section>
<div class="frame dark"><section id="work" class="sec"><div class="wrap"><h2 class="mega">PORTFOLIO</h2>${d.projects.map((x, i) => `<${x.link ? 'a href="' + esc(x.link) + '" target="_blank" rel="noopener"' : 'div'} class="pj rv"><div><h3>${esc(x.title.split(' ').slice(0, -1).join(' '))} <i>${esc(x.title.split(' ').slice(-1)[0])}</i></h3><p>${esc(x.description)}</p><div class="tg">${tags(x.tech).map(t => `<span>${esc(t)}</span>`).join('')}</div></div>${cover(x, i)}</${x.link ? 'a' : 'div'}>`).join('') || empty('projects')}</div></section></div>
<section id="skills" class="sec"><div class="wrap"><span class="chip">Skills</span><div class="grid">${Object.keys(g).map(c => `<div class="gc plain rv"><h3>${esc(c)}</h3>${bars(g[c])}</div>`).join('') || empty('skills')}</div></div></section>
<div class="frame dark"><section id="journey" class="sec"><div class="wrap"><span class="chip">Journey</span><h2 class="lede">${esc(p.name)}'s <b>experience &amp; education</b></h2><div class="faq">${jr(d).map((x, i) => `<details class="rv" ${i === 0 ? 'open' : ''}><summary>${esc(x.a)} · ${esc(x.b)}<em>+</em></summary><p>${esc(x.t)} · ${x.k}<br>${esc(x.x || '')}</p></details>`).join('') || empty('experience')}</div></div></section></div>
${ghSlot}
<section class="sec"><div class="wrap"><span class="chip">Posts</span><div class="grid">${posts(d, 'pst')}</div></div></section>
<section id="contact" class="sec"><div class="wrap two"><div><span class="chip">Contact</span><h2 class="lede"><b>Book a call</b> or send a message.</h2><p>${esc(p.email)}</p><div class="soc">${lk(p, 'pill')}</div></div>${form()}</div></section>
<footer><span class="giant">${esc(p.name)}</span></footer>`; };

  /* ---------- 5. NOIR (dark + red) ---------- */
  T.noir = d => { const p = d.p, n = nm(p); return `
<header class="nav"><b class="lg">${esc(n.first.toUpperCase())}</b><nav><a href="#top">Home</a><a href="#about">About Me</a><a href="#work">Work</a><a href="#journey">Process</a><a href="#contact">Contact</a></nav><a class="tbtn red" href="#contact">Get in touch</a></header>
<section class="hero" id="top"><img class="me" src="${esc(photo(p))}" alt=""><h1>${esc(n.first)}<br>${esc(n.last)}<i>.</i></h1><div class="soc">${lk(p, 'pill')}</div></section>
${marq(d)}
<section id="about" class="sec"><div class="wrap two"><div><small class="eb">About me</small><h2 class="h2">Designing with purpose, creating with impact<i>.</i></h2></div><div><h3 class="mb">MY BIO</h3><p>${esc(p.about)}</p>${bars(d.skills.slice(0, 6))}</div></div></section>
<section id="work" class="sec"><div class="wrap"><small class="eb">Featured work</small><h2 class="h2">Inside the process behind my best work<i>.</i></h2><div class="grid">${proj(d, 'wk')}</div></div></section>
<section id="journey" class="sec"><div class="wrap"><small class="eb">Working process</small><h2 class="h2">Turning ideas into meaningful experiences<i>.</i></h2><div class="steps">${jr(d).map((x, i) => `<div class="step rv"><b>${String(i + 1).padStart(2, '0')}</b><h3>${esc(x.a)}</h3><em>${esc(x.b)} · ${esc(x.t)}</em><p>${esc(x.x || '')}</p></div>`).join('') || empty('experience')}</div></div></section>
${ghSlot}
<section class="sec"><div class="wrap"><small class="eb">Posts &amp; recognition</small><h2 class="h2">Words that celebrate my work<i>.</i></h2><div class="grid">${posts(d, 'pst')}</div></div></section>
<section id="contact" class="sec"><div class="wrap narrow"><small class="eb">Let's work together</small><h2 class="h2">Let's create something worth remembering<i>.</i></h2>${form()}</div></section>
<footer><span class="giant">${esc(n.first.toUpperCase())}<i>.</i></span><div class="soc">${lk(p, 'pill')}</div></footer>`; };

  const NAMES = { sketch: 'Sketchbook', minimal: 'Minimal Outline', editorial: 'Editorial Hello', gradient: 'Aurora Gradient', noir: 'Noir Red' };
  return { T, NAMES, esc, av, tags };
})();
