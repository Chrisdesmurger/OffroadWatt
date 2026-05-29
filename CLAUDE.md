# CLAUDE.md — Briefing technique pour Claude Code

Ce fichier documente l'état complet du projet **OffroadWatt** pour permettre une reprise de développement dans Claude Code sans perte de contexte.

---

## 1. Présentation du projet

**OffroadWatt** est un calculateur d'autonomie électrique pour camping-car, caravane et van.

L'utilisateur configure :
- ses **appareils consommateurs** (watts, heures/jour, multi-modes 12V/Gaz)
- sa **banque de batteries** (Ah, voltage, nombre en parallèle, profondeur de décharge)
- ses **panneaux solaires** (Wc, nombre, rendement MPPT, zone géographique)

L'application calcule en temps réel :
- la consommation totale en **Wh/jour**
- la production solaire en **Wh/jour**
- le déficit journalier résiduel
- l'**autonomie en jours** (sans soleil)
- des recommandations de batterie du marché

Une fonctionnalité **Recherche IA** (Anthropic Claude API via Edge Function Vercel) permet de trouver des composants réels avec leur consommation exacte. Les résultats sont sauvegardés dans un **catalogue partagé Supabase**.

---

## 2. Stack technique

| Élément | Choix |
|---|---|
| Bundler | **Vite 5** |
| Langage | **Vanilla JavaScript** (ES modules, pas de framework) |
| CSS | CSS custom properties inline dans `index.html` |
| Icônes | Tabler Icons (CDN webfont) |
| Polices | Google Fonts (Space Mono + DM Sans) CDN |
| Déploiement | **Vercel** (buildCommand: `npm run build`, output: `dist/`) |
| API IA | **Anthropic Claude API** (`claude-haiku-4-5-20251001`) via Edge Function |
| Base de données | **Supabase** `ofjpskrjlwfebaqomijm` (eu-west-3 / Paris) |
| Node.js | `20.x` (fixé dans `package.json` engines) |

**Aucune dépendance runtime** — uniquement `vite` en devDependency.

---

## 3. Structure des fichiers

```
OffroadWatt/
├── index.html          ← HTML shell + tout le CSS (~200 lignes)
├── src/
│   └── main.js         ← Toute la logique applicative (~750 lignes)
├── api/
│   └── search.js       ← Vercel Edge Function — proxy Anthropic + streaming SSE
├── package.json        ← { "vite": "^5.4.0" }, engines: node 20.x
├── vite.config.js      ← Config minimale (root: '.', outDir: 'dist')
├── vercel.json         ← buildCommand + outputDirectory + Edge Function config
├── .gitignore          ← node_modules/, dist/, .env.local
├── README.md           ← Documentation utilisateur
└── CLAUDE.md           ← Ce fichier (briefing technique)
```

---

## 4. Architecture du code (`src/main.js`)

### 4.1 Données statiques

```js
const BATS       // 9 modèles de batteries {ah, v, label, type}
const DOD        // Profondeur de décharge par type: {AGM:0.5, GEL:0.5, LI:0.8}
const PANELS     // Puissances disponibles: [80,100,150,200,250,300,400,500] Wc
const SUN_ZONES  // 41 zones géographiques mondiales {r, n, h, eg}
const CATALOG    // 33 appareils preset {n, icon, w, h, cat}
const CATS       // ['Tout','Cuisine','Confort','Tech','Eau','Éclairage','Système']
```

### 4.2 État global

```js
let S = {
  vtype: 'campervan',       // 'campervan' | 'caravan' | 'van'
  apps: [...],              // [{id, n, icon, w, h, on, cat, modes?, activeMode?}]
  bat: BATS[4],             // batterie sélectionnée
  batNb: 1,                 // batteries en parallèle
  dod: 0.8,                 // profondeur de décharge
  solW: 200, solNb: 2, solEff: 0.85, sunIdx: 3, customSunH: '',
  aiQuery: '',
  aiResults: [],            // merge catalogue + online
  aiCatalogResults: [],     // résultats depuis Supabase
  aiOnlineResults: [],      // résultats nouveaux depuis l'API
  aiLoading: false,
  aiError: null,
  modal: null,
  tab: 'energy',            // onglet par défaut
  catFilter: 'Tout',
}
```

### 4.3 Multi-modes appareils

Les appareils issus de la recherche IA peuvent avoir plusieurs modes de consommation :

```js
// Exemple : chauffage diesel Webasto
{
  id: 123, n: 'Webasto Air Top 2000 STC', w: 10, h: 8, on: true, cat: 'Confort',
  modes: [
    { label: 'Veille / allumage', watts: 10 },
    { label: 'Puissance min', watts: 30 },
    { label: 'Puissance max', watts: 80 },
  ],
  activeMode: 0,
}
```

Le switch de mode se fait **directement dans la carte du dashboard** via des boutons inline. Changer de mode met à jour `w` et recalcule l'autonomie en temps réel.

### 4.4 Fonctions de rendu principales

| Fonction | Rôle |
|---|---|
| `buildEnergyTab()` | Dashboard principal — layout 3 colonnes |
| `buildAppsCard()` | Carte appareils avec `buildAppRow()` pour le multi-modes |
| `buildAITab()` | Recherche IA — sections catalogue Supabase + résultats en ligne |
| `buildAIResultCard(r, i, source)` | Card résultat avec badge 'catalog' ou 'online' |
| `buildAppsTab()` | Onglet secondaire — délègue à `buildAppsCard()` |

### 4.5 Navigation

```
Onglet 1 : Dashboard (energy) ← onglet par défaut
Onglet 2 : Appareils (apps)   ← vue dédiée secondaire
Onglet 3 : Recherche IA (ai)
Onglet 4 : Déploiement (deploy)
```

---

## 5. API Edge Function (`api/search.js`)

```js
export const config = { runtime: 'edge' }  // Vercel Edge Runtime
```

**Fonctionnement :**
1. Reçoit `{ query }` en POST
2. Appelle Anthropic avec `stream: true` et `claude-haiku-4-5-20251001`
3. Transforme le flux SSE Anthropic → extrait les `text_delta` → stream vers le client
4. Le client accumule le texte et parse le JSON à la fin du flux

**Avantages Edge vs Serverless :**
- Pas de cold start (~50ms vs 2-3s)
- Timeout sur le premier octet — contourne la limite 10s du plan gratuit Vercel
- Streaming natif avec Web Streams API (TransformStream)

**Variable d'environnement requise dans Vercel :**
- `ANTHROPIC_KEY` = `sk-ant-...` (sans préfixe VITE_, côté serveur uniquement)

---

## 6. Catalogue Supabase

**Projet :** `ofjpskrjlwfebaqomijm` — OffroadWatt — eu-west-3 (Paris)
**URL :** `https://ofjpskrjlwfebaqomijm.supabase.co`
**Clé anon publique :** dans `src/main.js` constants `SB_URL` / `SB_KEY`

### Table `equipment_catalog`

```sql
id uuid primary key default gen_random_uuid()
name text not null
brand text
voltage integer default 12
price_eur integer
description text
type text
efficiency text
modes jsonb              -- [{label, watts}, ...]
search_keywords text[]
created_at timestamptz
updated_at timestamptz
unique (name, brand)
```

Index full-text PostgreSQL `tsvector` français sur name+brand+type+description.
RLS : lecture + insertion publiques anonymes (catalogue communautaire).

### Flux de recherche

1. `searchCatalog(q)` → full-text Supabase, résultats instantanés (badge vert "Catalogue")
2. Appel `api/search` en streaming → Anthropic haiku
3. Nouveaux résultats upsertés dans Supabase automatiquement (badge jaune "Nouveau")
4. Cache mémoire 60s pour éviter les requêtes répétées dans la session

---

## 7. Configuration Vercel

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "functions": {
    "api/search.js": { "maxDuration": 10 }
  }
}
```

**Variables d'environnement requises :**
- `ANTHROPIC_KEY` — clé Anthropic server-side

---

## 8. Commandes

```bash
npm install       # installer les dépendances (vite)
npm run dev       # serveur dev → http://localhost:5173
npm run build     # build production → dist/
npm run preview   # prévisualiser le build
```

---

## 9. Ce qui fonctionne

- [x] **Dashboard** — onglet principal, layout 3 colonnes (appareils | batteries+solaire | bilan)
- [x] **Appareils** — toggle, édition watts/heures, filtre catégorie, catalogue 33 items, custom
- [x] **Multi-modes** — appareils avec modes 12V/Gaz switchables inline dans le dashboard
- [x] **Batteries** — 9 modèles, parallèle 1-10, DoD slider, résumé Wh exact
- [x] **Solaire** — 8 puissances, rendement MPPT, 41 zones géographiques mondiales
- [x] **Bilan** — autonomie jours/heures, couverture solaire %, comparatif batteries marché
- [x] **Recherche IA** — Edge Function streaming, haiku model, résultats en ~3-5s
- [x] **Catalogue Supabase** — partagé communautaire, enrichissement automatique par les recherches
- [x] **Build Vite** — déployable sur Vercel

---

## 10. Repo GitHub

- **URL** : https://github.com/Chrisdesmurger/OffroadWatt
- **Branche principale** : `main`

---

## 11. Points d'attention

1. **Pas de framework** — `render()` réécrit l'innerHTML à chaque `set()`. Pour scaler, migrer vers React.
2. **État non persistant** — rafraîchir remet à zéro. Implémenter `localStorage` pour la config utilisateur.
3. **Catalogue communautaire** — pas d'auth. Si besoin de contrôle, ajouter auth Supabase + RLS par user.
4. **Edge Function** — Web APIs uniquement (pas de `require`, pas de `https` Node.js). `fetch` natif.
5. **`vtype`** — stocké en state mais pas encore utilisé dans les calculs ni les presets d'appareils.
6. **Streaming timeout** — Edge Function avec streaming contourne la limite 10s Vercel plan gratuit.

---

## 12. Pistes d'amélioration

### Court terme
- [ ] **Persistance localStorage** — sauvegarder la config `apps` + batteries + solaire entre sessions
- [ ] **vtype actif** — ajuster presets et calculs selon camping-car / van / caravane
- [ ] **Partage de configuration** — URL avec state encodé en base64

### Priorités validées — prochaine session (dans l'ordre)
- [ ] **🔴 1. Source recharge alternateur** — ajouter heures roulage/jour + ampérage alternateur dans le bilan, déduire les Wh rechargés du déficit batterie
- [ ] **🔴 2. Export PDF** — rapport de bilan complet (print CSS ou jsPDF) : appareils, batteries, solaire, autonomie
- [ ] **🔴 3. Auth utilisateur Supabase** — Supabase Auth (Google + email), configs personnelles sauvegardées en base et récupérables sur tout appareil

### Moyen terme
- [ ] **Migration React + TypeScript** — composants `ApplianceManager`, `BatteryConfig`, etc.

### Long terme
- [ ] **PWA** — installable mobile (vite-plugin-pwa)
- [ ] **Monitoring BLE** — intégration Victron Connect
