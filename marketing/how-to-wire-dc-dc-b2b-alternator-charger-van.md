# Recap — Blog article: "How to wire a DC-DC (B2B) alternator charger in a van"

**Date:** 2026-06-10 · **Branch:** `claude/serene-curie-gg5nkk` · **Status:** SEO audit ALL GREEN

Generated, audited, translated into 3 languages and prepared for social media by the
`seo-article` pipeline. This file is internal (lives in `marketing/`, **not** deployed with the site).

---

## 1. Published pages (after this branch is merged + deployed)

| Lang | Primary keyword | URL |
|------|-----------------|-----|
| EN | *DC-DC charger wiring campervan* | https://offroadwatt.com/blog/how-to-wire-dc-dc-b2b-alternator-charger-van |
| FR | *brancher chargeur DC-DC van* | https://offroadwatt.com/blog/fr/brancher-chargeur-alternateur-dc-dc-b2b-van |
| ES | *instalar cargador DC-DC furgoneta* | https://offroadwatt.com/blog/es/como-instalar-cargador-alternador-dc-dc-b2b-furgoneta |
| Hub | — | https://offroadwatt.com/blog |

Each page links to the other two via `hreflang` + the in-nav language switcher. EN is `x-default`.

---

## 2. SEO checklist — all green

Run `node scripts/seo-audit.mjs` to re-verify. All **12** articles (4 topics x EN/FR/ES) pass:

- `<title>` 15–65 chars, unique per language
- `<meta description>` 70–165 chars, unique per language
- Canonical + 4 hreflang alternates (en/fr/es + x-default)
- Open Graph + Twitter Card (`summary_large_image`)
- One `<h1>`, 9 `<h2>` sections, correct `<html lang>`
- JSON-LD: Article + BreadcrumbList + FAQPage (valid JSON, 4 FAQ questions)
- No in-body `<img>` — hero only in og:image + hub card
- ~2290-2415 words per article; internal CTA to `app.offroadwatt.com`
- All 3 new URLs registered in `sitemap.xml` with hreflang

---

## 3. Brand & visual assets (Canva)

All visuals follow **`marketing/BRAND.md`** and were generated with the **OffroadWatt Canva brand kit**
(`kAHL9oO58mY`). Generated PNGs are committed; the editable Canva designs are in the dedicated folder.

| Asset | File | Size | Canva edit link |
|-------|------|------|-----------------|
| Blog hero / og:image (EN) | `landing/blog/assets/dc-dc-b2b-charger-hero.png` | 1280x720 | https://www.canva.com/d/680wzOBwJpL_edf |
| Blog hero / og:image (FR) | `landing/blog/assets/dc-dc-b2b-charger-hero-fr.png` | 1280x720 | (same source, copied) |
| Blog hero / og:image (ES) | `landing/blog/assets/dc-dc-b2b-charger-hero-es.png` | 1280x720 | (same source, copied) |
| Instagram | `marketing/social/instagram-dc-dc-b2b-charger.png` | 1080x1350 | https://www.canva.com/d/XffOefD_CMQhJoE |
| Facebook | `marketing/social/facebook-dc-dc-b2b-charger.png` | 1080x1080 | https://www.canva.com/d/zu5HuOuUsxWnDLt |

Canva folder: https://www.canva.com/folder/FAHMPZYhWik

---

## 4. Ready-to-post copy

### Instagram (link in bio -> blog article)
**EN:** Your alternator is the fastest way to charge while you drive — but only if the DC-DC charger is wired right. Our new guide covers everything: sizing (20A vs 30A vs 50A), cable gauge table, fuse placement, step-by-step wiring, and the 6 mistakes that kill performance. Free calculator in bio to see exactly how many Ah your charger adds per day.
`#vanlife #campervan #dcdc #b2bcharger #alternatorcharging #vanbuild #offgrid #motorhome #rvlife #vanelectrical #victronorion #leisurebattery`

**FR:** L'alternateur est le moyen le plus rapide de recharger en roulant — encore faut-il que le chargeur DC-DC soit bien branche. Notre nouveau guide couvre tout : dimensionnement (20A vs 30A vs 50A), tableau de sections de cable, fusibles, branchement etape par etape et les 6 erreurs qui plombent les performances. Calculateur gratuit en bio pour voir combien d'Ah votre chargeur ajoute par jour.
`#vanlife #campingcar #fourgonamenage #dcdc #boosterb2b #alternateur #vanamenage #voyageenvan #autonomie`

**ES:** El alternador es la forma mas rapida de cargar mientras conduces — pero solo si el cargador DC-DC esta bien cableado. Nuestra nueva guia cubre todo: dimensionado (20A vs 30A vs 50A), tabla de secciones de cable, fusibles, cableado paso a paso y los 6 errores que matan el rendimiento. Calculadora gratis en bio para ver cuantos Ah aporta tu cargador al dia.
`#vanlife #autocaravana #furgoneta #dcdc #cargadorb2b #alternador #furgocamper #campervan #autonomia`

### Facebook (link post -> blog article)
**EN:** Your alternator charges your leisure battery faster than solar — but only if the DC-DC charger is wired correctly. Most installs go wrong in one of 6 places: undersized cable, missing fuse at the starter battery, wrong battery profile, no ignition sense wire, poor grounding, or sealed mounting. This guide walks you through every step: sizing the right amperage for your battery bank, cable gauge and fuse table by distance, step-by-step wiring from starter to leisure battery, and a comparison of the most popular chargers (Victron Orion, Renogy DCC, Sterling, Redarc).
https://offroadwatt.com/blog/how-to-wire-dc-dc-b2b-alternator-charger-van

**FR:** L'alternateur recharge votre batterie auxiliaire plus vite que le solaire — encore faut-il que le chargeur DC-DC soit branche correctement. La plupart des installations se trompent sur l'un de ces 6 points : cable sous-dimensionne, fusible manquant a la batterie de demarrage, mauvais profil, pas de fil d'allumage, masse defaillante ou montage en boite fermee. Ce guide vous accompagne etape par etape : dimensionnement, tableau section de cable et fusibles par distance, branchement complet et comparatif des chargeurs les plus populaires (Victron Orion, Renogy DCC, Sterling, Redarc).
https://offroadwatt.com/blog/fr/brancher-chargeur-alternateur-dc-dc-b2b-van

**ES:** El alternador carga tu bateria auxiliar mas rapido que el solar — pero solo si el cargador DC-DC esta bien cableado. La mayoria de instalaciones fallan en uno de estos 6 puntos: cable subdimensionado, fusible ausente en la bateria de arranque, perfil equivocado, sin cable de senal de contacto, masa deficiente o montaje cerrado. Esta guia te lleva paso a paso: dimensionado, tabla de seccion de cable y fusibles por distancia, cableado completo y comparativa de los cargadores mas populares (Victron Orion, Renogy DCC, Sterling, Redarc).
https://offroadwatt.com/blog/es/como-instalar-cargador-alternador-dc-dc-b2b-furgoneta

---

## 5. Prerequisites & next actions (for you)

- [ ] Merge this PR -> Vercel auto-deploys `landing/` (the new article goes live).
- [ ] Submit the sitemap + request indexing for the 3 new URLs in Google Search Console.
- [ ] Schedule the 3 social posts (use the copy above; Instagram = link in bio).
- [ ] Optional: add a Story (1080x1920) — re-run the Canva step with `your_story`.
