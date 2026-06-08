# Recap — Blog article: "How to calculate your campervan battery autonomy"

**Date:** 2026-06-08 · **Branch:** `claude/exciting-cerf-P5tfT` · **Status:** ✅ SEO audit ALL GREEN

This article was generated, audited, translated into 3 languages and prepared for social
media by the `seo-article` pipeline. This file is internal (lives in `marketing/`, **not**
deployed with the site).

---

## 1. Published pages (after this branch is merged + deployed)

| Lang | Primary keyword | URL |
|------|-----------------|-----|
| 🇬🇧 EN | *calculate campervan battery autonomy* | https://www.offroadwatt.com/blog/how-to-calculate-campervan-battery-autonomy |
| 🇫🇷 FR | *calculer autonomie batterie camping-car* | https://www.offroadwatt.com/blog/fr/calculer-autonomie-batterie-camping-car |
| 🇪🇸 ES | *calcular autonomía batería autocaravana* | https://www.offroadwatt.com/blog/es/calcular-autonomia-bateria-autocaravana |
| Hub | — | https://www.offroadwatt.com/blog |

Each page links to the other two via `hreflang` + the in-nav language switcher. EN is `x-default`.

---

## 2. SEO checklist — all green

Run `node scripts/seo-audit.mjs` to re-verify. Every article passes:

- ✅ `<title>` 15–65 chars, unique per language
- ✅ `<meta description>` 70–165 chars, unique per language
- ✅ Canonical + 4 hreflang alternates (en/fr/es + x-default)
- ✅ Open Graph + Twitter Card (`summary_large_image`)
- ✅ One `<h1>`, 7 `<h2>` sections, correct `<html lang>`
- ✅ JSON-LD: Article + BreadcrumbList + FAQPage (valid JSON)
- ✅ All images have alt text; ~1000 words; internal CTA to `app.offroadwatt.com`
- ✅ All 3 URLs registered in `sitemap.xml` with hreflang

### Post-deploy verification (do once Vercel has deployed `landing/`)
1. Confirm each URL returns **200** (was 404 before this PR).
2. **Google indexing is NOT instant** — a brand-new URL takes days to appear. To accelerate:
   - Submit `https://www.offroadwatt.com/sitemap.xml` in **Google Search Console**.
   - Use **URL Inspection → Request indexing** for each of the 3 URLs.
   - A few days later, `site:offroadwatt.com calculate campervan battery autonomy` confirms indexing.
3. Validate rich results: https://search.google.com/test/rich-results (Article + FAQ should show).

---

## 3. Brand & visual assets (Canva)

All visuals follow **`marketing/BRAND.md`** — the single source of truth (palette, fonts,
wordmark, motif, per-platform sizes) derived from the vitrine + app, so every image is
coherent across platforms. No OffroadWatt Canva brand kit exists yet (only unrelated kits on
the account), so the brand spec is embedded in each generation prompt; create one in Canva and
the pipeline will use its `brand_kit_id` automatically.

Generated PNGs are committed; the editable Canva designs are linked below (permanent — re-export anytime).

| Asset | File | Size | Canva edit link |
|-------|------|------|-----------------|
| Blog hero / og:image | `landing/blog/assets/battery-autonomy-hero.png` | 1280×720 | https://www.canva.com/d/WuMW9YU_u_H8Olf |
| Instagram | `marketing/social/instagram-battery-autonomy.png` | 1080×1350 | https://www.canva.com/d/pBaflTD-V9UUuJc |
| Facebook | `marketing/social/facebook-battery-autonomy.png` | 1080×1080 | https://www.canva.com/d/QbvGwh-IIqI3hp6 |

The blog hero is wired into the EN article (`hero-img`, `og:image`, `twitter:image`, JSON-LD `image`)
and the blog hub card.

> ⚠️ **Before posting:** the Instagram image footer shows Canva's placeholder `reallygreatsite.com`.
> Open the Canva edit link and replace it with `app.offroadwatt.com` (or remove it), then re-export.

---

## 4. Ready-to-post copy

### Instagram (link in bio → blog article)
**EN:** ⚡ Running out of power on day 2 of a trip? Never again. Our new guide breaks down the exact 4-step formula to calculate your campervan's battery autonomy — consumption, usable capacity, solar + alternator. Free calculator in bio 🔋🚐
`#vanlife #campervan #motorhome #offgrid #solarpower #lifepo4 #vanbuild #rvlife #boondocking #campervanconversion`

**FR:** ⚡ En panne de batterie dès la 2ᵉ nuit ? Plus jamais. Notre nouveau guide détaille la formule exacte en 4 étapes pour calculer l'autonomie batterie de ton camping-car — conso, capacité utile, solaire + alternateur. Calculateur gratuit en bio 🔋🚐
`#vanlife #campingcar #fourgonamenage #vanamenage #autonomie #panneausolaire #lifepo4 #voyageenvan`

**ES:** ⚡ ¿Sin batería en la 2ª noche del viaje? Nunca más. Nuestra nueva guía explica la fórmula exacta en 4 pasos para calcular la autonomía de tu autocaravana — consumo, capacidad útil, solar + alternador. Calculadora gratis en bio 🔋🚐
`#vanlife #autocaravana #furgoneta #campervan #autonomia #placasolar #lifepo4 #findesemana`

### Facebook (link post → blog article)
**EN:** How many days can your campervan really run off-grid? 🔋 Most people guess — and guess wrong. This guide gives you the exact 4-step formula (consumption → usable capacity → solar & alternator → autonomy in days), a worked example, and a free calculator that does it all for you. 👉 [EN article URL]

**FR:** Combien de jours ton camping-car tient-il vraiment en autonomie ? 🔋 La plupart des gens estiment au doigt mouillé — et se trompent. Ce guide donne la formule exacte en 4 étapes (conso → capacité utile → solaire & alternateur → autonomie en jours), un exemple chiffré et un calculateur gratuit. 👉 [FR article URL]

**ES:** ¿Cuántos días aguanta tu autocaravana sin enchufe? 🔋 La mayoría lo calcula a ojo — y se equivoca. Esta guía te da la fórmula exacta en 4 pasos (consumo → capacidad útil → solar y alternador → autonomía en días), un ejemplo práctico y una calculadora gratis. 👉 [ES article URL]

---

## 5. Prerequisites & next actions (for you)

- [ ] Merge this PR → Vercel auto-deploys `landing/` (the blog goes live).
- [ ] Fix the Instagram image URL footer in Canva (see warning above), re-export, replace the PNG.
- [ ] Submit the sitemap + request indexing in Google Search Console.
- [ ] Schedule the 3 social posts (use the copy above; Instagram = link in bio).
- [ ] Optional: add a Story (1080×1920) — re-run the Canva step with `your_story`.

## 6. To automate this every trigger
This whole flow is encapsulated in the `seo-article` skill (`.claude/skills/seo-article/`).
Invoke it with `/seo-article`, or wire a **Claude Code on the web scheduled trigger** that runs
`/seo-article` so a fresh, audited, translated article ships on each run.
See https://code.claude.com/docs/en/claude-code-on-the-web.
