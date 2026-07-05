#!/usr/bin/env node
/**
 * OffroadWatt — freshness signals.
 * Sets a real dateModified on every blog article (JSON-LD + article:modified_time)
 * and surfaces a visible, localized "Updated" date in the article meta line.
 * Freshness is a genuine ranking + AI-Overview factor; the articles were revised
 * (internal-linking pass), so bumping the modified date is legitimate.
 *
 * Edit MODIFIED below when you next do a real content review, then re-run.
 * Idempotent: the visible marker carries class="art-updated" and is regenerated
 * in place, so re-running never duplicates it.
 *
 * Usage: node scripts/gen-freshness.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BLOG = join(ROOT, 'landing', 'blog');

const MODIFIED = '2026-07-05';
const LABEL = {
  en: 'Updated Jul 5, 2026',
  fr: 'Mis à jour le 5 juil. 2026',
  es: 'Actualizado el 5 jul. 2026',
};

function htmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...htmlFiles(p));
    else if (name.endsWith('.html') && name !== 'index.html') out.push(p);
  }
  return out;
}

const langOf = (p) => (/\/fr\//.test(p) ? 'fr' : /\/es\//.test(p) ? 'es' : 'en');

let changed = 0, skipped = 0;
for (const file of htmlFiles(BLOG)) {
  const lang = langOf(file);
  let html = readFileSync(file, 'utf8');
  const before = html;

  // 1) JSON-LD dateModified
  html = html.replace(/("dateModified":\s*")[0-9-]+(")/g, `$1${MODIFIED}$2`);
  // 2) Open Graph article:modified_time
  html = html.replace(/(<meta\s+property="article:modified_time"\s+content=")[^"]*(">)/i, `$1${MODIFIED}$2`);

  // 3) Visible "Updated" time in the article meta line (idempotent).
  const updated = `<time class="art-updated" datetime="${MODIFIED}">${LABEL[lang]}</time><span class="dot"></span>`;
  if (/<time class="art-updated"[\s\S]*?<\/time>\s*<span class="dot"><\/span>/.test(html)) {
    html = html.replace(/<time class="art-updated"[\s\S]*?<\/time>\s*<span class="dot"><\/span>/, updated);
  } else {
    // Insert right after the first (published) <time> in the article meta.
    html = html.replace(/(<div class="article-meta">[\s\S]*?<time datetime="[^"]*">[^<]*<\/time>)(\s*<span class="dot"><\/span>)/,
      `$1$2${updated}`);
  }

  if (html !== before) { writeFileSync(file, html); changed++; } else skipped++;
}
console.log(`freshness: ${changed} file(s) updated, ${skipped} unchanged.`);
