(() => {
  'use strict';
  const config = window.PORTFOLIO || {};
  const locales = window.PORTFOLIO_LOCALES;
  const defaults = window.PORTFOLIO_DEFAULT_SETTINGS;
  const ids = Object.keys(config.projects);
  const cards = new Map(ids.map(id => [id, document.getElementById('project-' + id)]));
  const grid = document.querySelector('.project-grid');
  const featured = document.querySelector('.featured');
  const dock = document.getElementById('sticky-projects');
  const toggle = document.getElementById('project-menu-toggle');
  const menu = document.getElementById('project-menu');
  let settings = structuredClone(defaults);
  let language = 'ko';
  let order = [];
  let scheduled = false;

  function validSettings(value) {
    if (!value || value.version !== 1 || !Array.isArray(value.order)) return false;
    if (value.order.length !== ids.length || new Set(value.order).size !== ids.length ||
        !value.order.every(id => ids.includes(id))) return false;
    return ['ko', 'en'].every(lang => {
      const about = value.about?.[lang];
      return about && ['heading', 'body'].every(key =>
        typeof about[key] === 'string' && about[key].trim().length > 0 &&
        about[key].length <= 1000);
    });
  }

  function applyOrder() {
    if (order.join() === settings.order.join()) return;
    order = [...settings.order];
    order.forEach((id, index) => {
      const card = cards.get(id);
      card.classList.toggle('featured-project', index === 0);
      const oldHeading = card.querySelector('.project-title');
      const tag = index === 0 ? 'H2' : 'H3';
      if (oldHeading.tagName !== tag) {
        const heading = document.createElement(tag);
        heading.className = oldHeading.className;
        heading.id = oldHeading.id;
        heading.textContent = oldHeading.textContent;
        oldHeading.replaceWith(heading);
      }
      card.querySelector('.project-index').textContent = String(index + 1).padStart(2, '0');
      if (index === 0) featured.append(card);
      else grid.append(card);
    });
    featured.setAttribute('aria-labelledby', 'project-' + order[0] + '-title');
  }

  function setMenuOpen(open) {
    const copy = locales[language];
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? copy.menuClose : copy.menuOpen);
    document.getElementById('project-menu-action').textContent = open ? copy.collapse : copy.expand;
    menu.hidden = !open;
  }

  function render() {
    const copy = locales[language];
    applyOrder();
    document.documentElement.lang = language;
    document.title = copy.name + ' — ' + copy.role;
    document.querySelectorAll('[data-name]').forEach(el => { el.textContent = copy.name; });
    document.querySelectorAll('[data-copy]').forEach(el => {
      el.textContent = copy[el.dataset.copy];
    });
    document.querySelector('.brand').setAttribute('aria-label', copy.home);
    document.querySelector('.header nav').setAttribute('aria-label', copy.nav);
    dock.setAttribute('aria-label', copy.projectList);
    menu.setAttribute('aria-label', copy.projectList);
    document.querySelectorAll('[data-language]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.language === language));
    });
    const ol = menu.querySelector('ol');
    ol.replaceChildren();
    order.forEach(id => {
      const card = cards.get(id);
      const project = copy.projects[id];
      card.querySelector('.project-title').textContent = project.title;
      card.querySelector(':scope > p').textContent = project.scope;
      const summary = card.querySelector('summary');
      summary.firstChild.textContent = copy.details;
      const description = card.querySelector('.project-description');
      description.replaceChildren();
      for (const section of project.sections) {
        if (section.title) {
          const heading = document.createElement('h4');
          heading.textContent = section.title;
          description.append(heading);
        }
        for (const paragraph of section.paragraphs) {
          const element = document.createElement('p');
          element.textContent = paragraph;
          description.append(element);
        }
      }
      const media = card.querySelector('.inline-media');
      media.dataset.title = project.title + ' · ' + project.scope;
      const player = media.querySelector('iframe, video');
      if (player) player.setAttribute('title', media.dataset.title + ' ' + copy.video);
      const placeholder = media.querySelector('.media-placeholder > span');
      if (placeholder) placeholder.textContent = copy.loading;
      const image = media.querySelector('img');
      if (image) image.alt = '';
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = '#' + card.id;
      const index = document.createElement('span');
      index.className = 'toc-index';
      index.textContent = card.querySelector('.project-index').textContent;
      const text = document.createElement('span');
      text.textContent = project.title;
      const small = document.createElement('small');
      small.textContent = project.scope;
      text.append(small);
      link.append(index, text);
      item.append(link);
      ol.append(item);
      link.addEventListener('click', () => {
        setMenuOpen(false);
        card.focus({ preventScroll: true });
      });
    });
    document.getElementById('about-title').textContent = settings.about[language].heading;
    document.querySelector('.about-body > p').textContent = settings.about[language].body;
    document.querySelector('meta[name="description"]').content =
      copy.hero + '. ' + copy.heroSummary;
    setMenuOpen(!menu.hidden);
    scheduleNavigation();
  }

  function setLanguage(lang) {
    if (!locales[lang]) return;
    language = lang;
    try { localStorage.setItem('portfolio-language', lang); } catch {}
    const url = new URL(location.href);
    url.searchParams.set('lang', lang);
    history.replaceState(null, '', url);
    render();
  }

  function updateNavigation() {
    scheduled = false;
    const headerHeight = document.querySelector('.header').getBoundingClientRect().height;
    const visible = grid.getBoundingClientRect().top <= headerHeight + 20;
    dock.hidden = !visible;
    if (!visible) setMenuOpen(false);
    let active = cards.get(order[0]);
    for (const id of order) {
      const card = cards.get(id);
      if (card.getBoundingClientRect().top <= headerHeight + 90) active = card;
    }
    const id = active.id.replace('project-', '');
    const project = locales[language].projects[id];
    document.getElementById('project-menu-current').textContent =
      project.title + ' · ' + project.scope;
    menu.querySelectorAll('a').forEach(link => {
      if (link.hash === '#' + active.id) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  function scheduleNavigation() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(updateNavigation);
  }

  for (const [id, card] of cards) {
    const raw = config.projects[id].videoUrl;
    const match = raw.match(/^https:\/\/youtu\.be\/([\w-]{11})$/);
    if (!match) continue;
    const player = document.createElement('iframe');
    player.src = 'https://www.youtube-nocookie.com/embed/' + match[1];
    player.className = 'video-player';
    player.allow = 'fullscreen; picture-in-picture; encrypted-media';
    player.allowFullscreen = true;
    player.loading = 'lazy';
    player.referrerPolicy = 'strict-origin-when-cross-origin';
    card.querySelector('.inline-media').replaceChildren(player);
  }
  const requestedLanguage = new URL(location.href).searchParams.get('lang');
  if (locales[requestedLanguage]) language = requestedLanguage;
  else {
    try { if (locales[localStorage.getItem('portfolio-language')])
      language = localStorage.getItem('portfolio-language'); } catch {}
  }
  document.getElementById('year').textContent = new Date().getFullYear();
  document.querySelectorAll('[data-language]').forEach(button => {
    button.addEventListener('click', () => setLanguage(button.dataset.language));
  });
  toggle.addEventListener('click', () => setMenuOpen(menu.hidden));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !menu.hidden) {
      setMenuOpen(false);
      toggle.focus({ preventScroll: true });
    }
  });
  document.addEventListener('click', event => {
    if (!menu.hidden && !dock.contains(event.target)) setMenuOpen(false);
  });
  window.addEventListener('scroll', scheduleNavigation, { passive: true });
  window.addEventListener('resize', scheduleNavigation);
  window.addEventListener('pageshow', scheduleNavigation);
  render();
  const ready = (async () => {
    if (!['https:', 'http:'].includes(location.protocol)) return;
    try {
      const response = await fetch('site-settings.json', { cache: 'no-store' });
      const remote = await response.json();
      if (validSettings(remote)) { settings = remote; render(); }
    } catch { /* Embedded defaults keep the page usable offline. */ }
  })();
  window.portfolioSite = Object.freeze({
    ready, validSettings,
    getSettings: () => structuredClone(settings),
    getProject: id => locales.ko.projects[id],
    preview(value) {
      if (!validSettings(value)) throw new Error('Invalid portfolio settings');
      settings = structuredClone(value);
      render();
    }
  });
})();

// Draw five-color pixel cloud shapes, with a quiet bright opening behind the text.
(() => {
  const canvas = document.querySelector('.pixel-background');
  const section = canvas?.parentElement;
  if (!canvas || !section) return;
  const context = canvas.getContext('2d');
  if (!context) return;
  const palette = ['#7963be', '#62509c', '#4d407f', '#3c3265', '#2c264c'];
  const leftContour = [.43, .38, .35, .29, .31, .27, .3, .32, .36, .4, .45];
  const rightContour = [.62, .67, .65, .71, .69, .74, .7, .73, .68, .66, .6];
  const offsets = [0, .075, .17, .29];
  function sample(points, position) {
    const index = Math.min(points.length - 2, Math.floor(position));
    const fraction = position - index;
    return points[index] + (points[index + 1] - points[index]) * fraction;
  }
  function paint() {
    const width = Math.ceil(section.clientWidth / 4);
    const height = Math.ceil(section.clientHeight / 4);
    canvas.width = width;
    canvas.height = height;
    for (let y = 0; y < height; y++) {
      const row = Math.floor(y / 2) * 2;
      const position = row / Math.max(1, height - 1) * 10;
      for (let x = 0; x < width; x++) {
        let color = 4;
        for (let layer = 0; layer < offsets.length; layer++) {
          // Quantized contours make deliberate steps and broad, solid color masses.
          const left = Math.round((sample(leftContour, position) - offsets[layer]) * width / 2) * 2;
          const right = Math.round((sample(rightContour, position) + offsets[layer]) * width / 2) * 2;
          if (x < left || x > right) continue;
          color = layer;
          const edge = Math.min(x - left, right - x);
          const fragment = (Math.floor(x / 2) * 17 + row * 13) % 23;
          // Only a few edge fragments blend into the neighboring color.
          if (edge < 3 && fragment < 6) color = layer + 1;
          break;
        }
        context.fillStyle = palette[color];
        context.fillRect(x, y, 1, 1);
      }
    }
  }
  new ResizeObserver(paint).observe(section);
  paint();
})();
