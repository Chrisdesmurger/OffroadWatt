import puppeteer from 'puppeteer';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const imgBytes = readFileSync('/tmp/hero-candidates/dcdc-powertech.webp');
const imgBase64 = `data:image/webp;base64,${imgBytes.toString('base64')}`;

const HEROES = [
  {
    file: 'landing/blog/assets/dc-dc-charger-hero.png',
    title: 'How to Wire a\nDC-DC Charger\nin Your Van',
    tag: 'Installation guide',
  },
  {
    file: 'landing/blog/assets/dc-dc-charger-hero-fr.png',
    title: 'Brancher un\nChargeur DC-DC\ndans Votre Van',
    tag: "Guide d'installation",
  },
  {
    file: 'landing/blog/assets/dc-dc-charger-hero-es.png',
    title: 'Cómo Instalar\nun Cargador\nDC-DC en Tu Van',
    tag: 'Guía de instalación',
  },
];

function buildHTML(title, tag) {
  const lines = title.split('\n');
  const titleHTML = lines.map(l => `<span>${l}</span>`).join('');
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&display=swap');
* { margin:0; padding:0; box-sizing:border-box; }
body {
  width: 1280px; height: 720px; overflow: hidden;
  font-family: 'Space Mono', monospace;
  background: #090b0a;
  position: relative;
}

/* Product image — right side, multiply blend to remove white bg */
.photo {
  position: absolute;
  top: 30px; right: 20px;
  width: 680px; height: 680px;
  object-fit: contain;
  mix-blend-mode: lighten;
  filter: brightness(0.95) contrast(1.05);
  z-index: 1;
}

/* Subtle radial glow behind the product */
.product-glow {
  position: absolute;
  top: 60px; right: 80px;
  width: 560px; height: 560px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(240,160,48,0.08) 0%, transparent 70%);
  z-index: 0;
}

/* Left-side gradient fade */
.overlay {
  position: absolute; inset: 0;
  background:
    linear-gradient(90deg,
      #090b0a 0%,
      #090b0a 35%,
      rgba(9,11,10,0.85) 45%,
      rgba(9,11,10,0.3) 60%,
      transparent 75%
    );
  z-index: 2;
}

/* Subtle amber glow at bottom */
.glow {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 120px;
  background: linear-gradient(180deg, transparent 0%, rgba(240,160,48,0.06) 100%);
  z-index: 3;
}

/* Green title panel */
.panel {
  position: absolute;
  top: 100px; left: 60px;
  background: #4abe4f;
  padding: 30px 36px;
  border-radius: 6px;
  z-index: 10;
  max-width: 480px;
}
.panel span {
  display: block;
  font-size: 48px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.15;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

/* Tag + URL below panel */
.sub {
  position: absolute;
  bottom: 80px; left: 64px;
  z-index: 10;
}
.sub-tag {
  display: inline-block;
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  font-weight: 700;
  color: #f0a030;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 8px;
}
.sub-url {
  display: block;
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  color: #7a9985;
}

/* Green geometric accents */
.block1 {
  position: absolute;
  bottom: 50px; right: 50px;
  width: 70px; height: 90px;
  background: #4abe4f;
  border-radius: 4px;
  z-index: 10;
  opacity: 0.85;
}
.block2 {
  position: absolute;
  bottom: 50px; right: 14px;
  width: 26px; height: 50px;
  background: #4abe4f;
  border-radius: 4px;
  z-index: 10;
  opacity: 0.85;
}
.block3 {
  position: absolute;
  bottom: 150px; right: 50px;
  width: 70px; height: 34px;
  background: #4abe4f;
  border-radius: 4px;
  z-index: 10;
  opacity: 0.85;
}

/* OffroadWatt wordmark */
.wordmark {
  position: absolute;
  bottom: 30px; left: 64px;
  font-size: 14px;
  font-weight: 700;
  color: rgba(221,238,221,0.8);
  z-index: 20;
  letter-spacing: 0.5px;
}
.wordmark em {
  font-style: normal;
  color: #4a6455;
}

/* Accent line */
.accent-line {
  position: absolute;
  bottom: 60px; left: 64px;
  width: 60px; height: 3px;
  background: #f0a030;
  border-radius: 2px;
  z-index: 10;
}
</style>
</head>
<body>
  <div class="product-glow"></div>
  <img class="photo" src="${imgBase64}" alt="">
  <div class="overlay"></div>
  <div class="glow"></div>
  <div class="panel">${titleHTML}</div>
  <div class="sub">
    <div class="sub-tag">${tag}</div>
    <div class="sub-url">app.offroadwatt.com</div>
  </div>
  <div class="accent-line"></div>
  <div class="wordmark">Offroad<em>Watt</em></div>
  <div class="block1"></div>
  <div class="block2"></div>
  <div class="block3"></div>
</body>
</html>`;
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  for (const hero of HEROES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
    const html = buildHTML(hero.title, hero.tag);
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const outPath = join(ROOT, hero.file);
    mkdirSync(dirname(outPath), { recursive: true });
    await page.screenshot({ path: outPath, type: 'png' });
    await page.close();
    console.log(`✓ ${hero.file}`);
  }

  await browser.close();
  console.log('Done — 3 DC-DC hero images generated.');
}

main().catch(e => { console.error(e); process.exit(1); });
