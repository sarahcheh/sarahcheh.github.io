(() => {
  'use strict';
  const config = window.PORTFOLIO || {};
  const name = String(config.name || '이름');
  document.querySelectorAll('[data-name]').forEach(el => { el.textContent = name; });
  document.title = `${name} — 게임 사운드 디자이너`;
  document.getElementById('year').textContent = new Date().getFullYear();
  const safeUrl = value => {
    try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? u : null; }
    catch { return null; }
  };
  if (typeof config.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email)) {
    const email = document.getElementById('email-link');
    email.textContent = config.email;
    email.href = `mailto:${encodeURIComponent(config.email)}`;
    email.hidden = false;
    document.getElementById('contact-placeholder').hidden = true;
  }
  const profile = safeUrl(config.profileUrl);
  if (profile) { const el = document.getElementById('profile-link'); el.href = profile.href; el.hidden = false; }
  function mountVideo(slot, raw) {
    const url = safeUrl(raw);
    if (!url) return;
    const title = slot.dataset.title;
    let embed = null;
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (['youtube.com', 'm.youtube.com', 'youtu.be'].includes(host)) {
      const id = host === 'youtu.be' ? url.pathname.slice(1).split('/')[0] : url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
      if (/^[\w-]{11}$/.test(id || '')) embed = `https://www.youtube-nocookie.com/embed/${id}`;
    } else if (['vimeo.com', 'player.vimeo.com'].includes(host)) {
      const match = url.pathname.match(/\/(?:video\/)?(\d+)(?:\/([\w]+))?/);
      if (match) {
        const hash = url.searchParams.get('h') || match[2];
        embed = `https://player.vimeo.com/video/${match[1]}${hash ? `?h=${encodeURIComponent(hash)}` : ''}`;
      }
    }
    let player;
    if (embed) {
      player = document.createElement('iframe');
      player.src = embed;
      player.title = `${title} 영상`;
      player.allow = 'fullscreen; picture-in-picture; encrypted-media';
      player.allowFullscreen = true;
      player.loading = 'lazy';
      player.referrerPolicy = 'strict-origin-when-cross-origin';
    } else if (/\.(mp4|webm)$/i.test(url.pathname)) {
      player = document.createElement('video');
      player.src = url.href;
      player.controls = true;
      player.preload = 'metadata';
      player.playsInline = true;
      player.setAttribute('aria-label', `${title} 영상`);
    } else {
      // Keep the inline placeholder for unsupported links; never open a new window.
      return;
    }
    player.className = 'video-player';
    slot.replaceChildren(player);
  }
  document.querySelectorAll('.inline-media[data-project]').forEach(slot => {
    const id = slot.dataset.project;
    mountVideo(slot, config.projects?.[id]?.videoUrl);
  });
  const projectGrid = document.querySelector('.project-grid');
  const dock = document.getElementById('sticky-projects');
  const toggle = document.getElementById('project-menu-toggle');
  const menu = document.getElementById('project-menu');
  const current = document.getElementById('project-menu-current');
  const action = document.getElementById('project-menu-action');
  const projects = [...document.querySelectorAll('article.project[id]')];
  function setMenuOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '작품 목록 접기' : '작품 목록 펼치기');
    action.textContent = open ? '접기' : '펼치기';
    menu.hidden = !open;
  }
  projects.forEach(project => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${project.id}`;
    const index = document.createElement('span'); index.className = 'toc-index'; index.textContent = project.querySelector('.project-index').textContent;
    const text = document.createElement('span'); text.textContent = project.querySelector('.project-title').textContent;
    const scope = document.createElement('small'); scope.textContent = project.querySelector(':scope > p:not(.eyebrow)').textContent;
    text.append(scope); link.append(index, text); item.append(link); menu.querySelector('ol').append(item);
    link.addEventListener('click', () => { setMenuOpen(false); project.focus({preventScroll:true}); });
  });
  toggle.addEventListener('click', () => setMenuOpen(menu.hidden));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !menu.hidden) { setMenuOpen(false); toggle.focus({preventScroll:true}); }
  });
  document.addEventListener('click', event => {
    if (!menu.hidden && !dock.contains(event.target)) setMenuOpen(false);
  });
  let scheduled = false;
  function updateNavigation() {
    scheduled = false;
    const visible = projectGrid.getBoundingClientRect().top <= 78;
    dock.hidden = !visible;
    if (!visible) setMenuOpen(false);
    let active = projects[0];
    for (const project of projects) {
      if (project.getBoundingClientRect().top <= 130) active = project;
    }
    current.textContent = `${active.querySelector('.project-title').textContent} · ${active.querySelector(':scope > p:not(.eyebrow)').textContent}`;
    menu.querySelectorAll('a').forEach(link => {
      if (link.hash === `#${active.id}`) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }
  function scheduleNavigation() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateNavigation); }
  }
  window.addEventListener('scroll', scheduleNavigation, {passive:true});
  window.addEventListener('resize', scheduleNavigation);
  window.addEventListener('pageshow', scheduleNavigation);
  updateNavigation();
})();
