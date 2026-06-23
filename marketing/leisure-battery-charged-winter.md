# Recap — Blog article: "How to keep your leisure battery charged in winter"

**Date:** 2026-06-23 · **Branch:** `claude/fervent-babbage-ekwqex` · **Status:** SEO audit ALL GREEN

Generated, audited, translated into 3 languages by the daily morning review pipeline.
This file is internal (lives in `marketing/`, **not** deployed with the site).

---

## 1. Published pages (after branch is merged + deployed)

| Lang | Primary keyword | URL |
|------|-----------------|-----|
| EN | *leisure battery winter* | https://offroadwatt.com/blog/leisure-battery-charged-winter |
| FR | *batterie auxiliaire hiver* | https://offroadwatt.com/blog/fr/recharger-batterie-auxiliaire-hiver |
| ES | *batería auxiliar invierno* | https://offroadwatt.com/blog/es/mantener-bateria-auxiliar-cargada-invierno |
| Hub | — | https://offroadwatt.com/blog |

Each page links to the other two via `hreflang` + the in-nav language switcher. EN is `x-default`.

---

## 2. SEO checklist

Run `node scripts/seo-audit.mjs` to verify. ALL GREEN (27 articles).

- [x] `<title>` 15-65 chars, unique per language
- [x] `<meta description>` 70-165 chars, unique per language
- [x] Canonical + 4 hreflang alternates (en/fr/es + x-default)
- [x] Open Graph (og:title, og:description, og:url, og:image)
- [x] Twitter card (summary_large_image)
- [x] Exactly one `<h1>`
- [x] At least 2 `<h2>` sections (10 `<h2>` in all versions)
- [x] `<html lang>` set (en/fr/es)
- [x] JSON-LD: Article + BreadcrumbList + FAQPage (valid JSON)
- [x] No `<img>` tags in article body (hero only in og:image + hub card)
- [x] Internal CTA link to app.offroadwatt.com
- [x] Word count >= 600 (~2211 EN, ~2100+ FR, ~2100+ ES)
- [x] Article URLs registered in sitemap.xml

---

## 3. Hero images needed

| File | Description |
|------|-------------|
| `/landing/blog/assets/winter-battery-hero.png` | EN hero image (1280x720px) |
| `/landing/blog/assets/winter-battery-hero-fr.png` | FR hero image (1280x720px) |
| `/landing/blog/assets/winter-battery-hero-es.png` | ES hero image (1280x720px) |

---

## 4. Content summary

Comprehensive guide covering:
- How cold weather affects battery capacity, internal resistance and charge acceptance
- Capacity loss table by temperature for AGM/GEL and LiFePO4 (-20°C to 25°C)
- Winter solar output by European region (15-50% of summer yield)
- Tips to maximise winter solar (tilt panels, MPPT, clear snow, park facing south)
- Alternator charging table (20A-60A B2B chargers, 1-3 hours driving)
- Mains/shore power charging best practices (smart chargers, chemistry matching, float mode)
- Winter consumption breakdown (diesel heater is the big variable at 10-25 Ah/day)
- Lithium batteries in cold: discharge OK, charging below 0°C = permanent damage
- Self-heating BMS vs charge cut-off BMS
- Winter storage protocols for AGM/GEL (charge to 100%) and LiFePO4 (charge to 50-60%)
- Weekly maintenance checklist (voltage, shunt, insulation, terminals, panel clearing)
- 4-question FAQ (matches JSON-LD FAQPage schema)

Internal links to app CTA. Cross-references to existing articles where relevant.

---

## 5. Social copy

### Instagram

**EN:**
Winter is the hardest season for your campervan battery. Short days, weak solar, heater running all night.

Here's what actually happens to your battery in the cold:

❄️ AGM at 0°C → only 75% capacity left
❄️ Lithium at 0°C → 85% capacity BUT no charging below 0°C
❄️ Solar output drops to 15-25% of summer in northern Europe
❄️ Diesel heater adds 10-25 Ah/day to your consumption

Full guide: solar strategies, alternator charging tables, winter storage protocols and a maintenance checklist.

🔗 Link in bio → offroadwatt.com/blog/leisure-battery-charged-winter

#vanlife #campervan #wintervanlife #leisurebattery #campervanbattery #offgrid #lithiumbattery #wintercamping #vanconversion #12Vsystem #solarpanel #vanlifeelectrical #batterylife #coldweathercamping #offroadwatt

**FR:**
L'hiver est la saison la plus rude pour votre batterie de camping-car. Journées courtes, solaire faible, chauffage qui tourne toute la nuit.

Voici ce qui arrive réellement à votre batterie par temps froid :

❄️ AGM à 0°C → seulement 75 % de capacité restante
❄️ Lithium à 0°C → 85 % de capacité MAIS pas de charge en dessous de 0°C
❄️ Production solaire en hiver = 15-25 % de l'été en Europe du Nord
❄️ Chauffage diesel = 10-25 Ah/jour en plus

Guide complet : stratégies solaire, tableaux alternateur, protocoles d'hivernage et checklist d'entretien.

🔗 Lien en bio → offroadwatt.com/blog/fr/recharger-batterie-auxiliaire-hiver

#vanlife #campingcar #batteriecampingcar #hivernage #vanlifefrance #camping-carhiver #batterielithium #chauffagediesel #panneausolaire #autonomieelectrique #fourgonamenage #amenagementvan #offroadwatt

**ES:**
El invierno es la estación más dura para la batería de tu autocaravana. Días cortos, poco solar, calefacción toda la noche.

Esto es lo que le pasa realmente a tu batería con el frío:

❄️ AGM a 0°C → solo 75 % de capacidad
❄️ Litio a 0°C → 85 % de capacidad PERO sin carga por debajo de 0°C
❄️ Producción solar invernal = 15-25 % del verano en el norte de Europa
❄️ Calefacción diesel = 10-25 Ah/día extra

Guía completa: estrategias solar, tablas de alternador, protocolos de almacenamiento invernal y checklist de mantenimiento.

🔗 Link en bio → offroadwatt.com/blog/es/mantener-bateria-auxiliar-cargada-invierno

#vanlife #autocaravana #bateriaauxiliar #campinginvernal #furgocamper #camperizacion #baterialitio #calefacciondiesel #panelsolar #autonomiaelectrica #vidaenvan #instalacionelectrica #offroadwatt

---

### Facebook

**EN:**
❄️ Winter is coming for your battery — here's how to fight back.

Cold weather hits your leisure battery three ways: capacity drops (AGM loses 25% at 0°C), charging slows down, and consumption spikes from heating. Meanwhile, solar output falls to 15-25% of summer levels in northern Europe.

We've put together the definitive winter battery guide:

⚡ Capacity loss tables by temperature and chemistry (AGM/GEL vs LiFePO4)
⚡ Solar output expectations by region — and how to maximise it (tilt panels, MPPT, clear snow)
⚡ Alternator charging tables (20A-60A B2B chargers)
⚡ Why you must NEVER charge lithium below 0°C (and what self-heating BMS does)
⚡ Winter storage protocols (100% for lead-acid, 50-60% for lithium)
⚡ Weekly maintenance checklist

Whether you're winter camping or putting your van away for the season, this guide has you covered.

👉 Read the full guide: https://offroadwatt.com/blog/leisure-battery-charged-winter

Plan your winter setup with our free calculator: https://app.offroadwatt.com

**FR:**
❄️ L'hiver arrive pour votre batterie — voici comment la protéger.

Le froid frappe votre batterie auxiliaire de trois façons : la capacité chute (l'AGM perd 25 % à 0°C), la charge ralentit et la consommation explose avec le chauffage. En parallèle, la production solaire tombe à 15-25 % du niveau estival en Europe du Nord.

On a préparé le guide hivernal ultime pour votre batterie :

⚡ Tableaux de perte de capacité par température et chimie (AGM/GEL vs LiFePO4)
⚡ Production solaire attendue par région — et comment la maximiser (incliner, MPPT, déneiger)
⚡ Tableaux de charge alternateur (chargeurs B2B de 20A à 60A)
⚡ Pourquoi il ne faut JAMAIS charger du lithium sous 0°C (et ce que fait un BMS auto-chauffant)
⚡ Protocoles d'hivernage (100 % pour plomb, 50-60 % pour lithium)
⚡ Checklist d'entretien hebdomadaire

Que vous campiez en hiver ou que vous hiverniez votre van, ce guide couvre tout.

👉 Lire le guide complet : https://offroadwatt.com/blog/fr/recharger-batterie-auxiliaire-hiver

Planifiez votre config hiver avec notre calculateur gratuit : https://app.offroadwatt.com

**ES:**
❄️ El invierno viene a por tu batería — así puedes protegerla.

El frío golpea tu batería auxiliar de tres formas: la capacidad baja (la AGM pierde un 25 % a 0°C), la carga se ralentiza y el consumo se dispara con la calefacción. Mientras tanto, la producción solar cae al 15-25 % del nivel estival en el norte de Europa.

Hemos preparado la guía invernal definitiva para tu batería:

⚡ Tablas de pérdida de capacidad por temperatura y química (AGM/GEL vs LiFePO4)
⚡ Producción solar esperada por región — y cómo maximizarla (inclinar, MPPT, limpiar nieve)
⚡ Tablas de carga por alternador (cargadores B2B de 20A a 60A)
⚡ Por qué NUNCA debes cargar litio bajo 0°C (y qué hace un BMS con autocalentamiento)
⚡ Protocolos de almacenamiento invernal (100 % para plomo, 50-60 % para litio)
⚡ Lista de verificación de mantenimiento semanal

Tanto si haces camping invernal como si guardas tu furgoneta hasta primavera, esta guía lo cubre todo.

👉 Lee la guía completa: https://offroadwatt.com/blog/es/mantener-bateria-auxiliar-cargada-invierno

Planifica tu configuración invernal con nuestra calculadora gratuita: https://app.offroadwatt.com

---

## 6. Topic backlog status

Checked off in `marketing/TOPICS.md`. Next unchecked topic: "Lithium battery sizing for full-time van life (200Ah vs 300Ah)".
