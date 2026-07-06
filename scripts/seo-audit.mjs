#!/usr/bin/env node
/**
 * OffroadWatt — SEO audit
 * Static, dependency-free checker for the blog articles under landing/blog/.
 * Verifies on-page SEO best practices and exits non-zero if any check fails,
 * so the article-generation pipeline can loop "improve → re-audit" until green.
 *
 * Usage: node scripts/seo-audit.mjs
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BLOG = join(ROOT, 'landing', 'blog');

const C = { green: '\x1b[32m', red: '\x1b[31m', dim: '\x1b[2m', bold: '\x1b[1m', reset: '\x1b[0m' };
const ok = (m) => console.log(`  ${C.green}✓${C.reset} ${m}`);
const ko = (m) => console.log(`  ${C.red}✗ ${m}${C.reset}`);

// Recursively collect article html files (skip the hub index.html).
function htmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...htmlFiles(p));
    else if (name.endsWith('.html') && name !== 'index.html') out.push(p);
  }
  return out;
}

let failures = 0;
const between = (s, a, b) => s !== undefined && s.length >= a && s.length <= b;
const get = (re, html) => { const m = html.match(re); return m ? m[1].trim() : undefined; };

function audit(file) {
  const html = readFileSync(file, 'utf8');
  const rel = relative(ROOT, file);
  console.log(`\n${C.bold}${rel}${C.reset}`);
  let fileFail = 0;
  const check = (cond, pass, fail) => { if (cond) ok(pass); else { ko(fail); fileFail++; } };

  const title = get(/<title>([^<]*)<\/title>/i, html);
  check(between(title, 15, 65), `<title> ok (${title?.length} chars)`, `<title> length should be 15–65 chars (got ${title?.length ?? 'none'})`);

  // Delimiter-aware: content may contain the opposite quote char (e.g. an apostrophe).
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=(["'])([\s\S]*?)\1/i);
  const desc = descMatch ? descMatch[2].trim() : undefined;
  check(between(desc, 70, 165), `meta description ok (${desc?.length} chars)`, `meta description should be 70–165 chars (got ${desc?.length ?? 'none'})`);

  check(/rel=["']canonical["']/.test(html), 'canonical present', 'missing <link rel="canonical">');

  const hreflangs = (html.match(/hreflang=["'][^"']+["']/gi) || []).length;
  check(hreflangs >= 4, `hreflang alternates present (${hreflangs})`, `expected >=4 hreflang links incl. x-default (got ${hreflangs})`);
  check(/hreflang=["']x-default["']/.test(html), 'hreflang x-default present', 'missing hreflang x-default');

  check(/property=["']og:title["']/.test(html) && /property=["']og:image["']/.test(html) && /property=["']og:url["']/.test(html), 'Open Graph tags present', 'incomplete Open Graph tags (need og:title, og:image, og:url)');
  check(/name=["']twitter:card["']/.test(html), 'Twitter card present', 'missing twitter:card');

  const h1 = (html.match(/<h1[\s>]/gi) || []).length;
  check(h1 === 1, 'exactly one <h1>', `expected exactly one <h1> (got ${h1})`);

  const h2 = (html.match(/<h2[\s>]/gi) || []).length;
  check(h2 >= 2, `headings structured (${h2} <h2>)`, `expected >=2 <h2> sections (got ${h2})`);

  check(/<html\s+lang=["'][a-z]{2}["']/i.test(html), 'html lang attribute set', 'missing <html lang="..">');

  const types = (html.match(/"@type":\s*"([^"]+)"/g) || []).join(' ');
  check(/"Article"|"BlogPosting"/.test(types), 'Article JSON-LD present', 'missing Article/BlogPosting JSON-LD');
  check(/"BreadcrumbList"/.test(types), 'BreadcrumbList JSON-LD present', 'missing BreadcrumbList JSON-LD');
  check(/"FAQPage"/.test(types), 'FAQPage JSON-LD present', 'missing FAQPage JSON-LD');

  // Every in-body <img> needs a non-empty alt. The hero now lives only on the
  // blog hub + as og:image (enforced by the Open Graph check above), so an
  // article body with zero <img> is valid as long as nothing lacks alt text.
  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  const noAlt = imgs.filter(t => !/\balt=["'][^"']+["']/.test(t)).length;
  check(noAlt === 0, `images have alt text (${imgs.length} in-body)`, `${noAlt} image(s) missing alt text`);

  // Internal link to the app (conversion path).
  check(/app\.offroadwatt\.com|offroad-watt\.vercel\.app/.test(html), 'internal link to the app present', 'no internal link to the app (conversion path)');

  // JSON-LD blocks must be valid JSON.
  const blocks = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  let jsonOk = true;
  for (const b of blocks) { try { JSON.parse(b[1]); } catch { jsonOk = false; } }
  check(blocks.length > 0 && jsonOk, `JSON-LD valid (${blocks.length} blocks)`, 'one or more JSON-LD blocks are invalid JSON');

  // Rough word count — thin content hurts ranking.
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
  const words = (text.match(/\S+/g) || []).length;
  check(words >= 600, `word count ok (~${words} words)`, `content looks thin (~${words} words, want >=600)`);

  // Freshness signal: a visible, localized "updated" date (class="art-updated").
  check(/class=["']art-updated["']/.test(html), 'visible freshness date present', 'no visible "updated" freshness date (run scripts/gen-freshness.mjs)');

  // E-E-A-T: a named Person author (not the Organization) in the Article JSON-LD.
  check(/"author":\s*\{\s*"@type":\s*"Person"/.test(html), 'named Person author present', 'author is not a named Person (run scripts/gen-author.mjs)');

  failures += fileFail;
  return fileFail;
}

// Audit the marketing homepage (landing/index.html) — the highest-authority URL.
function auditHome() {
  const file = join(ROOT, 'landing', 'index.html');
  if (!existsSync(file)) { console.log(`\n${C.bold}landing/index.html${C.reset}`); ko('homepage not found'); failures++; return; }
  const html = readFileSync(file, 'utf8');
  console.log(`\n${C.bold}landing/index.html (homepage)${C.reset}`);
  const check = (cond, pass, fail) => { if (cond) ok(pass); else { ko(fail); failures++; } };
  check(/rel=["']canonical["']/.test(html), 'canonical present', 'missing <link rel="canonical">');
  check(/property=["']og:image["']/.test(html), 'og:image present', 'missing og:image');
  check(/property=["']og:url["']/.test(html), 'og:url present', 'missing og:url');
  check(/name=["']twitter:card["']/.test(html), 'twitter:card present', 'missing twitter:card');
  check(/"@type":\s*"Organization"/.test(html), 'Organization JSON-LD present', 'missing Organization JSON-LD');
  check(/"@type":\s*"WebSite"/.test(html), 'WebSite JSON-LD present', 'missing WebSite JSON-LD');
  check(/"@type":\s*"(Web|Software)Application"/.test(html), 'App JSON-LD present', 'missing WebApplication/SoftwareApplication JSON-LD');
  check(/"@type":\s*"FAQPage"/.test(html), 'FAQPage JSON-LD present', 'missing FAQPage JSON-LD');
  const blocks = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  let jsonOk = blocks.length > 0;
  for (const b of blocks) { try { JSON.parse(b[1]); } catch { jsonOk = false; } }
  check(jsonOk, `JSON-LD valid (${blocks.length} blocks)`, 'one or more JSON-LD blocks are invalid JSON');
}

// Audit the app shell (index.html) — a client-rendered SPA that must be indexable.
function auditApp() {
  const file = join(ROOT, 'index.html');
  if (!existsSync(file)) { console.log(`\n${C.bold}index.html${C.reset}`); ko('app shell not found'); failures++; return; }
  const html = readFileSync(file, 'utf8');
  console.log(`\n${C.bold}index.html (app)${C.reset}`);
  const check = (cond, pass, fail) => { if (cond) ok(pass); else { ko(fail); failures++; } };
  const noindex = /name=["']robots["'][^>]*noindex/i.test(html);
  check(/rel=["']canonical["']/.test(html) || noindex, 'app canonical or explicit noindex', 'app has neither canonical nor noindex directive');
  check(/property=["']og:image["']/.test(html) || noindex, 'og:image present', 'missing og:image');
  check(/"@type":\s*"(Web|Software)Application"/.test(html) || noindex, 'App JSON-LD present', 'missing WebApplication/SoftwareApplication JSON-LD');
  // Crawlable fallback: a client-rendered SPA needs static text (an <h1>) inside #root
  // so non-JS crawlers (and AI answer engines) index what the tool is.
  const root = html.match(/<div[^>]*id=["']root["'][^>]*>([\s\S]*?)<\/div>\s*<script/i);
  check((root && /<h1[\s>]/i.test(root[1])) || noindex, 'static crawlable <h1> in #root', 'no static <h1> inside #root (SPA content not crawlable)');
}

console.log(`${C.bold}OffroadWatt SEO audit${C.reset} ${C.dim}— ${BLOG}${C.reset}`);

if (!existsSync(BLOG)) { console.error('No blog directory found.'); process.exit(1); }
const files = htmlFiles(BLOG);
if (files.length === 0) { console.error('No article files found.'); process.exit(1); }

// Sitemap sanity: every article URL should be listed.
const sitemapPath = join(ROOT, 'landing', 'sitemap.xml');
const sitemap = existsSync(sitemapPath) ? readFileSync(sitemapPath, 'utf8') : '';

for (const f of files) audit(f);

auditHome();
auditApp();

console.log(`\n${C.bold}Sitemap${C.reset}`);
for (const f of files) {
  const slug = relative(BLOG, f).replace(/\.html$/, '');
  const inMap = sitemap.includes('/blog/' + slug);
  if (inMap) ok(`/blog/${slug} listed in sitemap`);
  else { ko(`/blog/${slug} missing from sitemap.xml`); failures++; }
}

console.log('');
if (failures === 0) {
  console.log(`${C.green}${C.bold}ALL GREEN — ${files.length} article(s) passed every SEO check.${C.reset}`);
  process.exit(0);
} else {
  console.log(`${C.red}${C.bold}${failures} check(s) failed — improve and re-run.${C.reset}`);
  process.exit(1);
}
