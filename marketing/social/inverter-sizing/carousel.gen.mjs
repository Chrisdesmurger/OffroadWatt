// OffroadWatt — content-slide generator for the "inverter sizing" carousel.
// Slide 1 (cover) is the product-hero image; this builds slides 2..6 in the
// same house style (charcoal, amber/teal, Space Mono + DM Sans, wordmark,
// progress dots) so the swipe stays cohesive. 1080x1350 (Instagram 4:5).
import puppeteer from 'puppeteer-core';
import { readFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = __dirname; // marketing/social/inverter-sizing
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const product = `data:image/png;base64,${readFileSync(resolve(DIR, '_src/inverter-product.png')).toString('base64')}`;

const EYEBROW = 'CONVERTISSEUR &middot; 230V';
const TOTAL = 6;

// Slides 2..6 (slide 1 is the cover image already generated).
const slides = [
  {
    n: 2,
    title: "C'est quoi\nun convertisseur ?",
    bullets: [
      'Il transforme le <b>12V</b> de ta batterie en <b>230V</b> &mdash; le courant « comme à la maison ».',
      'Sans lui : pas de cafetière, pas de micro-ondes, pas de chargeur d&rsquo;ordi.',
    ],
    callout: { accent: '#2dd4bf', big: '12V&nbsp;&rarr;&nbsp;230V', label: 'Courant continu → alternatif' },
  },
  {
    n: 3,
    title: 'Sinus pur\nou modifié ?',
    bullets: [
      '<b>Onde pure</b> = copie du réseau. Obligatoire pour moteurs, électronique sensible, CPAP médical.',
      '<b>Onde modifiée</b> = moins chère, mais fait chauffer et peut abîmer tes appareils.',
    ],
    callout: { accent: '#4ade80', big: '✅ Choisis le sinus pur', label: 'La sécurité avant le prix' },
  },
  {
    n: 4,
    title: 'Dimensionne\nsans te tromper',
    bullets: [
      'Additionne les appareils que tu utilises <b>EN MÊME TEMPS</b>.',
      'Multiplie le total par <b>1,25</b> de marge. Ni plus, ni moins.',
    ],
    callout: { accent: '#f0a030', big: 'Cafetière 1200 W → ~1500 W', label: 'Conso simultanée × 1,25' },
  },
  {
    n: 5,
    title: 'Le piège\nde la batterie',
    bullets: [
      'Une cafetière 1200 W tire <b>111 A</b> du 12V.',
      '= <b>5,5 Ah par café</b>. ×3/jour + frigo + … ça grimpe très vite.',
    ],
    callout: { accent: '#f0a030', big: '≈ 200 Ah lithium minimum', label: 'Pour suivre le rythme' },
  },
  {
    n: 6,
    title: '1500 W :\nle bon choix',
    bullets: [
      'Pour un van classique, <b>1500 W continu</b> en sinus pur couvre 90% des cas.',
      'Surdimensionner = payer plus cher et vider ta batterie pour rien.',
    ],
    cta: true,
    showProduct: true,
  },
];

const dots = (active) =>
  Array.from({ length: TOTAL }, (_, i) =>
    `<span class="dot${i + 1 === active ? ' on' : ''}"></span>`).join('');

const bulletHtml = (b) => b.map((t) => `<li>${t}</li>`).join('');

function slideHtml(s) {
  const calloutBlock = s.callout ? `
    <div class="callout" style="border-left-color:${s.callout.accent}">
      <div class="callout-big" style="color:${s.callout.accent}">${s.callout.big}</div>
      <div class="callout-label">${s.callout.label}</div>
    </div>` : '';
  const ctaBlock = s.cta ? `
    <div class="cta">
      <div class="cta-line">Calcule ton autonomie réelle</div>
      <div class="cta-url">app.offroadwatt.com</div>
    </div>` : '';
  const productBlock = s.showProduct ? `<img class="prod" src="${product}" alt="">` : '';
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1350px;background:#090b0a;font-family:'DM Sans',sans-serif;position:relative;overflow:hidden;
  padding:88px 80px 76px;display:flex;flex-direction:column;}
.glow-tr{position:absolute;top:-180px;right:-160px;width:620px;height:620px;border-radius:50%;
  background:radial-gradient(circle,rgba(45,212,191,0.16) 0%,rgba(45,212,191,0.05) 45%,transparent 72%);z-index:0;}
.glow-bl{position:absolute;bottom:-220px;left:-160px;width:560px;height:560px;border-radius:50%;
  background:radial-gradient(circle,rgba(240,160,48,0.10) 0%,rgba(240,160,48,0.03) 50%,transparent 74%);z-index:0;}
.bolt{position:absolute;right:70px;bottom:150px;font-size:300px;line-height:1;color:rgba(240,160,48,0.05);z-index:0;
  font-family:'Space Mono',monospace;}
.wrap{position:relative;z-index:2;display:flex;flex-direction:column;height:100%;}
.head{display:flex;justify-content:space-between;align-items:center;}
.eyebrow{font-family:'Space Mono',monospace;font-weight:700;color:#2dd4bf;text-transform:uppercase;letter-spacing:2.5px;font-size:21px;}
.num{font-family:'Space Mono',monospace;font-weight:700;color:#f0a030;font-size:21px;letter-spacing:1px;}
.accent{width:72px;height:4px;background:#f0a030;border-radius:2px;margin-top:26px;}
.title{font-family:'Space Mono',monospace;font-weight:700;color:#eef6ee;font-size:78px;line-height:1.08;
  letter-spacing:-1px;margin-top:40px;white-space:pre-line;}
.body{margin-top:46px;flex:1;}
ul{list-style:none;}
li{position:relative;padding-left:42px;color:#cde0cf;font-size:35px;line-height:1.45;margin-bottom:30px;max-width:880px;font-weight:400;}
li:before{content:'›';position:absolute;left:0;top:-2px;color:#f0a030;font-family:'Space Mono',monospace;font-weight:700;font-size:38px;}
li b{color:#ffffff;font-weight:700;}
.callout{background:#11160f;border:1px solid #2a3830;border-left:5px solid #f0a030;border-radius:12px;
  padding:30px 34px;margin-top:8px;max-width:880px;}
.callout-big{font-family:'Space Mono',monospace;font-weight:700;font-size:40px;letter-spacing:-0.5px;}
.callout-label{font-family:'DM Sans',sans-serif;color:#7a9985;font-size:23px;margin-top:8px;}
.cta{background:#11160f;border:1px solid #2a3830;border-left:5px solid #2dd4bf;border-radius:12px;
  padding:30px 34px;margin-top:8px;max-width:880px;}
.cta-line{font-family:'Space Mono',monospace;font-weight:700;color:#eef6ee;font-size:36px;letter-spacing:-0.5px;}
.cta-url{font-family:'DM Sans',sans-serif;color:#f0a030;font-weight:700;font-size:30px;margin-top:6px;letter-spacing:0.5px;}
.prod{position:absolute;right:60px;bottom:150px;width:430px;z-index:1;
  filter:drop-shadow(0 18px 40px rgba(0,0,0,0.55)) brightness(1.03);}
.foot{display:flex;justify-content:space-between;align-items:center;margin-top:30px;}
.wordmark{font-family:'Space Mono',monospace;font-weight:700;color:rgba(221,238,221,0.85);font-size:21px;letter-spacing:0.5px;}
.wordmark em{font-style:normal;color:#4a6455;}
.dots{display:flex;gap:10px;}
.dot{width:10px;height:10px;border-radius:50%;background:#2a3830;}
.dot.on{width:30px;border-radius:5px;background:#f0a030;}
.swipe{font-family:'Space Mono',monospace;color:#7a9985;font-size:20px;letter-spacing:1px;}
</style></head><body>
<div class="glow-tr"></div><div class="glow-bl"></div>
<div class="bolt">⚡</div>
${productBlock}
<div class="wrap">
  <div class="head"><div class="eyebrow">${EYEBROW}</div><div class="num">0${s.n} / 0${TOTAL}</div></div>
  <div class="accent"></div>
  <div class="title">${s.title}</div>
  <div class="body"><ul>${bulletHtml(s.bullets)}</ul>${calloutBlock}${ctaBlock}</div>
  <div class="foot">
    <div class="wordmark">Offroad<em>Watt</em></div>
    <div class="dots">${dots(s.n)}</div>
    <div class="swipe">${s.n < TOTAL ? 'swipe →' : '@offroadwatt'}</div>
  </div>
</div>
</body></html>`;
}

const browser = await puppeteer.launch({
  headless: true, executablePath: CHROME,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
});
mkdirSync(DIR, { recursive: true });
for (const s of slides) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });
  await page.setContent(slideHtml(s), { waitUntil: 'networkidle0' });
  const out = resolve(DIR, `carousel-0${s.n}.png`);
  await page.screenshot({ path: out, type: 'png' });
  await page.close();
  console.log(`✓ carousel-0${s.n}.png`);
}
await browser.close();
console.log('Done — content slides generated.');
