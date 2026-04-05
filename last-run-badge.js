(function () {
  const STYLE_ID = 'last-run-badge-style';
  const BADGE_ID = 'updateSongsLastRunBadge';
  const PLACEHOLDER_ID = 'updateSongsLastRunPlaceholder';

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .last-run-badge {
        margin-top: 6px;
        color: #97a1ab;
        font-size: 12px;
        line-height: 1.4;
        font-weight: 400;
      }
      .last-run-badge a {
        color: inherit;
        text-decoration: none;
      }
    `;
    document.head.appendChild(style);
  }

  function getAnchor() {
    return document.querySelector('#updatedAtText')
      || document.querySelector('.sub-header')
      || document.querySelector('.sub')
      || document.querySelector('.header p')
      || document.querySelector('h1')
      || document.querySelector('h2');
  }

  function ensureBadge() {
    let badge = document.getElementById(BADGE_ID);
    if (badge) return badge;

    badge = document.getElementById(PLACEHOLDER_ID);
    if (badge) {
      badge.id = BADGE_ID;
      badge.classList.add('last-run-badge');
      if (!badge.textContent.trim()) {
        badge.textContent = 'update-songs 上次执行：加载中…';
      }
      return badge;
    }

    const anchor = getAnchor();
    if (!anchor) return null;

    badge = document.createElement('div');
    badge.id = BADGE_ID;
    badge.className = 'last-run-badge';
    badge.textContent = 'update-songs 上次执行：加载中…';
    anchor.insertAdjacentElement('afterend', badge);
    return badge;
  }

  async function loadLastRun() {
    const badge = ensureBadge();
    if (!badge) return;

    try {
      let meta = null;

      try {
        const staticResponse = await fetch('/reports/update-songs-meta.json', { cache: 'no-store' });
        if (staticResponse.ok) {
          meta = await staticResponse.json();
        }
      } catch {}

      if (!meta) {
        const response = await fetch('/api/site-meta', { cache: 'no-store' });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const payload = await response.json();
        meta = payload && payload.updateSongsLastRun;
      }

      if (!meta || !meta.completedAtShanghai) {
        badge.textContent = 'update-songs 上次执行：暂无记录';
        return;
      }

      let text = 'update-songs 上次执行：' + meta.completedAtShanghai;
      if (Number.isFinite(meta.successCount) && Number.isFinite(meta.totalConfigs) && meta.totalConfigs > 0) {
        text += '（' + meta.successCount + '/' + meta.totalConfigs + '）';
      }
      badge.textContent = text;
    } catch {
      badge.textContent = 'update-songs 上次执行：读取失败';
    }
  }

  function boot() {
    ensureStyle();
    loadLastRun();
    window.setTimeout(loadLastRun, 600);
    window.setTimeout(loadLastRun, 1800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
