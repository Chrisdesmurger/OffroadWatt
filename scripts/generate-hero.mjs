import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const HEROES = [
  {
    file: 'landing/blog/assets/inverter-sizing-hero.png',
    title: 'What Size\nInverter Does\nYour Van\nNeed?',
    subtitle: 'app.offroadwatt.com',
  },
  {
    file: 'landing/blog/assets/inverter-sizing-hero-fr.png',
    title: 'Quelle\nPuissance de\nConvertisseur\npour Votre\nVan ?',
    subtitle: 'app.offroadwatt.com',
  },
  {
    file: 'landing/blog/assets/inverter-sizing-hero-es.png',
    title: '¿Qué Tamaño\nde Inversor\nNecesita Tu\nVan?',
    subtitle: 'app.offroadwatt.com',
  },
];

function buildHTML(title, subtitle) {
  const lines = title.split('\n');
  const titleHTML = lines.map(l => `<span>${l}</span>`).join('');
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
* { margin:0; padding:0; box-sizing:border-box; }
body {
  width: 1280px; height: 720px; overflow: hidden;
  font-family: 'Space Mono', monospace;
  background: #090b0a;
  position: relative;
}

/* Background: gradient simulating dusk sky + van silhouette */
.bg {
  position: absolute; inset: 0;
  background:
    linear-gradient(180deg,
      #0a0c14 0%,
      #121830 25%,
      #1a1535 40%,
      #3d1a3a 55%,
      #7a3020 70%,
      #c05828 80%,
      #e87830 88%,
      #f0a030 95%,
      #f0a030 100%
    );
  opacity: 0.55;
}

/* Van silhouette */
.van {
  position: absolute;
  bottom: 80px; right: 180px;
  width: 340px; height: 200px;
  background: #050707;
  border-radius: 12px 12px 4px 4px;
  opacity: 0.85;
}
.van::before {
  content: '';
  position: absolute;
  top: -50px; left: 0;
  width: 220px; height: 50px;
  background: #050707;
  border-radius: 8px 8px 0 0;
}
.van::after {
  content: '';
  position: absolute;
  bottom: -18px; left: 40px;
  width: 50px; height: 36px;
  background: #050707;
  border-radius: 50%;
  box-shadow: 200px 0 0 #050707;
}
/* Roof rack / solar panel on van */
.roof {
  position: absolute;
  bottom: 280px; right: 200px;
  width: 300px; height: 8px;
  background: #0a0e0c;
  border-radius: 2px;
  opacity: 0.85;
}

/* Ground line */
.ground {
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 80px;
  background: linear-gradient(180deg, #0a0e0c 0%, #050707 100%);
}

/* Green title panel */
.panel {
  position: absolute;
  top: 80px; left: 60px;
  background: #4abe4f;
  padding: 32px 38px;
  border-radius: 6px;
  z-index: 10;
}
.panel span {
  display: block;
  font-size: 52px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.12;
  letter-spacing: -0.5px;
  text-shadow: 0 1px 3px rgba(0,0,0,0.15);
}

/* Green geometric blocks — bottom right */
.block1 {
  position: absolute;
  bottom: 120px; right: 60px;
  width: 80px; height: 100px;
  background: #4abe4f;
  border-radius: 4px;
  z-index: 10;
}
.block2 {
  position: absolute;
  bottom: 120px; right: 20px;
  width: 30px; height: 60px;
  background: #4abe4f;
  border-radius: 4px;
  z-index: 10;
}
.block3 {
  position: absolute;
  bottom: 230px; right: 60px;
  width: 80px; height: 40px;
  background: #4abe4f;
  border-radius: 4px;
  z-index: 10;
}

/* OffroadWatt wordmark bottom-right */
.wordmark {
  position: absolute;
  bottom: 90px; right: 26px;
  font-size: 13px;
  font-weight: 700;
  color: rgba(255,255,255,0.7);
  z-index: 20;
  letter-spacing: 0.5px;
}
.wordmark em {
  font-style: normal;
  color: rgba(74,100,85,0.9);
}

/* Inverter icon — lightning bolt shape */
.bolt {
  position: absolute;
  top: 100px; right: 100px;
  width: 0; height: 0;
  z-index: 5;
  opacity: 0.12;
}
.bolt::before {
  content: '⚡';
  font-size: 220px;
  color: #f0a030;
}
</style>
</head>
<body>
  <div class="bg"></div>
  <div class="ground"></div>
  <div class="van"></div>
  <div class="roof"></div>
  <div class="panel">${titleHTML}</div>
  <div class="block1"></div>
  <div class="block2"></div>
  <div class="block3"></div>
  <div class="bolt"></div>
  <div class="wordmark">Offroad<em>Watt</em></div>
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
    const html = buildHTML(hero.title, hero.subtitle);
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const outPath = join(ROOT, hero.file);
    mkdirSync(dirname(outPath), { recursive: true });
    await page.screenshot({ path: outPath, type: 'png' });
    await page.close();
    console.log(`✓ ${hero.file}`);
  }

  await browser.close();
  console.log('Done — 3 hero images generated.');
}

main().catch(e => { console.error(e); process.exit(1); });
