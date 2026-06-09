# Recap — Blog article: "How many solar panels do you need for a campervan?"

**Date:** 2026-06-08 · **Branch:** `claude/exciting-cerf-ByPPP` · **Status:** ✅ SEO audit ALL GREEN

Generated, audited, translated into 3 languages and prepared for social media by the
`seo-article` pipeline. This file is internal (lives in `marketing/`, **not** deployed with the site).

---

## 1. Published pages (after this branch is merged + deployed)

| Lang | Primary keyword | URL |
|------|-----------------|-----|
| 🇬🇧 EN | *how many solar panels campervan* | https://offroadwatt.com/blog/how-many-solar-panels-campervan |
| 🇫🇷 FR | *combien de panneaux solaires camping-car* | https://offroadwatt.com/blog/fr/combien-panneaux-solaires-camping-car |
| 🇪🇸 ES | *cuántos paneles solares autocaravana* | https://offroadwatt.com/blog/es/cuantos-paneles-solares-autocaravana |
| Hub | — | https://offroadwatt.com/blog |

Each page links to the other two via `hreflang` + the in-nav language switcher. EN is `x-default`.
The article internally cross-links to the first guide (*calculate battery autonomy*) for topical authority.

---

## 2. SEO checklist — all green

Run `node scripts/seo-audit.mjs` to re-verify. All **6** articles (2 topics × EN/FR/ES) pass:

- ✅ `<title>` 15–65 chars, unique per language (57/57/58 for this article)
- ✅ `<meta description>` 70–165 chars, unique per language
- ✅ Canonical + 4 hreflang alternates (en/fr/es + x-default)
- ✅ Open Graph + Twitter Card (`summary_large_image`)
- ✅ One `<h1>`, 8 `<h2>` sections, correct `<html lang>`
- ✅ JSON-LD: Article + BreadcrumbList + FAQPage (valid JSON)
- ✅ All images have alt text; ~1050–1160 words; internal CTA to `app.offroadwatt.com`
- ✅ All 3 new URLs registered in `sitemap.xml` with hreflang

### Keyword research (the "Google check" up front)
SERP for *how many solar panels campervan* / *combien de panneaux solaires camping-car* is dominated
by calculators and sizing guides (EXPLORIST.life, ParkedInParadise, Just4Camper, Solaris). Intent is
**high-volume, commercial, calculator-driven** — a perfect match for OffroadWatt's solar feature. The
article answers the exact question, embeds the real formula and funnels to the free calculator.

### Post-deploy verification (do once Vercel has deployed `landing/`)
1. Confirm each of the 3 URLs returns **200** (they 404 until this PR is merged + deployed).
2. **Google indexing is NOT instant** — a brand-new URL takes days to appear. To accelerate:
   - Submit `https://offroadwatt.com/sitemap.xml` in **Google Search Console**.
   - Use **URL Inspection → Request indexing** for each of the 3 URLs.
   - A few days later, `site:offroadwatt.com how many solar panels campervan` confirms indexing.
3. Validate rich results: https://search.google.com/test/rich-results (Article + FAQ should show).

---

## 3. Brand & visual assets (Canva)

All visuals follow **`marketing/BRAND.md`** and were generated with the **OffroadWatt Canva brand kit**
(`kAHL9oO58mY`) for cross-platform coherence. Generated PNGs are committed; the editable Canva designs
are linked below (permanent — re-export anytime).

| Asset | File | Size | Canva edit link |
|-------|------|------|-----------------|
| Blog hero / og:image (EN) | `landing/blog/assets/solar-panels-hero.png` | 1280×720 | https://www.canva.com/d/OPyxyXgArq0pFRY |
| Blog hero / og:image (FR) | `landing/blog/assets/solar-panels-hero-fr.png` | 1280×720 | https://www.canva.com/d/vTDeIj0gfkc-ZAd |
| Blog hero / og:image (ES) | `landing/blog/assets/solar-panels-hero-es.png` | 1280×720 | https://www.canva.com/d/uJKumdxKtK_t92s |
| Instagram | `marketing/social/instagram-solar-panels.png` | 1080×1350 | https://www.canva.com/d/sgB3L4TGEFmxzQX |
| Facebook | `marketing/social/facebook-solar-panels.png` | 1080×1080 | https://www.canva.com/d/IUAQoq0SBsT8_xW |

Each language has its **own localized hero** (headline translated EN/FR/ES), wired into its article
(`hero-img`, `og:image`, `twitter:image`, JSON-LD `image`) and into the matching blog hub card. All
visuals are on-brand (dark charcoal, van at dusk, correct localized headline) and show the real
`app.offroadwatt.com` URL — no Canva placeholder URLs.

> ℹ️ **Optional polish:** the brand kit rendered the hero/IG accent panels in OffroadWatt green rather
> than amber. If you want amber as the hero accent (per BRAND.md), open the edit links and recolor the
> headline/panel, then re-export at the sizes above and replace the PNGs.

---

## 4. Ready-to-post copy

### Instagram (link in bio → blog article)
**EN:** ☀️ "Just put 200W on the roof" — and then run flat on the first cloudy week. Our new guide gives you the real formula to size your campervan solar: consumption → peak-sun-hours → panel wattage, plus a sizing table by use case. Free calculator in bio 🔋🚐
`#vanlife #campervan #solarpower #offgrid #vanbuild #lifepo4 #motorhome #rvlife #boondocking #vanlifeeurope`

**FR:** ☀️ « Mets 200 W sur le toit » — et tombe en rade dès la première semaine nuageuse. Notre nouveau guide donne la vraie formule pour dimensionner ton solaire de camping-car : conso → heures de plein soleil → puissance, + un tableau par usage. Calculateur gratuit en bio 🔋🚐
`#vanlife #campingcar #fourgonamenage #panneausolaire #autonomie #lifepo4 #vanamenage #voyageenvan`

**ES:** ☀️ «Pon 200 W en el techo» — y te quedas sin batería en la primera semana nublada. Nuestra nueva guía te da la fórmula real para dimensionar el solar de tu autocaravana: consumo → horas de sol pico → potencia, + una tabla por uso. Calculadora gratis en bio 🔋🚐
`#vanlife #autocaravana #furgoneta #placasolar #campervan #autonomia #lifepo4 #furgoneташ`

### Facebook (link post → blog article)
**EN:** How many solar panels does your campervan really need? ☀️ Most people guess "200W" — and it's wrong as often as it's right. This guide gives you the real wattage formula (consumption → peak-sun-hours → panels), a sizing table by use case, the battery-to-solar ratio, and a free calculator that does it for you. 👉 https://offroadwatt.com/blog/how-many-solar-panels-campervan

**FR:** Combien de panneaux solaires pour ton camping-car ? ☀️ La plupart des gens disent « 200 W » — et se trompent une fois sur deux. Ce guide donne la vraie formule (conso → heures de plein soleil → panneaux), un tableau par usage, le ratio batterie/solaire et un calculateur gratuit. 👉 https://offroadwatt.com/blog/fr/combien-panneaux-solaires-camping-car

**ES:** ¿Cuántos paneles solares necesita tu autocaravana? ☀️ La mayoría dice «200 W» — y se equivoca la mitad de las veces. Esta guía te da la fórmula real (consumo → horas de sol pico → paneles), una tabla por uso, el ratio batería/solar y una calculadora gratis. 👉 https://offroadwatt.com/blog/es/cuantos-paneles-solares-autocaravana

---

## 5. Prerequisites & next actions (for you)

- [ ] Merge this PR → Vercel auto-deploys `landing/` (the new article goes live).
- [ ] Submit the sitemap + request indexing for the 3 new URLs in Google Search Console.
- [ ] Schedule the 3 social posts (use the copy above; Instagram = link in bio).
- [ ] Optional: recolor the hero/IG accent to amber in Canva (see note in §3), re-export, replace PNGs.
- [ ] Optional: add a Story (1080×1920) — re-run the Canva step with `your_story`.

## 6. To automate this every trigger
This whole flow is encapsulated in the `seo-article` skill (`.claude/skills/seo-article/SKILL.md`).
Invoke it with `/seo-article`, or wire a **Claude Code on the web scheduled trigger** that runs
`/seo-article` so a fresh, audited, translated article ships on each run.
See https://code.claude.com/docs/en/claude-code-on-the-web.
