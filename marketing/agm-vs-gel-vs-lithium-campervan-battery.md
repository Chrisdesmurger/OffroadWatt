# Recap — Blog article: "AGM vs GEL vs Lithium: which leisure battery for a campervan?"

**Date:** 2026-06-10 · **Branch:** `claude/fervent-knuth-g4ouii` · **Status:** SEO audit ALL GREEN

Generated, audited, translated into 3 languages and prepared for social media by the
`seo-article` pipeline. This file is internal (lives in `marketing/`, **not** deployed with the site).

---

## 1. Published pages (after this branch is merged + deployed)

| Lang | Primary keyword | URL |
|------|-----------------|-----|
| EN | *AGM vs GEL vs lithium campervan battery* | https://offroadwatt.com/blog/agm-vs-gel-vs-lithium-campervan-battery |
| FR | *AGM GEL lithium batterie camping-car* | https://offroadwatt.com/blog/fr/agm-gel-lithium-batterie-camping-car |
| ES | *AGM GEL litio bateria autocaravana* | https://offroadwatt.com/blog/es/agm-gel-litio-bateria-autocaravana |
| Hub | — | https://offroadwatt.com/blog |

Each page links to the other two via `hreflang` + the in-nav language switcher. EN is `x-default`.

---

## 2. SEO checklist — all green

Run `node scripts/seo-audit.mjs` to re-verify. All **9** articles (3 topics x EN/FR/ES) pass:

- `<title>` 15–65 chars, unique per language
- `<meta description>` 70–165 chars, unique per language
- Canonical + 4 hreflang alternates (en/fr/es + x-default)
- Open Graph + Twitter Card (`summary_large_image`)
- One `<h1>`, 9 `<h2>` sections, correct `<html lang>`
- JSON-LD: Article + BreadcrumbList + FAQPage (valid JSON, 4 FAQ questions)
- No in-body `<img>` — hero only in og:image + hub card
- ~1780-1940 words per article; internal CTA to `app.offroadwatt.com`
- All 3 new URLs registered in `sitemap.xml` with hreflang

---

## 3. Brand & visual assets (Canva)

All visuals follow **`marketing/BRAND.md`** and were generated with the **OffroadWatt Canva brand kit**
(`kAHL9oO58mY`). Generated PNGs are committed; the editable Canva designs are linked below.

| Asset | File | Size | Canva edit link |
|-------|------|------|-----------------|
| Blog hero / og:image (EN) | `landing/blog/assets/agm-gel-lithium-hero.png` | 1280x720 | https://www.canva.com/d/fgRNBUfYto7955W |
| Blog hero / og:image (FR) | `landing/blog/assets/agm-gel-lithium-hero-fr.png` | 1280x720 | https://www.canva.com/d/JRUYMFQaYiWmWsI |
| Blog hero / og:image (ES) | `landing/blog/assets/agm-gel-lithium-hero-es.png` | 1280x720 | https://www.canva.com/d/0xxpPuRnN9SjUa5 |
| Instagram | `marketing/social/instagram-agm-gel-lithium.png` | 1080x1350 | https://www.canva.com/d/jI3vh4gcaD96clq |
| Facebook | `marketing/social/facebook-agm-gel-lithium.png` | 1080x1080 | https://www.canva.com/d/-dLy3c-0q1Jv8qi |

---

## 4. Ready-to-post copy

### Instagram (link in bio -> blog article)
**EN:** Which battery chemistry is right for YOUR campervan? AGM is cheap but heavy. GEL handles heat. Lithium costs 3x more upfront — but 3x LESS per cycle over its lifetime. Our new guide puts the real numbers side by side: DoD, cycles, weight, cost per Ah. Free calculator in bio.
`#vanlife #campervan #leisurebattery #lifepo4 #agmbattery #offgrid #vanbuild #motorhome #rvlife #boondocking #vanlifeeurope`

**FR:** Quelle technologie de batterie pour VOTRE camping-car ? L'AGM est economique mais lourde. Le GEL resiste a la chaleur. Le lithium coute 3x plus a l'achat — mais 3x MOINS par cycle sur sa duree de vie. Notre nouveau guide met les vrais chiffres face a face : DoD, cycles, poids, cout par Ah. Calculateur gratuit en bio.
`#vanlife #campingcar #fourgonamenage #batterie #lifepo4 #autonomie #vanamenage #voyageenvan`

**ES:** Que quimica de bateria es la mejor para TU autocaravana? La AGM es barata pero pesada. La GEL aguanta el calor. El litio cuesta 3x mas de entrada — pero 3x MENOS por ciclo a lo largo de su vida. Nuestra nueva guia pone los numeros reales frente a frente: DoD, ciclos, peso, coste por Ah. Calculadora gratis en bio.
`#vanlife #autocaravana #furgoneta #bateria #lifepo4 #campervan #autonomia #furgocamper`

### Facebook (link post -> blog article)
**EN:** AGM vs GEL vs Lithium — which leisure battery is actually best for a campervan? Most people compare upfront price. But the real metric is cost per usable Ah over the battery's lifetime. Spoiler: lithium costs 3x less per cycle, even though it costs 3x more to buy. This guide breaks down every spec that matters — DoD, cycle life, weight, charging compatibility — plus a decision framework for 6 common scenarios.
https://offroadwatt.com/blog/agm-vs-gel-vs-lithium-campervan-battery

**FR:** AGM, GEL ou Lithium — quelle batterie auxiliaire est vraiment la meilleure pour un camping-car ? La plupart des gens comparent le prix d'achat. Mais le vrai critere, c'est le cout par Ah utilisable sur toute la duree de vie. Spoiler : le lithium coute 3x moins par cycle, meme s'il coute 3x plus a l'achat. Ce guide detaille chaque spec qui compte — DoD, cycles, poids, compatibilite de charge — plus un guide de decision pour 6 situations courantes.
https://offroadwatt.com/blog/fr/agm-gel-lithium-batterie-camping-car

**ES:** AGM vs GEL vs Litio — cual es realmente la mejor bateria auxiliar para una autocaravana? La mayoria compara el precio de compra. Pero la metrica real es el coste por Ah utilizable a lo largo de toda la vida de la bateria. Spoiler: el litio cuesta 3x menos por ciclo, aunque cueste 3x mas de entrada. Esta guia desglosa cada spec que importa — DoD, ciclos, peso, compatibilidad de carga — mas una guia de decision para 6 situaciones habituales.
https://offroadwatt.com/blog/es/agm-gel-litio-bateria-autocaravana

---

## 5. Prerequisites & next actions (for you)

- [ ] Merge this PR -> Vercel auto-deploys `landing/` (the new article goes live).
- [ ] Submit the sitemap + request indexing for the 3 new URLs in Google Search Console.
- [ ] Schedule the 3 social posts (use the copy above; Instagram = link in bio).
- [ ] Optional: add a Story (1080x1920) — re-run the Canva step with `your_story`.
