# Recap — Blog article: "Campervan fridge power consumption: compressor vs absorption"

**Date:** 2026-06-22 · **Branch:** `claude/fervent-babbage-ughrot` · **Status:** SEO audit ALL GREEN

Generated, audited, translated into 3 languages by the daily morning review pipeline.
This file is internal (lives in `marketing/`, **not** deployed with the site).

---

## 1. Published pages (after branch is merged + deployed)

| Lang | Primary keyword | URL |
|------|-----------------|-----|
| EN | *campervan fridge power consumption* | https://offroadwatt.com/blog/campervan-fridge-power-consumption |
| FR | *consommation frigo camping-car* | https://offroadwatt.com/blog/fr/consommation-frigo-camping-car |
| ES | *consumo frigorífico autocaravana* | https://offroadwatt.com/blog/es/consumo-frigorifico-autocaravana |
| Hub | — | https://offroadwatt.com/blog |

Each page links to the other two via `hreflang` + the in-nav language switcher. EN is `x-default`.

---

## 2. SEO checklist

Run `node scripts/seo-audit.mjs` to verify. ALL GREEN (24 articles).

- [x] `<title>` 15-65 chars, unique per language
- [x] `<meta description>` 70-165 chars, unique per language
- [x] Canonical + 4 hreflang alternates (en/fr/es + x-default)
- [x] Open Graph (og:title, og:description, og:url, og:image)
- [x] Twitter card (summary_large_image)
- [x] Exactly one `<h1>`
- [x] At least 2 `<h2>` sections (9 `<h2>` in all versions)
- [x] `<html lang>` set (en/fr/es)
- [x] JSON-LD: Article + BreadcrumbList + FAQPage (valid JSON)
- [x] No `<img>` tags in article body (hero only in og:image + hub card)
- [x] Internal CTA link to app.offroadwatt.com
- [x] Word count >= 600 (~1778 EN, ~1835 ES, ~1800+ FR)
- [x] Article URLs registered in sitemap.xml

---

## 3. Hero images needed

| File | Description |
|------|-------------|
| `/landing/blog/assets/fridge-power-hero.png` | EN hero image (1280x720px) |
| `/landing/blog/assets/fridge-power-hero-fr.png` | FR hero image (1280x720px) |
| `/landing/blog/assets/fridge-power-hero-es.png` | ES hero image (1280x720px) |

---

## 4. Content summary

Comprehensive guide covering:
- How compressor and absorption fridges work (duty cycle vs continuous draw)
- Real power draw data for 6 popular compressor fridges (Dometic, Vitrifrigo, Engel, Alpicool)
- Absorption fridge consumption by mode (12V, 230V, gas)
- Side-by-side comparison table (9 criteria)
- Daily consumption budget showing fridge accounts for 50-70% of total
- Battery sizing formula with worked example
- Solar sizing table by region (Southern vs Northern Europe)
- 7 tips to reduce fridge consumption by 20-40%
- Decision framework: compressor vs absorption by use case
- 4-question FAQ (matches JSON-LD FAQPage schema)

Internal links to existing articles: solar panels sizing, app CTA.

---

## 5. Social copy

### Instagram

**EN:**
Your campervan fridge runs 24/7 — it's your biggest power drain by far.

Compressor vs absorption: which one actually makes sense for your setup?

Key numbers:
⚡ Compressor (40L): 30-45 Ah/day on 12V
⚡ Absorption on 12V: 100-150+ Ah/day (!)
⚡ Absorption on gas: ~3 Ah/day electrical

Full comparison with battery sizing formulas and solar tips on the blog 👇

🔗 Link in bio → offroadwatt.com/blog/campervan-fridge-power-consumption

#vanlife #campervan #camperfridge #12Vfridge #vanconversion #offgrid #dometic #compressorfridge #vanlifeelectrical #campervankitchen #vanbuilding #fridgeconsumption #leisurebattery #solarpanel #offroadwatt

**FR:**
Votre frigo de camping-car tourne 24h/24 — c'est de loin votre plus gros poste de consommation.

Compresseur vs absorption : lequel a vraiment du sens pour votre installation ?

Les chiffres clés :
⚡ Compresseur (40L) : 30-45 Ah/jour en 12V
⚡ Absorption en 12V : 100-150+ Ah/jour (!)
⚡ Absorption au gaz : ~3 Ah/jour électrique

Comparatif complet avec formules de dimensionnement batterie et solaire sur le blog 👇

🔗 Lien en bio → offroadwatt.com/blog/fr/consommation-frigo-camping-car

#vanlife #campingcar #frigocampingcar #frigocompresseur #amenagementvan #autonomieelectrique #dometic #vanlifefrance #fourgonamenage #batterielithium #panneausolaire #cuisineenvan #offroadwatt

**ES:**
Tu frigorífico de autocaravana funciona 24/7 — es con diferencia tu mayor consumo eléctrico.

¿Compresor o absorción? ¿Cuál tiene sentido para tu instalación?

Cifras clave:
⚡ Compresor (40L): 30-45 Ah/día en 12V
⚡ Absorción en 12V: 100-150+ Ah/día (!)
⚡ Absorción con gas: ~3 Ah/día eléctrico

Comparativa completa con fórmulas de dimensionamiento de batería y solar en el blog 👇

🔗 Link en bio → offroadwatt.com/blog/es/consumo-frigorifico-autocaravana

#vanlife #autocaravana #neveracamper #frigorificocompresor #camperizacion #furgocamper #dometic #vidaroadtrip #baterialitio #panelsolar #cocinaenfurgoneta #instalacionelectrica #offroadwatt

---

### Facebook

**EN:**
🧊 Your fridge is probably eating half your battery — here's the full picture.

The fridge runs 24 hours a day, every day. It's almost always the single biggest power consumer in a campervan — typically 50-70% of your daily electrical budget.

We've put together a detailed comparison of the two fridge technologies:

⚡ Compressor (40L): 30-45 Ah/day — efficient, fast cooling, works at any angle
⚡ Absorption on 12V: 100-150+ Ah/day — only practical while driving
⚡ Absorption on gas: nearly free electrically (~3 Ah/day for the igniter)

Plus real consumption data for 6 popular models (Dometic, Vitrifrigo, Engel, Alpicool), a battery sizing formula, solar panel recommendations, and 7 tips to cut fridge power consumption by 20-40%.

👉 Read the full guide: https://offroadwatt.com/blog/campervan-fridge-power-consumption

And use our free calculator to see exactly how your fridge affects your autonomy: https://app.offroadwatt.com

**FR:**
🧊 Votre frigo mange probablement la moitié de votre batterie — voici le tableau complet.

Le frigo tourne 24h sur 24, tous les jours. C'est presque toujours le plus gros consommateur dans un camping-car — en général 50 à 70 % de votre budget électrique quotidien.

On a préparé un comparatif détaillé des deux technologies :

⚡ Compresseur (40L) : 30-45 Ah/jour — efficace, refroidissement rapide, fonctionne à tous les angles
⚡ Absorption en 12V : 100-150+ Ah/jour — uniquement viable en roulant
⚡ Absorption au gaz : quasi gratuit électriquement (~3 Ah/jour pour l'allumeur)

Avec les données de consommation réelles de 6 modèles populaires (Dometic, Vitrifrigo, Engel, Alpicool), une formule de dimensionnement batterie, des recommandations solaires et 7 astuces pour réduire la consommation de 20 à 40 %.

👉 Lire le guide complet : https://offroadwatt.com/blog/fr/consommation-frigo-camping-car

Et utilisez notre calculateur gratuit pour voir l'impact exact de votre frigo : https://app.offroadwatt.com

**ES:**
🧊 Tu frigorífico probablemente consume la mitad de tu batería — aquí tienes el panorama completo.

El frigorífico funciona 24 horas al día, todos los días. Es casi siempre el mayor consumidor eléctrico en una autocaravana — normalmente el 50-70% de tu presupuesto eléctrico diario.

Hemos preparado una comparativa detallada de las dos tecnologías:

⚡ Compresor (40L): 30-45 Ah/día — eficiente, enfriamiento rápido, funciona en cualquier ángulo
⚡ Absorción en 12V: 100-150+ Ah/día — solo viable en marcha
⚡ Absorción con gas: casi gratuito eléctricamente (~3 Ah/día para el encendedor)

Con datos de consumo real de 6 modelos populares (Dometic, Vitrifrigo, Engel, Alpicool), fórmula de dimensionamiento de batería, recomendaciones solares y 7 consejos para reducir el consumo un 20-40%.

👉 Lee la guía completa: https://offroadwatt.com/blog/es/consumo-frigorifico-autocaravana

Y usa nuestra calculadora gratuita para ver el impacto exacto de tu frigorífico: https://app.offroadwatt.com

---

## 6. Topic backlog status

Checked off in `marketing/TOPICS.md`. Next unchecked topic: "How to keep your leisure battery charged in winter".
