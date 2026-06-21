(function () {
  const navItems = [
    { key: 'home', href: '/', title: '检索', meta: '搜索' },
    { key: 'stats', href: '/stats', title: '统计', meta: '数据' },
    { key: 'bv', href: '/bv', title: 'BV 查重', meta: '工具' },
    { key: 'dup', href: '/dup', title: '歌名查重', meta: '工具' },
    { key: 'check', href: '/check', title: '命名校验', meta: '工具' },
    { key: 'vocaloid', href: '/vocaloid', title: '术力口', meta: '数据' },
    { key: 'growth', href: '/growth', title: '增长日报', meta: '趋势' }
  ];

  const pageByPath = new Map([
    ['/stats', 'stats'],
    ['/stats.html', 'stats'],
    ['/bv', 'bv'],
    ['/bv-dup-check.html', 'bv'],
    ['/dup', 'dup'],
    ['/title-artist-dup-check.html', 'dup'],
    ['/check', 'check'],
    ['/title-artist-check.html', 'check'],
    ['/vocaloid', 'vocaloid'],
    ['/vocaloid.html', 'vocaloid'],
    ['/growth', 'growth'],
    ['/song-growth.html', 'growth']
  ]);

  function currentPageKey() {
    const path = location.pathname.replace(/\/+$/, '') || '/';
    return pageByPath.get(path) || null;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[ch]));
  }

  function renderNav(activeKey) {
    return navItems.map((item) => {
      const active = item.key === activeKey ? ' active' : '';
      return `<a class="culua-shell-nav-item${active}" href="${escapeHtml(item.href)}"${active ? ' aria-current="page"' : ''}>${escapeHtml(item.title)} <span>${escapeHtml(item.meta)}</span></a>`;
    }).join('');
  }

  function getNavItem(activeKey) {
    return navItems.find((item) => item.key === activeKey) || navItems[0];
  }

  function ensureMobileShellNav(activeKey) {
    const sidebar = document.querySelector('.culua-sidebar');
    const brand = sidebar && sidebar.querySelector('.culua-brand');
    if (!activeKey || !sidebar || !brand) return;

    let compact = sidebar.querySelector('.culua-mobile-nav-compact');
    if (!compact) {
      compact = document.createElement('div');
      compact.className = 'culua-mobile-nav-compact';

      const current = document.createElement('span');
      current.className = 'culua-mobile-current';

      const toggle = document.createElement('button');
      toggle.className = 'culua-mobile-nav-toggle';
      toggle.type = 'button';
      toggle.textContent = '页面';
      toggle.setAttribute('aria-label', '展开页面导航');
      toggle.setAttribute('aria-expanded', 'false');

      toggle.addEventListener('click', () => {
        const open = !sidebar.classList.contains('culua-mobile-nav-open');
        sidebar.classList.toggle('culua-mobile-nav-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });

      const nav = sidebar.querySelector('.culua-shell-nav');
      if (nav) {
        nav.addEventListener('click', (event) => {
          if (!(event.target instanceof Element) || !event.target.closest('.culua-shell-nav-item')) return;
          sidebar.classList.remove('culua-mobile-nav-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      }

      compact.append(current, toggle);
      brand.insertAdjacentElement('afterend', compact);
    }

    const current = compact.querySelector('.culua-mobile-current');
    if (current) {
      current.textContent = getNavItem(activeKey).title;
    }
  }

  function syncShell(activeKey) {
    if (!activeKey) return;
    document.body.classList.add('culua-shell-page', `culua-shell-${activeKey}`);
    document.querySelectorAll('.culua-shell-nav-item').forEach((link) => {
      const href = link.getAttribute('href') || '';
      const item = navItems.find((nav) => nav.href === href);
      const isActive = item && item.key === activeKey;
      link.classList.toggle('active', !!isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
    ensureMobileShellNav(activeKey);
  }

  function applyShell() {
    const activeKey = currentPageKey();
    if (!activeKey) return;
    if (document.querySelector('.culua-page-shell')) {
      syncShell(activeKey);
      return;
    }

    document.body.classList.add('culua-shell-page', `culua-shell-${activeKey}`);

    const shell = document.createElement('div');
    shell.className = 'culua-page-shell';
    shell.innerHTML = `
      <aside class="culua-sidebar">
        <div class="culua-brand">
          <div class="culua-brand-title">CULUA</div>
        </div>
        <nav class="culua-shell-nav" aria-label="页面导航">${renderNav(activeKey)}</nav>
      </aside>
      <main class="culua-page-content"></main>
    `;

    const content = shell.querySelector('.culua-page-content');
    Array.from(document.body.childNodes).forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        if (tagName === 'script') return;
      }
      content.appendChild(node);
    });
    document.body.insertBefore(shell, document.body.firstChild);
    ensureMobileShellNav(activeKey);
  }

  applyShell();
})();
