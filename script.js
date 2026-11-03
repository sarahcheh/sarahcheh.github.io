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
})();
