(function () {
  const STORAGE_KEY = 'songSearchAdminToken';
  const HASH_PREFIX = '#admin=';
  const CONTAINER_ID = 'adminRefreshControl';
  const STATUS_ID = 'adminRefreshStatus';
  const BUTTON_ID = 'adminRefreshButton';
  const POLL_MS = 5000;

  function readHashToken() {
    const hash = window.location.hash || '';
    if (!hash.startsWith(HASH_PREFIX)) return '';
    return decodeURIComponent(hash.slice(HASH_PREFIX.length)).trim();
  }

  function storeTokenFromHash() {
    const hashToken = readHashToken();
    if (!hashToken) return '';
    if (hashToken === 'clear' || hashToken === 'off') {
      localStorage.removeItem(STORAGE_KEY);
      history.replaceState(null, '', window.location.pathname + window.location.search);
      return '';
    }
    localStorage.setItem(STORAGE_KEY, hashToken);
    history.replaceState(null, '', window.location.pathname + window.location.search);
    return hashToken;
  }

  function getToken() {
    const hashToken = storeTokenFromHash();
    if (hashToken) return hashToken;
    return (localStorage.getItem(STORAGE_KEY) || '').trim();
  }

  function ensureStyle() {
    if (document.getElementById('admin-refresh-control-style')) return;
    const style = document.createElement('style');
    style.id = 'admin-refresh-control-style';
    style.textContent = `
      .admin-refresh-control {
        display: none;
        margin-top: 6px;
        align-items: center;
        gap: 10px;
        color: #97a1ab;
        font-size: 12px;
        line-height: 1.4;
      }
      .admin-refresh-control.visible {
        display: inline-flex;
      }
      .admin-refresh-button {
        padding: 3px 10px;
        border: 1px solid #d7dde3;
        border-radius: 999px;
        background: #fff;
        color: #72808f;
        font-size: 12px;
        cursor: pointer;
      }
      .admin-refresh-button:hover:not(:disabled) {
        border-color: #b7c3ce;
        color: #526170;
      }
      .admin-refresh-button:disabled {
        cursor: not-allowed;
        opacity: 0.65;
      }
      .admin-refresh-status {
        color: #97a1ab;
      }
      .admin-refresh-status.is-running {
        color: #7a8a99;
      }
      .admin-refresh-status.is-error {
        color: #b26a6a;
      }
    `;
    document.head.appendChild(style);
  }

  function getAnchor() {
    return document.getElementById('updateSongsLastRunBadge')
      || document.getElementById('updateSongsLastRunPlaceholder');
  }

  function ensureControl() {
    let container = document.getElementById(CONTAINER_ID);
    if (container) return container;
    const anchor = getAnchor();
    if (!anchor) return null;

    container = document.createElement('div');
    container.id = CONTAINER_ID;
    container.className = 'admin-refresh-control';
    container.innerHTML = `
      <button id="${BUTTON_ID}" class="admin-refresh-button" type="button">刷新歌库</button>
      <span id="${STATUS_ID}" class="admin-refresh-status">管理模式未启用</span>
    `;
    anchor.insertAdjacentElement('afterend', container);
    return container;
  }

  function getHeaders(token) {
    return {
      'X-Admin-Token': token
    };
  }

  function formatTime(dateLike) {
    if (!dateLike) return '';
    const date = new Date(dateLike);
    if (Number.isNaN(date.getTime())) return '';
    const fmt = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour12: false,
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    return fmt.format(date).replace(/\//g, '-');
  }

  function formatDuration(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return '';
    const totalSec = Math.ceil(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    if (min <= 0) return `${sec} 秒`;
    return `${min} 分 ${sec} 秒`;
  }

  let pollTimer = null;
  let pollBusy = false;

  function stopPolling() {
    if (pollTimer) {
      window.clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function setStatus(text, className) {
    const el = document.getElementById(STATUS_ID);
    if (!el) return;
    el.textContent = text;
    el.className = 'admin-refresh-status' + (className ? ` ${className}` : '');
  }

  function setButtonState(disabled, text) {
    const btn = document.getElementById(BUTTON_ID);
    if (!btn) return;
    btn.disabled = disabled;
    btn.textContent = text || '刷新歌库';
  }

  async function loadStatus() {
    const token = getToken();
    const container = ensureControl();
    if (!container || !token || pollBusy) return;
    pollBusy = true;
    try {
      const response = await fetch('/api/admin/refresh-status', {
        cache: 'no-store',
        headers: getHeaders(token)
      });
      if (!response.ok) {
        if (response.status === 403) {
          container.classList.remove('visible');
          stopPolling();
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const status = await response.json();
      container.classList.add('visible');

      if (status.running) {
        setButtonState(true, '刷新中…');
        const started = formatTime(status.lastStartedAtMs);
        setStatus(started ? `任务进行中，开始于 ${started}` : '任务进行中', 'is-running');
        return;
      }

      if (Number(status.retryAfterMs) > 0) {
        setButtonState(true, '冷却中');
        setStatus(`冷却中，约 ${formatDuration(status.retryAfterMs)} 后可再次刷新`);
        return;
      }

      setButtonState(false, '刷新歌库');
      const meta = status.updateSongsMeta || {};
      const timeText = meta.completedAtShanghai || formatTime(status.lastFinishedAtMs);
      if (timeText) {
        setStatus(`管理入口已启用，上次完成于 ${timeText}`);
      } else {
        setStatus('管理入口已启用');
      }
    } catch (error) {
      setButtonState(false, '刷新歌库');
      setStatus(`状态读取失败：${error.message}`, 'is-error');
    } finally {
      pollBusy = false;
    }
  }

  async function triggerRefresh() {
    const token = getToken();
    if (!token) return;
    setButtonState(true, '提交中…');
    try {
      const response = await fetch('/api/admin/refresh', {
        method: 'POST',
        cache: 'no-store',
        headers: getHeaders(token)
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorText = payload.error || `HTTP ${response.status}`;
        setStatus(`刷新未开始：${errorText}`, 'is-error');
        await loadStatus();
        return;
      }
      setStatus('刷新任务已提交');
      await loadStatus();
    } catch (error) {
      setStatus(`刷新失败：${error.message}`, 'is-error');
      setButtonState(false, '刷新歌库');
    }
  }

  function boot() {
    ensureStyle();
    const token = getToken();
    if (!token) return;

    const container = ensureControl();
    if (!container) return;
    container.classList.add('visible');
    document.getElementById(BUTTON_ID).addEventListener('click', triggerRefresh);
    loadStatus();
    stopPolling();
    pollTimer = window.setInterval(loadStatus, POLL_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
