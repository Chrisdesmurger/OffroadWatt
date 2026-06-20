import puppeteer from 'puppeteer-core';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Resolve a Chromium binary (Playwright-managed install or system Chrome).
const CHROME =
  process.env.CHROME_PATH ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

// Real Victron SmartSolar MPPT 100/30 product shot (transparent PNG, trimmed).
const imgBytes = readFileSync('/tmp/mppt/mppt-product.png');
const imgBase64 = `data:image/png;base64,${imgBytes.toString('base64')}`;

const HEROES = [
  {
    file: 'landing/blog/assets/mppt-vs-pwm-hero.png',
    title: 'MPPT vs PWM:\nWhich Solar\nController Wins?',
    tag: 'Solar charging guide',
  },
  {
    file: 'landing/blog/assets/mppt-vs-pwm-hero-fr.png',
    title: 'MPPT ou PWM :\nQuel Régulateur\nSolaire Choisir ?',
    tag: 'Guide de charge solaire',
  },
  {
    file: 'landing/blog/assets/mppt-vs-pwm-hero-es.png',
    title: 'MPPT o PWM:\n¿Qué Regulador\nSolar Elegir?',
    tag: 'Guía de carga solar',
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

/* Teal glow behind the product (solar accent) */
.product-glow {
  position: absolute;
  top: 130px; right: 90px;
  width: 620px; height: 520px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(45,212,191,0.16) 0%, rgba(45,212,191,0.05) 45%, transparent 72%);
  z-index: 0;
}

/* Real MPPT controller — right side, contained */
.photo {
  position: absolute;
  top: 230px; right: 30px;
  width: 740px;
  object-fit: contain;
  filter: drop-shadow(0 24px 48px rgba(0,0,0,0.55)) brightness(1.03) contrast(1.04);
  z-index: 1;
}

/* Left-side gradient fade to anchor the headline */
.overlay {
  position: absolute; inset: 0;
  background:
    linear-gradient(90deg,
      #090b0a 0%,
      #090b0a 34%,
      rgba(9,11,10,0.85) 45%,
      rgba(9,11,10,0.35) 62%,
      transparent 78%
    );
  z-index: 2;
}

/* Subtle amber glow at bottom for brand warmth */
.glow {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 160px;
  background: linear-gradient(180deg, transparent 0%, rgba(240,160,48,0.07) 100%);
  z-index: 3;
}

/* Eyebrow above the title */
.eyebrow {
  position: absolute;
  top: 70px; left: 64px;
  font-family: 'Space Mono', monospace;
  font-size: 14px;
  font-weight: 700;
  color: #2dd4bf;
  text-transform: uppercase;
  letter-spacing: 2px;
  z-index: 10;
}

/* Green title panel — left side (house style) */
.panel {
  position: absolute;
  top: 110px; left: 60px;
  background: #4abe4f;
  padding: 30px 36px;
  border-radius: 6px;
  z-index: 10;
  max-width: 520px;
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

/* Green geometric accents — bottom right */
.block1 { position: absolute; bottom: 50px; right: 50px; width: 70px; height: 90px; background: #4abe4f; border-radius: 4px; z-index: 10; opacity: 0.85; }
.block2 { position: absolute; bottom: 50px; right: 14px; width: 26px; height: 50px; background: #4abe4f; border-radius: 4px; z-index: 10; opacity: 0.85; }
.block3 { position: absolute; bottom: 150px; right: 50px; width: 70px; height: 34px; background: #4abe4f; border-radius: 4px; z-index: 10; opacity: 0.85; }

/* OffroadWatt wordmark bottom-left */
.wordmark {
  position: absolute;
  bottom: 30px; left: 64px;
  font-size: 14px;
  font-weight: 700;
  color: rgba(221,238,221,0.8);
  z-index: 20;
  letter-spacing: 0.5px;
}
.wordmark em { font-style: normal; color: #4a6455; }

/* Thin amber line separator */
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
  <div class="eyebrow">Solar &middot; Off-grid</div>
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
    executablePath: CHROME,
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
  console.log('Done — 3 MPPT hero images generated.');
}

main().catch(e => { console.error(e); process.exit(1); });
