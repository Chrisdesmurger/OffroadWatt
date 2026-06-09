# Recap — Blog article: "AGM vs GEL vs Lithium: which leisure battery for a campervan?"

**Date:** 2026-06-09 · **Branch:** `claude/optimistic-gates-xfglfc` · **Status:** ✅ SEO audit ALL GREEN

This article was generated, audited, translated into 3 languages and prepared for social
media. This file is internal (lives in `marketing/`, **not** deployed with the site).

---

## 1. Published pages (after this branch is merged + deployed)

| Lang | Primary keyword | URL |
|------|-----------------|-----|
| 🇬🇧 EN | *AGM vs GEL vs Lithium campervan battery* | https://offroadwatt.com/blog/agm-vs-gel-vs-lithium-campervan-battery |
| 🇫🇷 FR | *AGM GEL lithium quelle batterie camping-car* | https://offroadwatt.com/blog/fr/agm-gel-lithium-quelle-batterie-camping-car |
| 🇪🇸 ES | *AGM GEL litio qué batería autocaravana* | https://offroadwatt.com/blog/es/agm-gel-litio-que-bateria-autocaravana |
| Hub | — | https://offroadwatt.com/blog |

Each page links to the other two via `hreflang` + the in-nav language switcher. EN is `x-default`.

---

## 2. SEO checklist — all green

Run `node scripts/seo-audit.mjs` to re-verify. Every article passes all 17 checks:

- ✅ `<title>` 15–65 chars, unique per language (EN 52 / FR 51 / ES 49)
- ✅ `<meta description>` 70–165 chars, unique per language (EN 154 / FR 158 / ES 149)
- ✅ Canonical + 4 hreflang alternates (en/fr/es + x-default)
- ✅ Open Graph + Twitter Card (`summary_large_image`)
- ✅ One `<h1>`, 8 `<h2>` sections, correct `<html lang>`
- ✅ JSON-LD: Article + BreadcrumbList + FAQPage (valid JSON)
- ✅ All images have alt text; ~1080–1280 words; internal CTA to `app.offroadwatt.com`
- ✅ All 3 URLs registered in `sitemap.xml` with hreflang

> **On the "SEO grade" / Google Search Console request:** there is no live GSC
> connector available in this environment, so the article cannot be queried against
> the real Search Console API from here. The project's own automated grader —
> `scripts/seo-audit.mjs` — is the equivalent gate, and it reports **ALL GREEN**.
> The Google Search Console steps below are the manual actions to run **after**
> the site is deployed (indexing data only exists for live URLs).

### Post-deploy verification in Google Search Console (do once Vercel has deployed `landing/`)
1. Confirm each of the 3 URLs returns **200**.
2. Submit `https://offroadwatt.com/sitemap.xml` in **Google Search Console → Sitemaps**.
3. **URL Inspection → Request indexing** for each of the 3 URLs (indexing a brand-new URL takes days).
4. Validate rich results: https://search.google.com/test/rich-results (Article + FAQ should show).
5. After a few days, `site:offroadwatt.com AGM GEL lithium` confirms indexing; then watch
   the Performance report for impressions/CTR on the target keywords and iterate titles if needed.

---

## 3. Brand & visual assets (Canva)

All visuals follow **`marketing/BRAND.md`** and use the **OffroadWatt Canva brand kit**
(`kAHL9oO58mY`, recorded in `marketing/BRAND.canva.json` — the pipeline now applies it
automatically). All designs live in the Canva folder
**[OffroadWatt — AGM vs GEL vs Lithium](https://www.canva.com/folder/FAHMGh5yBO8)**.

Generated PNGs are committed; the editable Canva designs are linked below (re-export anytime).

| Asset | File | Size | Canva edit link |
|-------|------|------|-----------------|
| Blog hero / og:image | `landing/blog/assets/agm-gel-lithium-hero.png` | 1280×720 | https://www.canva.com/d/qurgI3x6x5FMkdH |
| Instagram post | `marketing/social/instagram-agm-gel-lithium.png` | 1080×1350 | https://www.canva.com/d/4HZGqFXpzRzraWS |
| Facebook post | `marketing/social/facebook-agm-gel-lithium.png` | 1080×1080 | https://www.canva.com/d/B5GGuQePzOezn3i |

The blog hero is wired into all 3 language articles (`hero-img`, `og:image`, `twitter:image`,
JSON-LD `image`) and the blog hub card.

> **Note on the Instagram visual:** the final version leads with a clean "VAN LIFE / POWER GAME"
> headline (the explicit "AGM vs GEL vs Lithium" wording is carried by the caption below). If you
> prefer the topic spelled out on the image, open the edit link and swap the headline text.

---

## 4. Ready-to-post copy

### Instagram (link in bio → blog article)
**EN:** 🔋 AGM, GEL or Lithium — which leisure battery actually wins in a campervan? We compared all three on what matters off-grid: usable capacity, lifespan, weight and real cost per cycle. Spoiler: a 100Ah label means three very different things. Full breakdown + a free calculator in bio ⚡🚐
`#vanlife #campervan #motorhome #offgrid #lifepo4 #leisurebattery #agm #vanbuild #rvlife #boondocking #campervanconversion #solarpower`

**FR:** 🔋 AGM, GEL ou Lithium — quelle batterie de servitude gagne vraiment en camping-car ? On a comparé les trois sur ce qui compte en autonomie : capacité utile, durée de vie, poids et coût réel par cycle. Spoiler : « 100Ah » veut dire trois choses très différentes. Comparatif complet + calculateur gratuit en bio ⚡🚐
`#vanlife #campingcar #fourgonamenage #vanamenage #lifepo4 #batterie #autonomie #agm #voyageenvan #panneausolaire`

**ES:** 🔋 AGM, GEL o Litio — ¿qué batería auxiliar gana de verdad en una autocaravana? Comparamos las tres en lo que importa fuera de la red: capacidad útil, vida útil, peso y coste real por ciclo. Spoiler: «100Ah» significa tres cosas muy distintas. Comparativa completa + calculadora gratis en bio ⚡🚐
`#vanlife #autocaravana #furgoneta #campervan #lifepo4 #bateria #autonomia #agm #findesemana #placasolar`

### Facebook (link post → blog article)
**EN:** AGM, GEL or Lithium? 🔋 Most people overpay for capacity they can never use — because a 100Ah battery is not 100Ah usable. Our new guide compares all three leisure-battery chemistries on usable capacity, lifespan, weight and real cost per cycle, with a worked example and a free calculator that sizes the right one for your van. 👉 https://offroadwatt.com/blog/agm-vs-gel-vs-lithium-campervan-battery

**FR:** AGM, GEL ou Lithium ? 🔋 La plupart des gens paient trop cher une capacité qu'ils n'utiliseront jamais — parce qu'une batterie 100Ah ne fait pas 100Ah utiles. Notre nouveau guide compare les trois technologies de batterie de servitude sur la capacité utile, la durée de vie, le poids et le coût réel par cycle, avec un exemple chiffré et un calculateur gratuit qui dimensionne la bonne pour ton van. 👉 https://offroadwatt.com/blog/fr/agm-gel-lithium-quelle-batterie-camping-car

**ES:** ¿AGM, GEL o Litio? 🔋 La mayoría paga de más por una capacidad que nunca podrá usar — porque una batería de 100Ah no son 100Ah útiles. Nuestra nueva guía compara las tres tecnologías de batería auxiliar en capacidad útil, vida útil, peso y coste real por ciclo, con un ejemplo práctico y una calculadora gratis que dimensiona la adecuada para tu camper. 👉 https://offroadwatt.com/blog/es/agm-gel-litio-que-bateria-autocaravana

---

## 5. Next actions (for you)

- [ ] Merge this PR → Vercel auto-deploys `landing/` (the article goes live).
- [ ] Submit the sitemap + request indexing in Google Search Console (see §2).
- [ ] Schedule the 3 social posts (use the copy above; Instagram = link in bio).
- [ ] Optional: add a Story (1080×1920) — re-run the Canva step with `your_story`.
- [ ] Google Drive: no Drive connector is available in this environment, so the images
      could not be uploaded to a Drive shared folder automatically. They are stored in the
      Canva folder above (shareable) and committed to the repo. To put them on Drive, download
      the 3 PNGs and drop them in a Drive folder, or connect a Google Drive integration.
