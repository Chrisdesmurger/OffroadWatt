// OffroadWatt demo recorder — drives the real app and captures a numbered PNG
// sequence (frame-by-frame, deterministic pacing). Assemble with encode.sh.
//
//   MODE=desktop OUTDIR=.demo-tmp/seq_desktop node record.mjs
//   MODE=mobile  OUTDIR=.demo-tmp/seq_mobile  node record.mjs
//
// Requires: `npm run preview` serving the built app on http://127.0.0.1:4173/
// and `playwright-core` installed. See ../SKILL.md for the full runbook.

import { chromium } from 'playwright-core';
import { mkdirSync, rmSync } from 'fs';

const MODE = process.env.MODE || 'desktop';
const DIR  = process.env.OUTDIR || `.demo-tmp/seq_${MODE}`;
const URL  = process.env.APP_URL || 'http://127.0.0.1:4173/';
const EXE  = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
rmSync(DIR, { recursive: true, force: true }); mkdirSync(DIR, { recursive: true });
const VP = MODE === 'mobile' ? { width: 390, height: 844 } : { width: 1280, height: 720 };

// ── Mock catalog: appliances injected into the "add from catalog" flow.
// Effective watts (no modes) → exact totals. Edit for a new scenario.
const CATALOG = [
  { name: 'Laptop',                icon: '💻', watts: 65,  hours: 4,    category: 'Tech',      brand: 'Dell' },
  { name: 'Smartphone ×2',         icon: '📱', watts: 15,  hours: 3,    category: 'Tech',      brand: 'Samsung' },
  { name: '4G router',             icon: '📶', watts: 10,  hours: 24,   category: 'Tech',      brand: 'Netgear' },
  { name: 'Water pump',            icon: '🚰', watts: 50,  hours: 0.5,  category: 'Eau',       brand: 'Shurflo' },
  { name: 'Microwave',             icon: '🍽️', watts: 900, hours: 0.25, category: 'Cuisine',   brand: 'Whirlpool' },
  { name: 'Dometic RDC 70',        icon: '🧊', watts: 5,   hours: 24,   category: 'Cuisine',   brand: 'Dometic' },
  { name: 'Recessed LED spots ×4', icon: '💡', watts: 20,  hours: 4,    category: 'Éclairage', brand: 'Hella' },
  { name: '5m LED strip lighting', icon: '🔆', watts: 12,  hours: 5,    category: 'Éclairage', brand: 'Osram' },
  { name: 'Truma Combi 4',         icon: '🔥', watts: 15,  hours: 24,   category: 'Confort',   brand: 'Truma' },
  { name: 'MPPT regulator',        icon: '⚡', watts: 5,   hours: 24,   category: 'Système',   brand: 'Victron' },
  { name: 'Lithium battery BMS',   icon: '🔋', watts: 3,   hours: 24,   category: 'Système',   brand: 'Victron' },
];

const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const ctx = await b.newContext({ viewport: VP, deviceScaleFactor: MODE === 'mobile' ? 2 : 1,
  isMobile: MODE === 'mobile', hasTouch: MODE === 'mobile' });
const p = await ctx.newPage();
await p.route(/equipment_catalog/i, r => r.fulfill({ status: 200, contentType: 'application/json',
  headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(CATALOG) }));
await p.goto(URL, { waitUntil: 'load', timeout: 40000 });
await p.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
await p.waitForTimeout(1200);

// dismiss onboarding wizard + cookie banner
let el = await p.$('#wiz-skip'); if (el) { await el.click().catch(() => {}); await p.waitForTimeout(250); }
el = await p.$('text=Accept'); if (el) { await el.click().catch(() => {}); await p.waitForTimeout(250); }
// empty the appliance list (off-camera)
for (let i = 0; i < 40; i++) { const d = await p.$('.delbtn'); if (!d) break; await d.click().catch(() => {}); await p.waitForTimeout(90); }

// cursor (desktop) / tap-ripple styles
await p.evaluate((mode) => {
  const st = document.createElement('style');
  st.textContent = '@keyframes pg{from{transform:scale(1);opacity:.9}to{transform:scale(4.2);opacity:0}}';
  document.head.appendChild(st);
  window.__ping = (x, y) => { const r = document.createElement('div');
    r.style.cssText = 'position:fixed;z-index:2147483646;left:' + x + 'px;top:' + y + 'px;width:14px;height:14px;margin:-7px;border:2px solid #2dd4bf;border-radius:50%;pointer-events:none;animation:pg .5s ease-out forwards';
    document.body.appendChild(r); setTimeout(() => r.remove(), 520); };
  if (mode !== 'mobile') {
    const c = document.createElement('div'); c.id = 'democursor';
    c.style.cssText = 'position:fixed;z-index:2147483647;width:22px;height:22px;margin:-11px 0 0 -11px;pointer-events:none;background:radial-gradient(circle at 35% 35%,#fff 0 3px,#f0a030 4px 9px,rgba(240,160,48,.28) 10px 11px,transparent 12px);border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.55)';
    document.body.appendChild(c);
    window.__cur = (x, y) => { const e = document.getElementById('democursor'); if (e) { e.style.left = x + 'px'; e.style.top = y + 'px'; } };
  }
}, MODE);
await p.evaluate(() => window.scrollTo(0, 0));

// ── helpers ──────────────────────────────────────────────────────────────
let fi = 0; const pad = n => String(n).padStart(5, '0');
async function snap(n = 1) { for (let k = 0; k < n; k++) await p.screenshot({ path: `${DIR}/f${pad(fi++)}.png` }); }
let cx = VP.width / 2, cy = VP.height / 2;
async function moveCursor(x, y, steps = 16) { if (MODE === 'mobile') return;
  const dx = (x - cx) / steps, dy = (y - cy) / steps;
  for (let i = 1; i <= steps; i++) { cx += dx; cy += dy; await p.mouse.move(cx, cy);
    await p.evaluate(([a, b]) => window.__cur && window.__cur(a, b), [Math.round(cx), Math.round(cy)]); await snap(); }
  cx = x; cy = y; }
async function ping(x, y) { await p.evaluate(([a, b]) => window.__ping && window.__ping(a, b), [Math.round(x), Math.round(y)]); }
async function smoothScrollTo(toY) { const from = await p.evaluate(() => window.scrollY); const steps = 12;
  for (let i = 1; i <= steps; i++) { const y = Math.round(from + (toY - from) * i / steps); await p.evaluate(v => window.scrollTo(0, v), y); await snap(); } }
async function center(loc) { const h = await loc.elementHandle(); if (!h) return; const bb = await h.boundingBox(); if (!bb) return;
  const sy = await p.evaluate(() => window.scrollY); await smoothScrollTo(Math.max(0, Math.round(sy + bb.y - VP.height / 2 + bb.height / 2))); }
async function tap(loc, { scroll = true } = {}) { if (scroll) await center(loc); const bb = await loc.boundingBox(); if (!bb) throw new Error('no box');
  const x = Math.round(bb.x + bb.width / 2), y = Math.round(bb.y + bb.height / 2);
  await moveCursor(x, y); await ping(x, y); await snap(2); await loc.click({ timeout: 5000 }).catch(async () => { await p.mouse.click(x, y); }); await snap(2); }
async function type(loc, val) { await center(loc); const bb = await loc.boundingBox(); const x = Math.round(bb.x + bb.width / 2), y = Math.round(bb.y + bb.height / 2);
  await moveCursor(x, y); await ping(x, y); await loc.click().catch(() => {}); await snap(2); await p.keyboard.press('Control+A'); await snap();
  for (const ch of String(val)) { await p.keyboard.type(ch); await snap(); } await p.keyboard.press('Tab'); await snap(2); }
async function hold(n) { await snap(n); }

// ── SCENARIO (edit this block for a new storyline) ────────────────────────
await hold(6);                                                   // empty list
await tap(p.locator('#open-catalog')); await hold(6);            // open catalog
try { await p.locator('.cat-mode-btn', { hasText: /type/i }).first().click({ timeout: 2000 }); await snap(3); } catch (e) {}
for (const d of CATALOG) { await tap(p.locator('.cin', { hasText: d.name }).first(), { scroll: true }); await hold(1); }
await hold(3);
await tap(p.getByText(/Add \d+ item/i).first(), { scroll: false }); await hold(8);   // confirm add
await smoothScrollTo(0); await hold(4);
await tap(p.locator('.btf', { hasText: 'AGM' }).first()); await hold(3);             // battery AGM
await tap(p.locator('.bah', { hasText: '140Ah' }).first()); await hold(4);          // model 140Ah
await tap(p.locator('.nb-btns').getByText('2', { exact: true }).first()); await hold(5); // ×2 parallel
await type(p.locator('#alt-amps'), 50); await hold(2);                               // alternator 50A
await type(p.locator('#alt-hours'), 2); await hold(5);                               // 2h/day
await tap(p.locator('.spo', { hasText: '200' }).first()); await hold(3);            // solar 200 Wc
await type(p.locator('#sol-nb'), 2); await hold(5);                                  // ×2 panels
// zoom on the consumption-detail card + settle (long hold added at encode time)
const card = p.locator('.card').filter({ hasText: 'Total consumed' }).first();
await center(card); await hold(3);
await card.evaluate((el, vw) => {
  const bb = el.getBoundingClientRect(); const dx = Math.round(vw / 2 - (bb.x + bb.width / 2));
  const bd = document.createElement('div'); bd.style.cssText = 'position:fixed;inset:0;background:rgba(5,7,6,.62);z-index:55;pointer-events:none;opacity:0;transition:opacity .45s'; document.body.appendChild(bd);
  el.style.transition = 'transform .5s ease'; el.style.transformOrigin = 'center center'; el.style.zIndex = '60'; el.style.position = 'relative';
  el.style.boxShadow = '0 24px 70px rgba(0,0,0,.7)'; el.style.outline = '2px solid var(--amber)'; el.style.borderRadius = '14px';
  requestAnimationFrame(() => { bd.style.opacity = '1'; el.style.transform = `translateX(${dx}px) scale(1.18)`; });
}, VP.width);
await snap(5); await hold(24);
// ──────────────────────────────────────────────────────────────────────────

console.log('MODE', MODE, 'FRAMES', fi, 'OUT', DIR);
await b.close();
