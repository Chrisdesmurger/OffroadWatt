# Recap — Blog article: "What size inverter do I need for my campervan?"

**Date:** 2026-06-17 · **Branch:** `claude/practical-cray-wub09x` · **Status:** Pending SEO audit

Generated, audited, translated into 3 languages by the daily morning review pipeline.
This file is internal (lives in `marketing/`, **not** deployed with the site).

---

## 1. Published pages (after branch is merged + deployed)

| Lang | Primary keyword | URL |
|------|-----------------|-----|
| EN | *what size inverter campervan* | https://offroadwatt.com/blog/what-size-inverter-campervan |
| FR | *quelle puissance convertisseur camping-car* | https://offroadwatt.com/blog/fr/quelle-puissance-convertisseur-camping-car |
| ES | *que tamano inversor autocaravana* | https://offroadwatt.com/blog/es/que-tamano-inversor-autocaravana |
| Hub | — | https://offroadwatt.com/blog |

Each page links to the other two via `hreflang` + the in-nav language switcher. EN is `x-default`.

---

## 2. SEO checklist

Run `node scripts/seo-audit.mjs` to verify. Expected checks:

- [ ] `<title>` 15-65 chars, unique per language
- [ ] `<meta description>` 70-165 chars, unique per language
- [ ] Canonical + 4 hreflang alternates (en/fr/es + x-default)
- [ ] Open Graph (og:title, og:description, og:url, og:image)
- [ ] Twitter card (summary_large_image)
- [ ] Exactly one `<h1>`
- [ ] At least 2 `<h2>` sections
- [ ] `<html lang>` set (en/fr/es)
- [ ] JSON-LD: Article + BreadcrumbList + FAQPage (valid JSON)
- [ ] All `<img>` tags have non-empty `alt`
- [ ] Internal CTA link to app.offroadwatt.com
- [ ] Word count >= 600
- [ ] Article URLs registered in sitemap.xml

---

## 3. Hero images needed

| File | Description |
|------|-------------|
| `/landing/blog/assets/inverter-sizing-hero.png` | EN hero image (1200x630px) |
| `/landing/blog/assets/inverter-sizing-hero-fr.png` | FR hero image (1200x630px) |
| `/landing/blog/assets/inverter-sizing-hero-es.png` | ES hero image (1200x630px) |

---

## 4. Content summary

Comprehensive guide covering:
- What is an inverter (12V DC to 230V AC) and why van lifers need one
- Pure sine wave vs modified sine wave comparison
- How to size your inverter: continuous watts, peak/surge watts
- Appliance power ratings table
- Sizing guide by use case
- Battery impact and Ah drain formula
- Cable sizing for high-current inverter connections
- Popular models compared (Victron, Renogy, EDECOA, GIANDEL)
- Common mistakes to avoid
- 4-question FAQ (matches JSON-LD FAQPage schema)

---

## 5. Topic backlog status

Checked off in `marketing/TOPICS.md`. Next unchecked topic: "MPPT vs PWM solar controller for camper vans".
