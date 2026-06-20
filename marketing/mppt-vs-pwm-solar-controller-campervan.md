# Recap — Blog article: "MPPT vs PWM Solar Controller for Campervans"

**Date:** 2026-06-20 · **Branch:** `claude/upbeat-knuth-vxanrv` · **Status:** Published

Generated, audited, translated into 3 languages by the daily morning review pipeline.
This file is internal (lives in `marketing/`, **not** deployed with the site).

---

## 1. Published pages (after branch is merged + deployed)

| Lang | Primary keyword | URL |
|------|-----------------|-----|
| EN | *MPPT vs PWM campervan* | https://offroadwatt.com/blog/mppt-vs-pwm-solar-controller-campervan |
| FR | *regulateur solaire MPPT PWM camping-car* | https://offroadwatt.com/blog/fr/regulateur-solaire-mppt-pwm-camping-car |
| ES | *regulador solar MPPT PWM autocaravana* | https://offroadwatt.com/blog/es/regulador-solar-mppt-pwm-autocaravana |
| Hub | — | https://offroadwatt.com/blog |

Each page links to the other two via `hreflang` + the in-nav language switcher. EN is `x-default`.

---

## 2. SEO checklist

Run `node scripts/seo-audit.mjs` to verify. All checks passing:

- [x] `<title>` 15-65 chars, unique per language
- [x] `<meta description>` 70-165 chars, unique per language
- [x] Canonical + 4 hreflang alternates (en/fr/es + x-default)
- [x] Open Graph (og:title, og:description, og:url, og:image)
- [x] Twitter card (summary_large_image)
- [x] Exactly one `<h1>`
- [x] At least 2 `<h2>` sections (10 per article)
- [x] `<html lang>` set (en/fr/es)
- [x] JSON-LD: Article + BreadcrumbList + FAQPage (valid JSON)
- [x] All `<img>` tags have non-empty `alt`
- [x] Internal CTA link to app.offroadwatt.com
- [x] Word count >= 600 (EN: ~2671, FR: ~2851, ES: ~2795)
- [x] Article URLs registered in sitemap.xml

---

## 3. Hero images needed

| File | Description |
|------|-------------|
| `/landing/blog/assets/mppt-pwm-hero.png` | EN hero image (1280x720px) |
| `/landing/blog/assets/mppt-pwm-hero-fr.png` | FR hero image (1280x720px) |
| `/landing/blog/assets/mppt-pwm-hero-es.png` | ES hero image (1280x720px) |

---

## 4. Content summary

Comprehensive guide covering:
- What a solar charge controller does (3-stage charging: bulk, absorption, float)
- How PWM works (voltage clamping, limitations, cost advantage)
- How MPPT works (DC-DC conversion, maximum power point tracking)
- Side-by-side comparison table
- Real-world efficiency gains with seasonal breakdown (summer/winter/cloudy)
- Annual energy difference calculation (400W setup: 161 kWh/year difference)
- When PWM is good enough (under 200W, 12V panels, budget setups)
- Controller sizing formulas (PWM by Isc, MPPT by watts/voltage)
- Quick sizing table by panel wattage
- Best models: MPPT (Victron SmartSolar, Renogy Rover, EPEver Tracer) and PWM (Victron BlueSolar, Renogy Wanderer)
- Warning about fake MPPT controllers
- Common mistakes to avoid (7 items)
- 4-question FAQ (matches JSON-LD FAQPage schema)

---

## 5. Social copy

### Instagram

**EN:**
MPPT vs PWM — which solar controller is right for your van? ⚡

Your charge controller decides how much solar energy actually reaches your battery. The wrong type can waste 25-40% of what your panels produce.

Our latest guide breaks down:
→ How each technology works
→ Real efficiency numbers by season
→ When PWM is good enough
→ The best controllers for van life in 2026

Full guide → link in bio
https://offroadwatt.com/blog/mppt-vs-pwm-solar-controller-campervan

#vanlife #campervan #solarpanel #mppt #solarcontroller #offgrid #vanconversion #campervanlife #vanlifetips #solarpower #batterylife #vanlifeeurope #campervansolar #offroadwatt

**FR:**
MPPT ou PWM — quel regulateur solaire pour votre camping-car ? ⚡

Le regulateur de charge decide combien d'energie solaire arrive reellement a votre batterie. Le mauvais choix peut gaspiller 25 a 40 % de votre production.

Notre dernier guide detaille :
→ Comment chaque technologie fonctionne
→ Les vrais chiffres de rendement par saison
→ Quand le PWM suffit
→ Les meilleurs regulateurs pour camping-car en 2026

Guide complet → lien en bio
https://offroadwatt.com/blog/fr/regulateur-solaire-mppt-pwm-camping-car

#campingcar #fourgonamenage #panneausolaire #mppt #regulateursolaire #vanlife #autonomieelectrique #solaire #vanlifefrance #batterie #offroadwatt

**ES:**
MPPT vs PWM — ¿que regulador solar necesita tu autocaravana? ⚡

El regulador de carga decide cuanta energia solar llega realmente a tu bateria. Elegir mal puede desperdiciar el 25-40 % de lo que producen tus paneles.

Nuestra ultima guia explica:
→ Como funciona cada tecnologia
→ Cifras de rendimiento reales por estacion
→ Cuando basta con un PWM
→ Los mejores reguladores para camper en 2026

Guia completa → enlace en bio
https://offroadwatt.com/blog/es/regulador-solar-mppt-pwm-autocaravana

#autocaravana #furgoneta #panelsolar #mppt #reguladorsolar #vanlife #camper #energiasolar #bateria #vanlifeespana #offroadwatt

---

### Facebook

**EN:**
⚡ MPPT vs PWM Solar Controller — Which One Do You Really Need?

Your solar charge controller is the gatekeeper between your panels and your battery. An MPPT controller can harvest 25-30% more energy than a PWM from the same panels — but it costs 3-5x more. So when is it worth the upgrade?

Our new guide covers everything: how each technology works, real-world efficiency gains by season, sizing formulas, the best models (Victron, Renogy, EPEver) and 7 common mistakes to avoid.

👉 Read the full guide: https://offroadwatt.com/blog/mppt-vs-pwm-solar-controller-campervan

Try the free solar calculator: https://app.offroadwatt.com

#vanlife #campervan #solar #mppt #offgrid #offroadwatt

**FR:**
⚡ MPPT ou PWM — Quel regulateur solaire pour votre camping-car ?

Le regulateur de charge est le gardien entre vos panneaux et votre batterie. Un MPPT peut recolter 25 a 30 % d'energie en plus qu'un PWM avec les memes panneaux — mais coute 3 a 5 fois plus cher. Alors quand vaut-il le coup ?

Notre nouveau guide couvre tout : fonctionnement de chaque technologie, gains de rendement reels par saison, formules de dimensionnement, meilleurs modeles (Victron, Renogy, EPEver) et 7 erreurs courantes a eviter.

👉 Lire le guide complet : https://offroadwatt.com/blog/fr/regulateur-solaire-mppt-pwm-camping-car

Essayez le calculateur solaire gratuit : https://app.offroadwatt.com

#campingcar #fourgon #solaire #mppt #vanlife #offroadwatt

**ES:**
⚡ MPPT vs PWM — ¿Que regulador solar necesitas para tu autocaravana?

El regulador de carga es la puerta entre tus paneles y tu bateria. Un MPPT puede obtener un 25-30 % mas de energia que un PWM con los mismos paneles, pero cuesta 3-5 veces mas. ¿Cuando merece la pena?

Nuestra nueva guia cubre todo: como funciona cada tecnologia, ganancias reales de rendimiento por estacion, formulas de dimensionamiento, mejores modelos (Victron, Renogy, EPEver) y 7 errores comunes a evitar.

👉 Leer la guia completa: https://offroadwatt.com/blog/es/regulador-solar-mppt-pwm-autocaravana

Prueba la calculadora solar gratuita: https://app.offroadwatt.com

#autocaravana #furgoneta #solar #mppt #camper #offroadwatt

---

## 6. Topic backlog status

Checked off in `marketing/TOPICS.md`. Next unchecked topic: "How much does a campervan electrical system cost? (budget breakdown)".
