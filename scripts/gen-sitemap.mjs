#!/usr/bin/env node
/**
 * OffroadWatt — dynamic sitemap generator.
 *
 * Rebuilds landing/sitemap.xml from the actual pages on disk, using each page's
 * own <head> as the single source of truth:
 *   - <loc>       ← <link rel="canonical">
 *   - hreflang    ← <link rel="alternate" hreflang="…"> cluster
 *   - <lastmod>   ← <meta property="article:modified_time"> if present,
 *                   else the file's last git commit date (YYYY-MM-DD).
 *
 * No <changefreq>/<priority>: Google has ignored them for years and they only
 * add drift. Only <loc>, <lastmod> and the xhtml:link hreflang cluster are kept.
 *
 * Idempotent and deterministic (order is fixed). Re-run after adding pages:
 *   node scripts/gen-sitemap.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LANDING = join(ROOT, 'landing');
const BLOG = join(LANDING, 'blog');
const OUT = join(LANDING, 'sitemap.xml');

// Ordered page set. Everything indexable that lives under landing/, excluding
// admin.html (noindex) and 404.html (not a content page).
function articles(dir) {
  return readdirSync(dir)
    .filter((n) => n.endsWith('.html') && n !== 'index.html')
    .sort()
    .map((n) => join(dir, n));
}
const PAGES = [
  join(LANDING, 'index.html'),        // home
  join(LANDING, 'about.html'),        // about
  join(BLOG, 'index.html'),           // EN hub
  join(BLOG, 'fr', 'index.html'),     // FR hub
  join(BLOG, 'es', 'index.html'),     // ES hub
  ...articles(BLOG),                  // EN articles
  ...articles(join(BLOG, 'fr')),      // FR articles
  ...articles(join(BLOG, 'es')),      // ES articles
];

const attr = (html, re) => (html.match(re) || [])[1];

function gitDate(file) {
  try {
    const d = execSync(`git log -1 --format=%cs -- "${file}"`, { cwd: ROOT })
      .toString()
      .trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  } catch {}
  return new Date().toISOString().slice(0, 10);
}

function pageEntry(file) {
  const html = readFileSync(file, 'utf8');
  const loc = attr(html, /<link rel="canonical" href="([^"]+)"/);
  if (!loc) {
    console.warn(`⚠︎  no canonical, skipping ${file}`);
    return null;
  }
  const modified = attr(html, /<meta property="article:modified_time" content="([^"]+)"/);
  const lastmod = (modified ? modified.slice(0, 10) : gitDate(file));

  // hreflang cluster straight from the page head (already reciprocal & absolute).
  const alts = [...html.matchAll(/<link rel="alternate" hreflang="([a-z-]+)" href="([^"]+)"/g)]
    .map((m) => ({ lang: m[1], href: m[2] }));
  // The home page carries no cluster (single-URL, JS-multilingual) → x-default self.
  if (alts.length === 0) alts.push({ lang: 'x-default', href: loc });

  return { loc, lastmod, alts };
}

const entries = PAGES.map(pageEntry).filter(Boolean);

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
  `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
  entries
    .map(
      (e) =>
        `  <url>\n` +
        `    <loc>${e.loc}</loc>\n` +
        `    <lastmod>${e.lastmod}</lastmod>\n` +
        e.alts
          .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${a.href}"/>\n`)
          .join('') +
        `  </url>`
    )
    .join('\n') +
  `\n</urlset>\n`;

writeFileSync(OUT, xml);
console.log(`✓ sitemap: ${entries.length} URLs → ${OUT.replace(ROOT + '/', '')}`);
