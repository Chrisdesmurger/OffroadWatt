#!/usr/bin/env node
/**
 * OffroadWatt — named editorial author (E-E-A-T).
 *
 * Attaches a consistent, transparent editorial byline to every blog article:
 *   - Article JSON-LD `author` → a `Person` node (was `Organization`)
 *   - <meta name="author">      → the persona name
 *   - visible byline "By/Par/Por OffroadWatt" → the persona, linked to the
 *     author bio at /about#author
 *
 * AUTHOR is the single source of truth — change the name/bio here (and the
 * matching section in landing/about.html) to rebrand the byline everywhere.
 * The persona is a disclosed pen name for the OffroadWatt editorial team, not a
 * fabricated individual: /about#author states this plainly. No fake photo or
 * credentials.
 *
 * Idempotent. Usage: node scripts/gen-author.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BLOG = join(ROOT, 'landing', 'blog');

const AUTHOR = {
  name: 'Camille Aubert',
  url: 'https://offroadwatt.com/about#author',
  // Localized "By" prefix for the visible byline.
  by: { en: 'By', fr: 'Par', es: 'Por' },
};

// Person object injected as the article author (kept lean; full Person node with
// knowsAbout/description lives on /about#author).
const PERSON = `{ "@type": "Person", "name": "${AUTHOR.name}", "url": "${AUTHOR.url}", "worksFor": { "@type": "Organization", "name": "OffroadWatt", "url": "https://offroadwatt.com" } }`;

const OLD_AUTHOR_JSONLD = '"author": { "@type": "Organization", "name": "OffroadWatt", "url": "https://offroadwatt.com" }';
const NEW_AUTHOR_JSONLD = `"author": ${PERSON}`;

function lang(file) {
  return /\/blog\/fr\//.test(file) ? 'fr' : /\/blog\/es\//.test(file) ? 'es' : 'en';
}

function htmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    if (name.isDirectory()) out.push(...htmlFiles(join(dir, name.name)));
    else if (name.name.endsWith('.html') && name.name !== 'index.html') out.push(join(dir, name.name));
  }
  return out;
}

let n = 0;
for (const file of htmlFiles(BLOG)) {
  let html = readFileSync(file, 'utf8');
  const before = html;
  const l = lang(file);

  // 1) Article JSON-LD author → Person
  html = html.replace(OLD_AUTHOR_JSONLD, NEW_AUTHOR_JSONLD);

  // 2) <meta name="author">
  html = html.replace(/<meta name="author" content="OffroadWatt">/,
    `<meta name="author" content="${AUTHOR.name}">`);

  // 3) Visible byline → linked persona (idempotent: skip if already applied)
  const by = AUTHOR.by[l];
  if (!html.includes(`class="byline-author"`)) {
    html = html.replace(
      new RegExp(`<span>${by} OffroadWatt</span>`),
      `<span>${by} <a href="/about#author" class="byline-author">${AUTHOR.name}</a></span>`
    );
  }

  if (html !== before) { writeFileSync(file, html); n++; }
}
console.log(`✓ author byline (${AUTHOR.name}) applied to ${n} articles`);
