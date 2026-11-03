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
  if (safeUrl(config.showreelUrl)) {
    document.querySelector('[data-reel-label]').textContent = '쇼릴 보기';
  }
  const independent = '원작사와 무관한 개인 리디자인 작업입니다. 게임 및 원본 영상의 권리는 각 권리자에게 있습니다.';
  const projects = {
    showreel: { title: '쇼릴', category: '쇼릴', description: '', type: '포트폴리오 쇼릴', scope: '주요 작업 모음', art: 'showreel', note: '쇼릴 영상은 추후 등록 예정입니다.' },
    reverse: { title: '리버스: 1999', category: '01 / 스킬', description: '', type: '사운드 리디자인', scope: '스킬 10개', art: 'reverse', note: independent },
    elder: { title: '엘더스크롤', category: '02 / 시네마틱', description: '', type: '사운드 리디자인', scope: '시네마틱 영상', art: 'elder', note: independent },
    silk: { title: '할로우 나이트: 실크송', category: '03 / 인게임', description: '', type: '사운드 리디자인', scope: '인게임 영상', art: 'silk', note: independent },
    monsters: { title: '몬스터 사운드 디자인', category: '04 / 몬스터', description: '', type: '사운드 디자인', scope: '소형 · 중형 · 대형 몬스터', art: 'monsters', note: '개인 포트폴리오 작업입니다.' }
  };
  const dialog = document.getElementById('project-dialog');
  const slot = document.getElementById('video-slot');
  let opener = null;
  function mountVideo(raw, project) {
    slot.replaceChildren();
    const url = safeUrl(raw);
    if (!url) {
      const placeholder = document.createElement('div'); placeholder.className = 'video-placeholder';
      const img = document.createElement('img'); img.src = `assets/${project.art}.svg`; img.alt = '';
      const text = document.createElement('div');
      const heading = document.createElement('p'); heading.className = 'placeholder-heading'; heading.textContent = '영상 준비 중';
      text.append(heading); placeholder.append(img, text); slot.append(placeholder); return;
    }
    let embed = null;
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (['youtube.com','m.youtube.com','youtu.be'].includes(host)) {
      const id = host === 'youtu.be' ? url.pathname.slice(1).split('/')[0] : url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
      if (/^[\w-]{11}$/.test(id || '')) embed = `https://www.youtube-nocookie.com/embed/${id}`;
    } else if (['vimeo.com','player.vimeo.com'].includes(host)) {
      const match = url.pathname.match(/\/(?:video\/)?(\d+)(?:\/([\w]+))?/);
      if (match) { const hash = url.searchParams.get('h') || match[2]; embed = `https://player.vimeo.com/video/${match[1]}${hash ? `?h=${encodeURIComponent(hash)}` : ''}`; }
    }
    if (embed) {
      const frame = document.createElement('iframe'); frame.className = 'video-player'; frame.src = embed;
      frame.title = `${project.title} 영상`; frame.allow = 'fullscreen; picture-in-picture; encrypted-media'; frame.allowFullscreen = true; frame.referrerPolicy = 'strict-origin-when-cross-origin'; slot.append(frame);
      const fallback = document.createElement('a'); fallback.href = url.href; fallback.target = '_blank'; fallback.rel = 'noopener noreferrer'; fallback.className = 'profile-link'; fallback.textContent = '새 창에서 영상 보기 ↗'; slot.append(fallback);
    } else if (/\.(mp4|webm)$/i.test(url.pathname)) {
      const video = document.createElement('video'); video.className = 'video-player'; video.src = url.href; video.controls = true; video.preload = 'metadata'; video.playsInline = true; video.setAttribute('aria-label', `${project.title} 영상`); slot.append(video);
    } else {
      const link = document.createElement('a'); link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.className = 'external-video'; link.textContent = '영상 보기 ↗'; slot.append(link);
    }
  }
  document.querySelectorAll('[data-project]').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.project; const project = projects[id]; if (!project) return;
      opener = button;
      document.getElementById('dialog-title').textContent = project.title;
      document.getElementById('dialog-category').textContent = project.category;
      document.getElementById('dialog-description').textContent = project.description;
      document.getElementById('dialog-type').textContent = project.type;
      document.getElementById('dialog-scope').textContent = project.scope;
      const raw = id === 'showreel' ? config.showreelUrl : config.projects?.[id]?.videoUrl;
      document.getElementById('dialog-disclaimer').textContent = id === 'showreel' && safeUrl(raw) ? '개인 포트폴리오 작업입니다.' : project.note;
      mountVideo(raw, project); dialog.showModal(); document.body.classList.add('modal-open');
      dialog.querySelector('.close').focus();
    });
  });
  dialog.querySelector('.close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => { slot.replaceChildren(); document.body.classList.remove('modal-open'); opener?.focus(); });
})();
