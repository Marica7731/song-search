(function () {
  const STYLE_ID = 'page-directory-widget-style';

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .pd-widget-desktop {
        position: fixed;
        top: 22px;
        right: 16px;
        width: 252px;
        z-index: 2100;
      }
      .pd-widget-card {
        background: rgba(255, 255, 255, 0.97);
        border: 1px solid #d0d7de;
        border-radius: 12px;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
        backdrop-filter: blur(8px);
        padding: 12px;
      }
      .pd-widget-title {
        margin: 0 0 8px;
        font-size: 14px;
        font-weight: 700;
        color: #1f2328;
      }
      .pd-widget-list {
        display: grid;
        gap: 6px;
        max-height: calc(100vh - 120px);
        overflow: auto;
        padding-right: 2px;
      }
      .pd-widget-item {
        width: 100%;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: #ffffff;
        color: #1f2937;
        text-align: left;
        font-size: 12px;
        line-height: 1.45;
        padding: 7px 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .pd-widget-avatar {
        position: relative;
        width: 24px;
        height: 24px;
        flex: 0 0 auto;
        display: inline-grid;
        place-items: center;
        overflow: hidden;
        border-radius: 50%;
        background: var(--pd-widget-avatar-color, #0f766e);
        color: #fff;
        font-size: 10px;
        font-weight: 800;
        line-height: 1;
      }
      .pd-widget-avatar img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
      }
      .pd-widget-label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .pd-widget-index {
        flex: 0 0 auto;
        min-width: 24px;
        color: #64748b;
        font-size: 12px;
        font-weight: 800;
        text-align: left;
      }
      .pd-widget-label-stack {
        min-width: 0;
        display: grid;
        gap: 4px;
        flex: 1 1 auto;
      }
      .pd-widget-primary,
      .pd-widget-secondary {
        min-width: 0;
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        border-radius: 999px;
        padding: 2px 8px;
      }
      .pd-widget-primary {
        background: #eef6ff;
        color: #1d4ed8;
        font-weight: 800;
      }
      .pd-widget-secondary {
        background: #f1f5f9;
        color: #475569;
      }
      .pd-widget-item:hover {
        background: #f8fafc;
        border-color: #94a3b8;
      }
      .pd-widget-item.active {
        border-color: #14b8a6;
        background: #f0fdfa;
        color: #115e59;
        font-weight: 600;
      }
      .pd-widget-mobile-fab {
        position: fixed;
        right: 16px;
        bottom: calc(76px + env(safe-area-inset-bottom));
        min-width: 62px;
        height: 38px;
        border: 1px solid #b8c0cc;
        border-radius: 999px;
        background: rgba(243, 244, 246, 0.98);
        color: #111827;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.14);
        z-index: 3200;
        cursor: pointer;
        display: none;
      }
      .pd-widget-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.36);
        z-index: 3198;
        display: none;
      }
      .pd-widget-mobile-panel {
        position: fixed;
        right: 12px;
        bottom: calc(122px + env(safe-area-inset-bottom));
        width: min(86vw, 320px);
        max-height: min(72vh, 560px);
        display: none;
        z-index: 3199;
      }
      .pd-widget-mobile-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      .pd-widget-mobile-close {
        border: 1px solid #d0d7de;
        border-radius: 8px;
        background: #ffffff;
        color: #334155;
        height: 28px;
        padding: 0 8px;
        cursor: pointer;
        font-size: 12px;
      }
      .pd-widget-open .pd-widget-overlay,
      .pd-widget-open .pd-widget-mobile-panel {
        display: block;
      }
      @media (max-width: 980px) {
        .pd-widget-desktop {
          display: none;
        }
        .pd-widget-mobile-fab {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
      }
      @media (min-width: 981px) {
        .pd-widget-mobile-fab,
        .pd-widget-overlay,
        .pd-widget-mobile-panel {
          display: none !important;
        }
      }
      .pd-widget-mounted .pd-widget-desktop {
        position: sticky;
        top: var(--pd-widget-sticky-top, 12px);
        right: auto;
        width: 100%;
        z-index: 1;
      }
      .pd-widget-mounted .pd-widget-card {
        box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08);
        backdrop-filter: none;
      }
      .pd-widget-mounted .pd-widget-list {
        max-height: calc(100vh - 76px);
      }
      @media (max-width: 1279px) {
        .pd-widget-mounted .pd-widget-desktop {
          display: none !important;
        }
        .pd-widget-mounted .pd-widget-mobile-fab {
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
        }
      }
      @media (min-width: 1280px) {
        .pd-widget-mounted .pd-widget-mobile-fab,
        .pd-widget-mounted .pd-widget-overlay,
        .pd-widget-mounted .pd-widget-mobile-panel {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function safeSlug(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function ensureTargetId(target, seed, used) {
    if (target.id) {
      used.add(target.id);
      return target.id;
    }
    let base = safeSlug(seed) || 'section';
    let id = `pd-${base}`;
    let i = 1;
    while (document.getElementById(id) || used.has(id)) {
      i += 1;
      id = `pd-${base}-${i}`;
    }
    target.id = id;
    used.add(id);
    return id;
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[ch]));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }

  function resolveItems(rawItems) {
    const used = new Set();
    const list = [];
    (Array.isArray(rawItems) ? rawItems : []).forEach((item, index) => {
      const label = String(item?.label || '').trim();
      if (!label) return;
      let target = null;
      if (item?.target instanceof Element) {
        target = item.target;
      }
      if (!target && item?.id) {
        target = document.getElementById(String(item.id).trim());
      }
      if (!target && item?.selector) {
        target = document.querySelector(String(item.selector).trim());
      }
      if (!target) return;
      const targetId = ensureTargetId(target, `${label}-${index + 1}`, used);
      list.push({
        id: targetId,
        label,
        primary: String(item?.primary || '').trim(),
        secondary: String(item?.secondary || '').trim(),
        badge: String(item?.badge || '').trim(),
        avatarUrl: String(item?.avatarUrl || '').trim(),
        avatarText: String(item?.avatarText || '').trim(),
        accentColor: String(item?.accentColor || '').trim(),
        target
      });
    });
    return list;
  }

  function createPageDirectory(options) {
    ensureStyles();
    const settings = options || {};
    const root = document.createElement('div');
    root.className = 'pd-widget';
    root.innerHTML = `
      <aside class="pd-widget-desktop">
        <div class="pd-widget-card">
          <h3 class="pd-widget-title"></h3>
          <div class="pd-widget-list" data-role="desktop-list"></div>
        </div>
      </aside>
      <button type="button" class="pd-widget-mobile-fab" data-role="mobile-open">目录</button>
      <div class="pd-widget-overlay" data-role="overlay"></div>
      <div class="pd-widget-mobile-panel">
        <div class="pd-widget-card">
          <div class="pd-widget-mobile-head">
            <h3 class="pd-widget-title" data-role="mobile-title"></h3>
            <button type="button" class="pd-widget-mobile-close" data-role="mobile-close">关闭</button>
          </div>
          <div class="pd-widget-list" data-role="mobile-list"></div>
        </div>
      </div>
    `;
    const mountTarget = settings.mount
      ? document.querySelector(String(settings.mount))
      : null;
    if (mountTarget) {
      root.classList.add('pd-widget-mounted');
      mountTarget.appendChild(root);
    } else {
      document.body.appendChild(root);
    }

    const title = String(settings.title || '页面目录');
    const activeOffset = Number(settings.activeOffset || 110);
    const desktopTitle = root.querySelector('.pd-widget-title');
    const mobileTitle = root.querySelector('[data-role="mobile-title"]');
    const desktopList = root.querySelector('[data-role="desktop-list"]');
    const mobileList = root.querySelector('[data-role="mobile-list"]');
    const openBtn = root.querySelector('[data-role="mobile-open"]');
    const closeBtn = root.querySelector('[data-role="mobile-close"]');
    const overlay = root.querySelector('[data-role="overlay"]');

    desktopTitle.textContent = title;
    mobileTitle.textContent = title;

    let items = [];
    let activeId = '';
    let ticking = false;

    function closeMobile() {
      root.classList.remove('pd-widget-open');
    }

    function openMobile() {
      root.classList.add('pd-widget-open');
    }

    function setActive(targetId) {
      if (!targetId || targetId === activeId) return;
      activeId = targetId;
      [desktopList, mobileList].forEach(listEl => {
        listEl.querySelectorAll('.pd-widget-item').forEach(button => {
          button.classList.toggle('active', button.getAttribute('data-target') === activeId);
        });
      });
    }

    function scrollToTarget(targetId) {
      const item = items.find(entry => entry.id === targetId);
      if (!item || !item.target) return;
      item.target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActive(targetId);
      closeMobile();
    }

    function renderList(listEl) {
      const renderAvatar = item => {
        const style = item.accentColor ? ` style="--pd-widget-avatar-color:${escapeAttr(item.accentColor)}"` : '';
        if (item.avatarUrl) {
          return `<span class="pd-widget-avatar"${style}><img src="${escapeAttr(item.avatarUrl)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"></span>`;
        }
        if (item.avatarText) {
          return `<span class="pd-widget-avatar"${style}>${escapeHtml(item.avatarText)}</span>`;
        }
        return '';
      };
      const renderLabel = item => {
        if (item.primary || item.secondary) {
          const primary = item.primary || item.label;
          const secondary = item.secondary || '';
          return `<span class="pd-widget-label-stack"><span class="pd-widget-primary">${escapeHtml(primary)}</span>${secondary ? `<span class="pd-widget-secondary">${escapeHtml(secondary)}</span>` : ''}</span>`;
        }
        return `<span class="pd-widget-label">${escapeHtml(item.label)}</span>`;
      };
      const renderBadge = item => item.badge
        ? `<span class="pd-widget-index">${escapeHtml(item.badge)}</span>`
        : '';
      listEl.innerHTML = items.map(item => (
        `<button type="button" class="pd-widget-item" data-target="${escapeAttr(item.id)}">${renderAvatar(item)}${renderBadge(item)}${renderLabel(item)}</button>`
      )).join('');
      listEl.querySelectorAll('.pd-widget-item').forEach(button => {
        button.addEventListener('click', () => {
          scrollToTarget(button.getAttribute('data-target') || '');
        });
      });
    }

    function updateActiveByScroll() {
      if (!items.length) return;
      const visible = items
        .map(item => ({ item, rect: item.target.getBoundingClientRect() }))
        .filter(entry => entry.rect.height > 0);
      if (!visible.length) return;

      let picked = null;
      visible.forEach(entry => {
        if (entry.rect.top <= activeOffset) {
          picked = entry.item;
        }
      });
      if (!picked) {
        picked = visible[0].item;
      }
      setActive(picked.id);
    }

    function requestActiveUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        updateActiveByScroll();
      });
    }

    function refresh(rawItems) {
      items = resolveItems(rawItems);
      root.hidden = items.length === 0;
      renderList(desktopList);
      renderList(mobileList);
      activeId = '';
      updateActiveByScroll();
    }

    openBtn.addEventListener('click', openMobile);
    closeBtn.addEventListener('click', closeMobile);
    overlay.addEventListener('click', closeMobile);
    window.addEventListener('scroll', requestActiveUpdate, { passive: true });
    window.addEventListener('resize', requestActiveUpdate);

    const initialItems = typeof settings.getItems === 'function'
      ? settings.getItems()
      : settings.items;
    refresh(initialItems);

    return {
      setItems(nextItems) {
        refresh(nextItems);
      },
      refresh() {
        const nextItems = typeof settings.getItems === 'function'
          ? settings.getItems()
          : settings.items;
        refresh(nextItems);
      },
      destroy() {
        window.removeEventListener('scroll', requestActiveUpdate);
        window.removeEventListener('resize', requestActiveUpdate);
        root.remove();
      }
    };
  }

  window.createPageDirectory = createPageDirectory;
})();
