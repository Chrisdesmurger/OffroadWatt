// OffroadWatt — config-driven blog & social visual generator.
//
// Renders the OffroadWatt off-road house style (see marketing/BRAND.md): dark
// charcoal base, green title panel, teal eyebrow, amber accents, OffroadWatt
// wordmark, and a REAL product photo of the device the article is about,
// featured prominently. One config per article -> all formats in one run.
//
// Usage:
//   node .claude/skills/offroadwatt-social-design/scripts/generate-visuals.mjs <config.json>
//
// Needs a Chromium binary (CHROME_PATH env, or the Playwright default below)
// and dev deps installed (`npm install` + `npm install --no-save puppeteer-core`).
//
// Config shape (all paths relative to repo root):
// {
//   "slug": "mppt-vs-pwm",
//   "product": "marketing/social/mppt-vs-pwm/_src/mppt-product.png",
//   "heroBase": "landing/blog/assets/mppt-vs-pwm-hero",   // -> .png / -fr.png / -es.png
//   "socialDir": "marketing/social/mppt-vs-pwm",
//   "eyebrow": { "en": "Solar · Off-grid", "fr": "...", "es": "..." },
//   "tag":     { "en": "Solar charging guide", "fr": "...", "es": "..." },
//   "title":   { "en": "MPPT vs PWM:\nWhich Solar\nController Wins?", "fr": "...", "es": "..." }
// }

import puppeteer from 'puppeteer-core';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname, resolve, isAbsolute } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../../..'); // repo root from skill scripts dir

const CHROME =
  process.env.CHROME_PATH ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const configArg = process.argv[2];
if (!configArg) {
  console.error('Usage: generate-visuals.mjs <config.json>');
  process.exit(1);
}
const cfgPath = isAbsolute(configArg) ? configArg : resolve(process.cwd(), configArg);
const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));

const abs = (p) => (isAbsolute(p) ? p : join(ROOT, p));
const imgBytes = readFileSync(abs(cfg.product));
const imgBase64 = `data:image/png;base64,${imgBytes.toString('base64')}`;

// Shared chrome — NO green geometric blocks (they used to clip the product).
const CHROME_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&display=swap');
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
.photo { object-fit:contain; filter:drop-shadow(0 24px 48px rgba(0,0,0,0.55)) brightness(1.03) contrast(1.04); z-index:1; }
.product-glow { border-radius:50%; background:radial-gradient(circle, rgba(45,212,191,0.16) 0%, rgba(45,212,191,0.05) 45%, transparent 72%); z-index:0; }
.glow { background:linear-gradient(180deg, transparent 0%, rgba(240,160,48,0.07) 100%); z-index:3; }
`;

const titleSpans = (title) =>
  title.split('\n').map((l) => `<span>${l}</span>`).join('');

// Horizontal (16:9) — headline left, product right.
function buildHorizontal({ w, h, title, tag, eyebrow }) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${CHROME_CSS}
body { width:${w}px; height:${h}px; }
.product-glow { position:absolute; top:${h * 0.18}px; right:${w * 0.07}px; width:${w * 0.48}px; height:${h * 0.72}px; }
.photo { position:absolute; top:${h * 0.32}px; right:${w * 0.02}px; width:${w * 0.58}px; }
.overlay { position:absolute; inset:0; z-index:2; background:linear-gradient(90deg,#090b0a 0%,#090b0a 34%,rgba(9,11,10,0.85) 45%,rgba(9,11,10,0.35) 62%,transparent 78%); }
.glow { position:absolute; bottom:0; left:0; right:0; height:${h * 0.22}px; }
.eyebrow { position:absolute; top:${h * 0.097}px; left:64px; font-size:14px; }
.panel { position:absolute; top:${h * 0.153}px; left:60px; max-width:${w * 0.41}px; padding:30px 36px; }
.panel span { font-size:48px; }
.sub { position:absolute; bottom:${h * 0.111}px; left:64px; z-index:10; }
.sub-tag { font-size:13px; } .sub-url { font-size:15px; }
.accent-line { position:absolute; bottom:${h * 0.083}px; left:64px; width:60px; height:3px; }
.wordmark { position:absolute; bottom:${h * 0.042}px; left:64px; font-size:14px; }
</style></head><body>
<div class="product-glow"></div>
<img class="photo" src="${imgBase64}" alt="">
<div class="overlay"></div>
<div class="glow"></div>
<div class="eyebrow">${eyebrow}</div>
<div class="panel">${titleSpans(title)}</div>
<div class="sub"><div class="sub-tag">${tag}</div><div class="sub-url">app.offroadwatt.com</div></div>
<div class="accent-line"></div>
<div class="wordmark">Offroad<em>Watt</em></div>
</body></html>`;
}

// Vertical (4:5 and 9:16) — headline top, product centered below.
function buildVertical({ w, h, title, tag, eyebrow, titleSize = 64 }) {
  const productW = w * 0.92;
  const productTop = h * 0.4;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${CHROME_CSS}
body { width:${w}px; height:${h}px; }
.product-glow { position:absolute; top:${productTop - 40}px; left:50%; transform:translateX(-50%); width:${w * 0.95}px; height:${w * 0.7}px; }
.photo { position:absolute; top:${productTop}px; left:50%; transform:translateX(-50%); width:${productW}px; }
.topfade { position:absolute; top:0; left:0; right:0; height:${h * 0.42}px; z-index:2; background:linear-gradient(180deg,#090b0a 0%,#090b0a 55%,rgba(9,11,10,0.6) 80%,transparent 100%); }
.botfade { position:absolute; bottom:0; left:0; right:0; height:${h * 0.30}px; z-index:2; background:linear-gradient(0deg,#090b0a 0%,#090b0a 40%,rgba(9,11,10,0.55) 75%,transparent 100%); }
.glow { position:absolute; bottom:0; left:0; right:0; height:${h * 0.18}px; }
.eyebrow { position:absolute; top:${h * 0.06}px; left:60px; font-size:18px; }
.panel { position:absolute; top:${h * 0.10}px; left:60px; right:60px; padding:30px 36px; }
.panel span { font-size:${titleSize}px; }
.sub { position:absolute; bottom:${h * 0.09}px; left:60px; z-index:10; }
.sub-tag { font-size:16px; } .sub-url { font-size:18px; }
.accent-line { position:absolute; bottom:${h * 0.07}px; left:60px; width:64px; height:3px; }
.wordmark { position:absolute; bottom:${h * 0.04}px; left:60px; font-size:18px; }
</style></head><body>
<div class="product-glow"></div>
<img class="photo" src="${imgBase64}" alt="">
<div class="topfade"></div>
<div class="botfade"></div>
<div class="glow"></div>
<div class="eyebrow">${eyebrow}</div>
<div class="panel">${titleSpans(title)}</div>
<div class="sub"><div class="sub-tag">${tag}</div><div class="sub-url">app.offroadwatt.com</div></div>
<div class="accent-line"></div>
<div class="wordmark">Offroad<em>Watt</em></div>
</body></html>`;
}

// Wrap the EN title so it fits a portrait panel: keep "stacked" feel by adding
// a soft extra break if the source title is only 3 lines.
function portraitTitle(t) {
  return t;
}

function buildVisualList() {
  const langs = ['en', 'fr', 'es'];
  const heroSuffix = { en: '.png', fr: '-fr.png', es: '-es.png' };
  const list = [];

  // Blog / OG heroes (canonical paths used by the article HTML), all langs.
  for (const lng of langs) {
    list.push({
      file: `${cfg.heroBase}${heroSuffix[lng]}`,
      kind: 'h', w: 1280, h: 720,
      eyebrow: cfg.eyebrow[lng], title: cfg.title[lng], tag: cfg.tag[lng],
    });
  }

  // Social variants in the article folder (EN — primary social language).
  const S = cfg.socialDir;
  list.push(
    { file: `${S}/og-1280x720.png`,         kind: 'h', w: 1280, h: 720,  eyebrow: cfg.eyebrow.en, title: cfg.title.en, tag: cfg.tag.en },
    { file: `${S}/x-1200x675.png`,          kind: 'h', w: 1200, h: 675,  eyebrow: cfg.eyebrow.en, title: cfg.title.en, tag: cfg.tag.en },
    { file: `${S}/instagram-1080x1350.png`, kind: 'v', w: 1080, h: 1350, titleSize: 64, eyebrow: cfg.eyebrow.en, title: portraitTitle(cfg.title.en), tag: cfg.tag.en },
    { file: `${S}/story-1080x1920.png`,     kind: 'v', w: 1080, h: 1920, titleSize: 66, eyebrow: cfg.eyebrow.en, title: portraitTitle(cfg.title.en), tag: cfg.tag.en },
  );
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
    const html = v.kind === 'v' ? buildVertical(v) : buildHorizontal(v);
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const outPath = abs(v.file);
    mkdirSync(dirname(outPath), { recursive: true });
    await page.screenshot({ path: outPath, type: 'png' });
    await page.close();
    console.log(`✓ ${v.file} (${v.w}x${v.h})`);
  }

  await browser.close();
  console.log(`Done — visuals generated for "${cfg.slug}".`);
}

main().catch((e) => { console.error(e); process.exit(1); });
