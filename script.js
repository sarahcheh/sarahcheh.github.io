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
  let language = 'en';
  let order = [];
  let scheduled = false;

  function validSettings(value) {
    if (!value || value.version !== 2 || !Array.isArray(value.order)) return false;
    if (value.order.length !== ids.length || new Set(value.order).size !== ids.length ||
        !value.order.every(id => ids.includes(id))) return false;
    const text = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
    if (!['daw', 'middleware', 'engines'].every(key => Array.isArray(value.tools?.[key]) &&
      value.tools[key].length <= 30 && value.tools[key].every(v => text(v, 100)))) return false;
    const month = v => typeof v === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
    return Array.isArray(value.experience) && value.experience.length <= 50 && value.experience.every(item =>
      item && ['ko', 'en'].every(lang => text(item[lang]?.title, 200) && text(item[lang]?.role, 120)) &&
      month(item.start) && (item.end === '' || (month(item.end) && item.end >= item.start)));
  }
  function normalizeSettings(value) {
    if (value?.version === 1) value = { ...structuredClone(defaults), order: value.order };
    if (!validSettings(value)) throw new Error('저장된 사이트 설정을 읽지 못했습니다.');
    return { ...structuredClone(value), about: structuredClone(defaults.about) };
  }
  function formatMonth(value) {
    const [year, month] = value.split('-').map(Number);
    return language === 'ko' ? `${year}년 ${month}월` :
      new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1)));
  }
  function renderProfile() {
    const copy = locales[language];
    ['daw', 'middleware', 'engines'].forEach((key, index) => {
      const target = document.querySelectorAll('.profile-tools dd')[index];
      target.replaceChildren();
      settings.tools[key].forEach((name, i) => {
        if (i) target.append(document.createElement('br'));
        const item = document.createElement('span');
        item.textContent = name;
        if (key === 'middleware' && name.toLowerCase() === 'wwise') {
          item.className = 'wwise-credential';
          const note = document.createElement('span');
          note.className = 'certification-note';
          note.textContent = copy.wwiseNote;
          item.append(document.createTextNode(' '), note);
        }
        target.append(item);
      });
    });
    const target = document.querySelector('.profile-projects');
    const heading = document.createElement('h3');
    heading.textContent = copy.participationLabel;
    target.replaceChildren(heading);
    settings.experience.forEach(item => {
      const row = document.createElement('div');
      row.className = 'education-item';
      const title = document.createElement('h4');
      title.textContent = item[language].title;
      const role = document.createElement('p');
      role.textContent = (language === 'ko' ? '역할: ' : 'Role: ') + item[language].role;
      const date = document.createElement('p');
      date.className = 'education-date';
      date.textContent = formatMonth(item.start) + (item.end === item.start ? '' :
        ' – ' + (item.end ? formatMonth(item.end) : (language === 'ko' ? '현재' : 'Present')));
      row.append(title, role, date);
      target.append(row);
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
    const slogan = document.getElementById('about-title');
    const sloganText = defaults.about[language].heading;
    slogan.textContent = sloganText;
    if (language === 'en' && /^Turning Creative Vision into Player Experience\.$/.test(sloganText.trim())) {
      slogan.replaceChildren();
      for (const [index, phrase] of ['Turning Creative Vision', 'into Player Experience.'].entries()) {
        if (index) slogan.append(document.createTextNode(' '));
        const group = document.createElement('span');
        group.className = 'slogan-phrase';
        group.textContent = phrase;
        slogan.append(group);
      }
    }
    document.querySelector('.about-body > p').textContent = defaults.about[language].body;
    renderProfile();
    document.querySelector('meta[name="description"]').content =
      copy.hero + '. ' + copy.heroSummary;
    setMenuOpen(!menu.hidden);
    scheduleNavigation();
  }

  function setLanguage(lang) {
    if (!locales[lang]) return;
    language = lang;
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
      settings = normalizeSettings(remote); render();
    } catch { /* Embedded defaults keep the page usable offline. */ }
  })();
  window.portfolioSite = Object.freeze({
    ready, validSettings, normalizeSettings,
    getSettings: () => structuredClone(settings),
    getProject: id => locales.ko.projects[id],
    preview(value) {
      if (!validSettings(value)) throw new Error('Invalid portfolio settings');
      settings = normalizeSettings(value);
      render();
    }
  });
})();
