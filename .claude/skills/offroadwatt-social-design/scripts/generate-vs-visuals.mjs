// VS layout visual generator for OffroadWatt
// Two products side by side with a large orange "VS" in the center.

import puppeteer from 'puppeteer-core';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname, resolve, isAbsolute } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = process.argv[3] || process.cwd();

// Prefer locally cached brand fonts (embedded as base64) so rendering never
// depends on a live CDN — Chromium in sandboxed runs can't always reach
// fonts.gstatic.com and would hang on networkidle. Falls back to the CDN import.
const FONT_DIR = join(__dirname, '..', '.fonts');
function fontFaceCSS() {
  const reg = join(FONT_DIR, 'SpaceMono-Regular.ttf');
  if (!existsSync(reg)) {
    return `@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&display=swap');`;
  }
  const data = (file) =>
    `data:font/ttf;base64,${readFileSync(join(FONT_DIR, file)).toString('base64')}`;
  return `
@font-face{font-family:'Space Mono';font-weight:400;font-style:normal;src:url('${data('SpaceMono-Regular.ttf')}') format('truetype');}
@font-face{font-family:'Space Mono';font-weight:700;font-style:normal;src:url('${data('SpaceMono-Bold.ttf')}') format('truetype');}
@font-face{font-family:'DM Sans';font-weight:400 700;font-style:normal;src:url('${data('DMSans.ttf')}') format('truetype');}`;
}

const CHROME =
  process.env.CHROME_PATH ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const configArg = process.argv[2];
if (!configArg) {
  console.error('Usage: generate-vs-visuals.mjs <config.json> [repo-root]');
  process.exit(1);
}
const cfgPath = isAbsolute(configArg) ? configArg : resolve(process.cwd(), configArg);
const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));

const abs = (p) => (isAbsolute(p) ? p : join(ROOT, p));

const img1Bytes = readFileSync(abs(cfg.productLeft));
const img1Base64 = `data:image/png;base64,${img1Bytes.toString('base64')}`;
const img2Bytes = readFileSync(abs(cfg.productRight));
const img2Base64 = `data:image/png;base64,${img2Bytes.toString('base64')}`;

const CHROME_CSS = `
${fontFaceCSS()}
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Space Mono', monospace; background:#090b0a; position:relative; overflow:hidden; }
.panel { background:#4abe4f; border-radius:6px; z-index:10; }
.panel span { display:block; font-weight:700; color:#fff; line-height:1.15; letter-spacing:-0.5px; text-shadow:0 2px 4px rgba(0,0,0,0.2); }
.eyebrow { font-family:'Space Mono', monospace; font-weight:700; color:#2dd4bf; text-transform:uppercase; letter-spacing:2px; z-index:10; }
.sub-tag { display:inline-block; font-family:'Space Mono', monospace; font-weight:700; color:#f0a030; text-transform:uppercase; letter-spacing:2px; margin-bottom:8px; }
.sub-url { display:block; font-family:'DM Sans', sans-serif; color:#7a9985; }
.wordmark { font-weight:700; color:rgba(221,238,221,0.85); z-index:20; letter-spacing:0.5px; }
.wordmark em { font-style:normal; color:#4a6455; }
.accent-line { background:#f0a030; border-radius:2px; z-index:10; }
.photo { object-fit:contain; filter:drop-shadow(0 24px 48px rgba(0,0,0,0.55)) brightness(1.03) contrast(1.04); z-index:5; }
.product-glow-left { position:absolute; border-radius:50%; background:radial-gradient(circle, rgba(45,212,191,0.18) 0%, rgba(45,212,191,0.05) 45%, transparent 72%); z-index:0; }
.product-glow-right { position:absolute; border-radius:50%; background:radial-gradient(circle, rgba(240,160,48,0.14) 0%, rgba(240,160,48,0.04) 45%, transparent 72%); z-index:0; }
.vs-badge {
  position:absolute; z-index:15;
  font-family:'Space Mono', monospace; font-weight:700; color:#f0a030;
  text-shadow: 0 0 40px rgba(240,160,48,0.6), 0 0 80px rgba(240,160,48,0.3), 0 4px 8px rgba(0,0,0,0.5);
  letter-spacing:-2px;
  display:flex; align-items:center; justify-content:center;
}
.vs-circle {
  position:absolute; z-index:14;
  border-radius:50%;
  background: radial-gradient(circle, rgba(240,160,48,0.15) 0%, rgba(240,160,48,0.05) 50%, transparent 70%);
  border: 3px solid rgba(240,160,48,0.35);
}
.label-left, .label-right {
  position:absolute; z-index:16;
  font-family:'DM Sans', sans-serif; font-weight:700;
  text-transform:uppercase; letter-spacing:1.5px;
  text-align:center;
  text-shadow: 0 2px 8px rgba(0,0,0,0.7);
}
.label-left { color:#2dd4bf; }
.label-right { color:#f0a030; }
`;

const titleSpans = (title) =>
  title.split('\n').map((l) => `<span>${l}</span>`).join('');

// Horizontal VS layout (16:9) — two products side by side, VS in center
function buildHorizontalVS({ w, h, title, tag, eyebrow, labelLeft, labelRight }) {
  const productW = w * 0.32;
  const productTopLeft = h * 0.15;
  const productTopRight = h * 0.12;
  const vsSize = Math.round(h * 0.22);
  const circleSize = Math.round(vsSize * 1.4);

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${CHROME_CSS}
body { width:${w}px; height:${h}px; }

.product-glow-left { top:${h * 0.1}px; left:${w * 0.02}px; width:${w * 0.38}px; height:${h * 0.7}px; }
.photo-left { position:absolute; top:${productTopLeft}px; left:${w * 0.04}px; width:${productW}px; z-index:5; }
.photo-right { position:absolute; top:${productTopRight}px; right:${w * 0.04}px; width:${productW}px; z-index:5; }
.product-glow-right { top:${h * 0.1}px; right:${w * 0.02}px; width:${w * 0.38}px; height:${h * 0.7}px; }

.vs-badge { top:${h * 0.25}px; left:50%; transform:translateX(-50%); font-size:${vsSize}px; width:${circleSize}px; height:${circleSize}px; }
.vs-circle { top:${h * 0.25 - (circleSize - vsSize) * 0.3}px; left:50%; transform:translateX(-50%); width:${circleSize}px; height:${circleSize}px; }

.label-left { bottom:${h * 0.07}px; left:0; width:50%; font-size:14px; }
.label-right { bottom:${h * 0.07}px; right:0; width:50%; font-size:14px; }

.overlay-center { position:absolute; inset:0; z-index:4;
  background: radial-gradient(ellipse 20% 100% at 50% 50%, rgba(9,11,10,0.7) 0%, transparent 100%); }

.top-bar { position:absolute; top:0; left:0; right:0; height:${h * 0.14}px; z-index:8;
  background:linear-gradient(180deg, #090b0a 0%, #090b0a 40%, transparent 100%); }
.bot-bar { position:absolute; bottom:0; left:0; right:0; height:${h * 0.20}px; z-index:8;
  background:linear-gradient(0deg, #090b0a 0%, #090b0a 30%, transparent 100%); }

.eyebrow { position:absolute; top:${h * 0.025}px; left:50%; transform:translateX(-50%); font-size:12px; z-index:12; white-space:nowrap; }
.panel { position:absolute; bottom:${h * 0.17}px; left:50%; transform:translateX(-50%); padding:14px 28px; z-index:12; text-align:center; white-space:nowrap; }
.panel span { font-size:28px; }
.sub { position:absolute; bottom:${h * 0.035}px; left:50%; transform:translateX(-50%); z-index:12; text-align:center; }
.sub-tag { font-size:11px; } .sub-url { font-size:12px; }
.accent-line { position:absolute; bottom:${h * 0.025}px; left:50%; transform:translateX(-50%); width:50px; height:2px; z-index:12; }
.wordmark { position:absolute; top:${h * 0.025}px; right:40px; font-size:12px; z-index:12; }
</style></head><body>
<div class="product-glow-left"></div>
<div class="product-glow-right"></div>
<img class="photo photo-left" src="${img1Base64}" alt="">
<img class="photo photo-right" src="${img2Base64}" alt="">
<div class="overlay-center"></div>
<div class="top-bar"></div>
<div class="bot-bar"></div>
<div class="vs-circle"></div>
<div class="vs-badge">VS</div>
<div class="label-left">${labelLeft}</div>
<div class="label-right">${labelRight}</div>
<div class="eyebrow">${eyebrow}</div>
<div class="panel">${titleSpans(title)}</div>
<div class="sub"><div class="sub-tag">${tag}</div><div class="sub-url">app.offroadwatt.com</div></div>
<div class="accent-line"></div>
<div class="wordmark">Offroad<em>Watt</em></div>
</body></html>`;
}

// Vertical VS layout (4:5 Instagram) — products side by side upper half, title below
function buildVerticalVS({ w, h, title, tag, eyebrow, titleSize = 52, labelLeft, labelRight }) {
  const productW = w * 0.36;
  const productTop = h * 0.12;
  const vsSize = Math.round(h * 0.11);
  const circleSize = Math.round(vsSize * 1.5);

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${CHROME_CSS}
body { width:${w}px; height:${h}px; }

.product-glow-left { top:${h * 0.08}px; left:${w * 0.02}px; width:${w * 0.42}px; height:${h * 0.38}px; }
.photo-left { position:absolute; top:${productTop}px; left:${w * 0.06}px; width:${productW}px; z-index:5; }
.photo-right { position:absolute; top:${productTop}px; right:${w * 0.06}px; width:${productW}px; z-index:5; }
.product-glow-right { top:${h * 0.08}px; right:${w * 0.02}px; width:${w * 0.42}px; height:${h * 0.38}px; }

.vs-badge { top:${h * 0.20}px; left:50%; transform:translateX(-50%); font-size:${vsSize}px; width:${circleSize}px; height:${circleSize}px; }
.vs-circle { top:${h * 0.20 - (circleSize - vsSize) * 0.25}px; left:50%; transform:translateX(-50%); width:${circleSize}px; height:${circleSize}px; }

.label-left { top:${h * 0.48}px; left:0; width:50%; font-size:16px; }
.label-right { top:${h * 0.48}px; right:0; width:50%; font-size:16px; }

.mid-fade { position:absolute; top:${h * 0.45}px; left:0; right:0; height:${h * 0.15}px; z-index:6;
  background:linear-gradient(180deg, transparent 0%, #090b0a 100%); }
.top-bar { position:absolute; top:0; left:0; right:0; height:${h * 0.10}px; z-index:8;
  background:linear-gradient(180deg, #090b0a 0%, transparent 100%); }
.bot-bar { position:absolute; bottom:0; left:0; right:0; height:${h * 0.14}px; z-index:8;
  background:linear-gradient(0deg, #090b0a 0%, #090b0a 30%, transparent 100%); }

.eyebrow { position:absolute; top:${h * 0.55}px; left:60px; font-size:16px; z-index:12; }
.panel { position:absolute; top:${h * 0.59}px; left:60px; right:60px; padding:24px 30px; z-index:12; }
.panel span { font-size:${titleSize}px; }
.sub { position:absolute; bottom:${h * 0.07}px; left:60px; z-index:12; }
.sub-tag { font-size:14px; } .sub-url { font-size:16px; }
.accent-line { position:absolute; bottom:${h * 0.055}px; left:60px; width:56px; height:3px; z-index:12; }
.wordmark { position:absolute; bottom:${h * 0.03}px; left:60px; font-size:16px; z-index:12; }
</style></head><body>
<div class="product-glow-left"></div>
<div class="product-glow-right"></div>
<img class="photo photo-left" src="${img1Base64}" alt="">
<img class="photo photo-right" src="${img2Base64}" alt="">
<div class="top-bar"></div>
<div class="mid-fade"></div>
<div class="bot-bar"></div>
<div class="vs-circle"></div>
<div class="vs-badge">VS</div>
<div class="label-left">${labelLeft}</div>
<div class="label-right">${labelRight}</div>
<div class="eyebrow">${eyebrow}</div>
<div class="panel">${titleSpans(title)}</div>
<div class="sub"><div class="sub-tag">${tag}</div><div class="sub-url">app.offroadwatt.com</div></div>
<div class="accent-line"></div>
<div class="wordmark">Offroad<em>Watt</em></div>
</body></html>`;
}

function buildVisualList() {
  const langs = ['en', 'fr', 'es'];
  const heroSuffix = { en: '.png', fr: '-fr.png', es: '-es.png' };
  const labelLeft = cfg.labelLeft || {};
  const labelRight = cfg.labelRight || {};
  const list = [];

  for (const lng of langs) {
    list.push({
      file: `${cfg.heroBase}${heroSuffix[lng]}`,
      kind: 'h', w: 1280, h: 720,
      eyebrow: cfg.eyebrow[lng], title: cfg.title[lng], tag: cfg.tag[lng],
      labelLeft: labelLeft[lng] || '', labelRight: labelRight[lng] || '',
    });
  }

  const S = cfg.socialDir;
  const socialSuffix = { en: '', fr: '-fr', es: '-es' };
  list.push(
    { file: `${S}/og-1280x720.png`, kind: 'h', w: 1280, h: 720,
      eyebrow: cfg.eyebrow.en, title: cfg.title.en, tag: cfg.tag.en,
      labelLeft: labelLeft.en || '', labelRight: labelRight.en || '' },
    { file: `${S}/x-1200x675.png`, kind: 'h', w: 1200, h: 675,
      eyebrow: cfg.eyebrow.en, title: cfg.title.en, tag: cfg.tag.en,
      labelLeft: labelLeft.en || '', labelRight: labelRight.en || '' },
  );
  // Instagram (4:5) + story (9:16) per language so each market gets a native cover.
  for (const lng of langs) {
    list.push(
      { file: `${S}/instagram-1080x1350${socialSuffix[lng]}.png`, kind: 'v', w: 1080, h: 1350, titleSize: 52,
        eyebrow: cfg.eyebrow[lng], title: cfg.title[lng], tag: cfg.tag[lng],
        labelLeft: labelLeft[lng] || '', labelRight: labelRight[lng] || '' },
      { file: `${S}/story-1080x1920${socialSuffix[lng]}.png`, kind: 'v', w: 1080, h: 1920, titleSize: 56,
        eyebrow: cfg.eyebrow[lng], title: cfg.title[lng], tag: cfg.tag[lng],
        labelLeft: labelLeft[lng] || '', labelRight: labelRight[lng] || '' },
    );
  }
  return list;
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  for (const v of buildVisualList()) {
    const page = await browser.newPage();
    await page.setViewport({ width: v.w, height: v.h, deviceScaleFactor: 1 });
    const html = v.kind === 'v' ? buildVerticalVS(v) : buildHorizontalVS(v);
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const outPath = abs(v.file);
    mkdirSync(dirname(outPath), { recursive: true });
    await page.screenshot({ path: outPath, type: 'png' });
    await page.close();
    console.log(`✓ ${v.file} (${v.w}x${v.h})`);
  }

  await browser.close();
  console.log(`Done — VS visuals generated for "${cfg.slug}".`);
}

main().catch((e) => { console.error(e); process.exit(1); });
