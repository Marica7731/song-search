const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

function loadPlaywright() {
  try {
    return require('playwright');
  } catch (localError) {
    const candidates = [];
    const localAppData = process.env.LOCALAPPDATA || '';
    const npxRoot = localAppData ? path.join(localAppData, 'npm-cache', '_npx') : '';
    if (npxRoot && fs.existsSync(npxRoot)) {
      for (const entry of fs.readdirSync(npxRoot)) {
        candidates.push(path.join(npxRoot, entry, 'node_modules', 'playwright'));
      }
    }

    const codexPlaywright = path.join(process.env.USERPROFILE || '', '.codex', 'vendor_imports', 'skills', 'skills', '.curated', 'playwright');
    candidates.push(codexPlaywright);

    for (const candidate of candidates) {
      if (!fs.existsSync(candidate)) continue;
      try {
        return createRequire(path.join(candidate, 'package.json'))('playwright');
      } catch (candidateError) {
        // Try the next known install location.
      }
    }

    throw localError;
  }
}

const { chromium } = loadPlaywright();

function findBrowserExecutable() {
  const candidates = [
    process.env.PLAYWRIGHT_EXECUTABLE_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return '';
}

const outputDir = process.argv[2];
const baseUrl = (process.argv[3] || 'https://www.culua.com').replace(/\/$/, '');

if (!outputDir) {
  throw new Error('missing output dir');
}

const widths = [864, 700, 560, 430, 390, 360, 320];
const cases = [
  {
    slug: 'alia-short-latin',
    query: 'かくれんぼ',
    expectedTitle: 'かくれんぼ',
    expectedArtist: 'AliA',
    noEllipsisAt: [864, 700, 560, 430, 390, 360, 320]
  },
  {
    slug: 'kitani-mid-jp',
    query: '青のすみか',
    expectedTitle: '青のすみか',
    expectedArtist: 'キタニタツヤ',
    noEllipsisAt: [864, 700, 560, 430, 390, 360, 320]
  },
  {
    slug: 'shiina-mid-jp',
    query: '丸ノ内サディスティック',
    expectedTitle: '丸ノ内サディスティック',
    expectedArtist: '椎名林檎',
    noEllipsisAt: [864, 700, 560, 430, 390, 360, 320]
  },
  {
    slug: 'tk-from-mixed',
    query: 'unravel',
    expectedTitle: 'unravel',
    expectedArtist: 'TK from 凛として時雨',
    noEllipsisAt: [864, 700, 560, 430, 390, 360]
  },
  {
    slug: 'slash-short-latin',
    query: 'DISH//',
    expectedTitle: '猫',
    expectedArtist: 'DISH//',
    noEllipsisAt: [864, 700, 560, 430, 390, 360, 320]
  },
  {
    slug: 'slash-combo',
    query: "May'n/中島愛",
    expectedTitle: 'ライオン',
    expectedArtist: "May'n/中島愛",
    noEllipsisAt: [864, 700, 560, 430, 390, 360, 320]
  },
  {
    slug: 'feat-vocaloid',
    query: '初音ミクの消失',
    expectedTitle: '初音ミクの消失',
    expectedArtist: 'cosMo@暴走P feat. 初音ミク',
    noEllipsisAt: [864, 700, 560, 430, 390],
    expectShrinkAt: [320]
  },
  {
    slug: 'feat-short-jp',
    query: 'ナユタン星人 feat. 初音ミク',
    expectedTitle: 'エイリアンエイリアン',
    expectedArtist: 'ナユタン星人 feat. 初音ミク',
    noEllipsisAt: [864, 700, 560, 430, 390],
    expectShrinkAt: [320]
  },
  {
    slug: 'long-jp-band',
    query: '秒針を噛む',
    expectedTitle: '秒針を噛む',
    expectedArtist: 'ずっと真夜中でいいのに。',
    noEllipsisAt: [864, 700, 560, 430, 390],
    expectShrinkAt: [320]
  },
  {
    slug: 'very-long-mixed-credit',
    query: '千の翼',
    expectedTitle: '千の翼',
    expectedArtist: 'livetune adding Takuro Sugawara(from 9mm Parabellum Bullet)  [2026-01-',
    expectShrinkAt: [560, 430, 390, 360, 320],
    expectOverflowAt: [560, 430, 390, 360, 320]
  },
  {
    slug: 'very-long-cast-list',
    query: '檄！帝国華撃団＜新章＞',
    expectedTitle: '檄！帝国華撃団＜新章＞',
    expectedArtist: '『新サクラ大戦』天宮さくら（佐倉綾音）、東雲初穂（内田真礼）、望月あざみ（山村響）、アナスタシア・パルマ（福原綾香）、クラリ',
    expectShrinkAt: [864, 700, 560, 430, 390, 360, 320],
    expectOverflowAt: [700, 560, 430, 390, 360, 320]
  }
];

function buildQueryUrl(base, query) {
  const target = new URL(base.includes('://') ? base : `https://www.culua.com${base}`);
  target.searchParams.set('q', query);
  return target.toString();
}

async function findRowMetrics(page, testCase) {
  return page.evaluate(({ expectedTitle, expectedArtist }) => {
    const rows = Array.from(document.querySelectorAll('.song-row'));
    for (const row of rows) {
      const titleEl = row.querySelector('.song-title .field-copy');
      const artistEl = row.querySelector('.song-artist .field-copy');
      if (!titleEl || !artistEl) continue;
      const title = (titleEl.textContent || '').trim();
      const artist = (artistEl.textContent || '').trim();
      if (title !== expectedTitle || artist !== expectedArtist) continue;
      return {
        title,
        artist,
        fitStage: artistEl.dataset.fitStage || 'full',
        chipWidth: artistEl.getBoundingClientRect().width,
        rowWidth: row.getBoundingClientRect().width,
        containerWidth: artistEl.parentElement ? artistEl.parentElement.getBoundingClientRect().width : 0,
        fontSize: parseFloat(window.getComputedStyle(artistEl).fontSize || '0'),
        paddingLeft: parseFloat(window.getComputedStyle(artistEl).paddingLeft || '0'),
        paddingRight: parseFloat(window.getComputedStyle(artistEl).paddingRight || '0'),
        scrollWidth: artistEl.scrollWidth,
        clientWidth: artistEl.clientWidth,
        overflow: artistEl.scrollWidth > artistEl.clientWidth + 1
      };
    }
    return null;
  }, testCase);
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  let browser;
  try {
    browser = await chromium.launch();
  } catch (error) {
    const executablePath = findBrowserExecutable();
    if (!executablePath) {
      throw error;
    }
    console.warn(`playwright bundled browser unavailable, fallback to ${executablePath}`);
    browser = await chromium.launch({ executablePath });
  }
  const page = await browser.newPage();
  const failures = [];

  for (const testCase of cases) {
    for (const width of widths) {
      await page.setViewportSize({ width, height: 1600 });
      await page.goto(buildQueryUrl(baseUrl, testCase.query), { waitUntil: 'networkidle' });
      await page.waitForSelector('.song-row, .empty-state', { timeout: 10000 });
      const metrics = await findRowMetrics(page, testCase);
      if (!metrics) {
        failures.push(`${testCase.slug}@${width}: row not found`);
        await page.screenshot({ path: path.join(outputDir, `${testCase.slug}-${width}-not-found.png`), fullPage: false });
        continue;
      }

      const shouldFit = Array.isArray(testCase.noEllipsisAt) && testCase.noEllipsisAt.includes(width);
      const shouldShrink = Array.isArray(testCase.expectShrinkAt) && testCase.expectShrinkAt.includes(width);
      const shouldOverflow = Array.isArray(testCase.expectOverflowAt) && testCase.expectOverflowAt.includes(width);
      const screenshotName = `${testCase.slug}-${width}${metrics.overflow ? '-overflow' : ''}.png`;
      const locator = page.locator('.song-row').filter({ has: page.locator('.song-artist .field-copy', { hasText: testCase.expectedArtist }) }).first();
      await locator.screenshot({ path: path.join(outputDir, screenshotName) });

      const summary = `${testCase.slug}@${width}: artist="${metrics.artist}" chip=${Math.round(metrics.chipWidth)} container=${Math.round(metrics.containerWidth)} font=${metrics.fontSize.toFixed(1)} padding=${metrics.paddingLeft.toFixed(1)}/${metrics.paddingRight.toFixed(1)} stage=${metrics.fitStage} overflow=${metrics.overflow}`;
      console.log(summary);

      if (shouldFit && metrics.overflow) {
        failures.push(`${testCase.slug}@${width}: expected full artist chip without truncation`);
      }
      if (shouldShrink && metrics.fitStage === 'full') {
        failures.push(`${testCase.slug}@${width}: expected artist chip compaction before truncation`);
      }
      if (shouldOverflow && !metrics.overflow) {
        failures.push(`${testCase.slug}@${width}: expected truncation after compaction for this extreme artist label`);
      }
    }
  }

  await browser.close();

  if (failures.length) {
    failures.forEach(item => console.error(item));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
