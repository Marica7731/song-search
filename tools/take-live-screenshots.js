const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

async function main() {
  const shots = process.argv[2];
  if (!shots) {
    throw new Error('missing output dir');
  }
  fs.mkdirSync(shots, { recursive: true });

  const browser = await chromium.launch();
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1400 } });
  const base = process.argv[3] || 'https://www.culua.com';
  const pages = [
    ['stats', `${base}/stats.html`],
    ['bv', `${base}/bv-dup-check.html`],
    ['check', `${base}/title-artist-check.html`],
  ];

  for (const [name, url] of pages) {
    await desktop.goto(url, { waitUntil: 'networkidle' });
    await desktop.screenshot({ path: path.join(shots, `${name}-desktop.png`), fullPage: true });
  }

  const context = await browser.newContext(devices['iPhone 13']);
  const mobile = await context.newPage();
  for (const [name, url] of pages) {
    await mobile.goto(url, { waitUntil: 'networkidle' });
    await mobile.screenshot({ path: path.join(shots, `${name}-mobile.png`), fullPage: true });
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
