(() => {
  'use strict';
  const repository = 'sarahcheh/sarahcheh.github.io';
  const endpoint = 'https://api.github.com/repos/' + repository;
  const fileEndpoint = endpoint + '/contents/site-settings.json';
  const site = window.portfolioSite;
  const dialog = document.getElementById('admin-dialog');
  const login = document.getElementById('admin-login');
  const editor = document.getElementById('admin-editor');
  const status = document.getElementById('admin-status');
  const keyInput = document.getElementById('admin-key');
  const fields = document.getElementById('admin-fields');
  const save = document.getElementById('admin-save');
  const list = document.getElementById('admin-order');
  const mark = document.getElementById('studio-mark');
  let accessKey = '';
  let expectedSha = '';
  let sessionTimer = null;
  let busy = false;
  let dragId = '';
  let baseline;
  let draft;

  function tell(message, error = false) {
    status.textContent = message;
    status.classList.toggle('is-error', error);
  }
  function lock(message = '') {
    accessKey = '';
    expectedSha = '';
    clearTimeout(sessionTimer);
    keyInput.value = '';
    login.hidden = false;
    editor.hidden = true;
    if (baseline) site.preview(baseline);
    tell(message);
  }
  function setBusy(value) {
    busy = value;
    fields.disabled = value;
    save.disabled = value;
    document.getElementById('admin-preview').disabled = value;
    document.getElementById('admin-close').disabled = value;
    document.getElementById('admin-logout').disabled = value;
    document.getElementById('admin-authenticate').disabled = value;
  }
  async function github(url, options = {}) {
    const response = await fetch(url, {
      ...options, cache: 'no-store', credentials: 'omit',
      signal: AbortSignal.timeout(20000),
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: 'Bearer ' + accessKey,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(options.body ? { 'Content-Type': 'application/json' } : {})
      }
    });
    if (!response.ok) {
      if (response.status === 409 || response.status === 422)
        throw new Error('SETTINGS_CONFLICT');
      if (response.status === 401 || response.status === 403)
        throw new Error('인증 정보를 확인해 주세요.');
      throw new Error('요청을 완료하지 못했습니다. 연결 상태를 확인해 주세요.');
    }
    return response.json();
  }
  function decodeContent(encoded) {
    return new TextDecoder().decode(Uint8Array.from(atob(encoded.replace(/\s/g, '')), c => c.charCodeAt(0)));
  }
  function encodeContent(text) {
    return btoa(Array.from(new TextEncoder().encode(text), byte => String.fromCharCode(byte)).join(''));
  }
  function move(from, to) {
    if (from === to || to < 0 || to >= draft.order.length) return;
    const [id] = draft.order.splice(from, 1);
    draft.order.splice(to, 0, id);
    renderOrder();
    list.querySelector('[data-id="' + id + '"] button').focus();
  }
  function renderOrder() {
    list.replaceChildren();
    draft.order.forEach((id, index) => {
      const row = document.createElement('li');
      row.dataset.id = id;
      row.draggable = true;
      const label = document.createElement('span');
      const project = site.getProject(id);
      label.textContent = String(index + 1).padStart(2, '0') + '  ' +
        project.title + ' · ' + project.scope;
      const controls = document.createElement('div');
      for (const [text, offset] of [['위로', -1], ['아래로', 1]]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = text;
        button.disabled = index + offset < 0 || index + offset >= draft.order.length;
        button.setAttribute('aria-label', project.title + ' ' + project.scope + ' ' + text);
        button.addEventListener('click', () => move(index, index + offset));
        controls.append(button);
      }
      row.append(label, controls);
      row.addEventListener('dragstart', event => {
        dragId = id;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', id);
      });
      row.addEventListener('dragover', event => {
        if (dragId) event.preventDefault();
      });
      row.addEventListener('drop', event => {
        event.preventDefault();
        if (dragId && draft.order.includes(dragId)) move(draft.order.indexOf(dragId), index);
        dragId = '';
      });
      row.addEventListener('dragend', () => { dragId = ''; });
      list.append(row);
    });
  }
  function readDraft() {
    for (const lang of ['ko', 'en']) {
      for (const key of ['heading', 'body']) {
        draft.about[lang][key] = document.getElementById('about-' + key + '-' + lang).value.trim();
      }
    }
    if (!site.validSettings(draft)) throw new Error('소개글의 빈 칸과 길이를 확인해 주세요.');
    return structuredClone(draft);
  }
  async function openAdmin() {
    if (dialog.open) return;
    await site.ready;
    baseline = site.getSettings();
    draft = structuredClone(baseline);
    lock();
    dialog.showModal();
    keyInput.focus();
  }
  login.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    const key = keyInput.value.trim();
    keyInput.value = '';
    if (!/^github_pat_[A-Za-z0-9_]+$/.test(key)) {
      tell('인증 정보를 확인해 주세요.', true);
      return;
    }
    accessKey = key;
    setBusy(true);
    tell('확인 중입니다.');
    try {
      const user = await github('https://api.github.com/user');
      if (user.login.toLowerCase() !== 'sarahcheh')
        throw new Error('인증 정보를 확인해 주세요.');
      const remote = await github(fileEndpoint + '?ref=main');
      const settings = JSON.parse(decodeContent(remote.content));
      if (!site.validSettings(settings)) throw new Error('저장된 사이트 설정을 읽지 못했습니다.');
      expectedSha = remote.sha;
      baseline = structuredClone(settings);
      draft = structuredClone(settings);
      for (const lang of ['ko', 'en']) for (const key of ['heading', 'body']) {
        document.getElementById('about-' + key + '-' + lang).value = draft.about[lang][key];
      }
      renderOrder();
      login.hidden = true;
      editor.hidden = false;
      tell('인증되었습니다. 순서와 소개글을 수정할 수 있습니다.');
      const expire = () => {
        if (busy) { sessionTimer = setTimeout(expire, 1000); return; }
        lock('인증 시간이 만료되었습니다. 다시 인증해 주세요.');
      };
      sessionTimer = setTimeout(expire, 15 * 60 * 1000);
    } catch (error) {
      accessKey = '';
      tell(error instanceof SyntaxError ? '저장된 설정을 읽지 못했습니다.' : error.message, true);
    } finally { setBusy(false); }
  });
  document.getElementById('admin-preview').addEventListener('click', () => {
    try {
      site.preview(readDraft());
      tell('미리보기를 적용했습니다. 사이트에 저장을 누르면 게시됩니다.');
    } catch (error) { tell(error.message, true); }
  });
  editor.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !accessKey) return;
    let value;
    try { value = readDraft(); }
    catch (error) { tell(error.message, true); return; }
    setBusy(true);
    tell('저장 중입니다.');
    try {
      const latest = await github(fileEndpoint + '?ref=main');
      if (latest.sha !== expectedSha)
        throw new Error('다른 곳에서 설정이 변경됐습니다. 창을 닫고 다시 인증한 뒤 수정해 주세요.');
      const result = await github(fileEndpoint, {
        method: 'PUT',
        body: JSON.stringify({
          message: 'Update portfolio order and introduction',
          branch: 'main', sha: expectedSha,
          content: encodeContent(JSON.stringify(value, null, 2) + '\n')
        })
      });
      expectedSha = result.content.sha;
      baseline = structuredClone(value);
      site.preview(value);
      tell('저장했습니다. 배포가 끝나면 공개 사이트에 반영됩니다.');
    } catch (error) {
      const message = error.message === 'SETTINGS_CONFLICT'
        ? '다른 곳에서 설정이 변경됐습니다. 다시 인증한 뒤 수정해 주세요.' : error.message;
      tell(message, true);
    } finally { setBusy(false); }
  });
  document.getElementById('admin-close').addEventListener('click', () => {
    if (!busy) dialog.close();
  });
  document.getElementById('admin-logout').addEventListener('click', () => {
    if (!busy) lock('로그아웃했습니다.');
  });
  dialog.addEventListener('cancel', event => {
    if (busy) event.preventDefault();
  });
  dialog.addEventListener('close', () => lock());
  window.addEventListener('pagehide', () => lock());

  // The gesture reveals the sign-in form; GitHub enforces write authorization.
  let start = null;
  mark.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    event.preventDefault();
    start = { x: event.clientX, y: event.clientY };
    mark.setPointerCapture(event.pointerId);
  });
  mark.addEventListener('pointerup', event => {
    if (!start) return;
    const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    start = null;
    const label = document.querySelector('.brand [data-copy="brandLabel"]').getBoundingClientRect();
    const insideTarget = event.clientX >= label.right + 8 && event.clientX <= label.right + 56 &&
      Math.abs(event.clientY - (label.top + label.height / 2)) <= 20;
    if (distance >= 55 && insideTarget) {
      event.preventDefault();
      openAdmin();
    }
  });
  mark.addEventListener('pointercancel', () => { start = null; });
  mark.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
  });
})();
