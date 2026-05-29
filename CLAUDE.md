# CLAUDE.md — Briefing technique pour Claude Code

Ce fichier documente l'état complet du projet **OffroadWatt** pour permettre une reprise de développement dans Claude Code sans perte de contexte.

---

## 1. Présentation du projet

**OffroadWatt** est un calculateur d'autonomie électrique pour camping-car, caravane et van.

L'utilisateur configure :
- ses **appareils consommateurs** (watts, heures/jour)
- sa **banque de batteries** (Ah, voltage, nombre en parallèle, profondeur de décharge)
- ses **panneaux solaires** (Wc, nombre, rendement MPPT, zone géographique)

L'application calcule en temps réel :
- la consommation totale en **Wh/jour**
- la production solaire en **Wh/jour**
- le déficit journalier résiduel
- l'**autonomie en jours** (sans soleil)
- des recommandations de batterie du marché

Une fonctionnalité **Recherche IA** (Anthropic Claude API + web search) permet de trouver des composants réels avec leur consommation exacte.

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
| API IA | **Anthropic Claude API** (`claude-sonnet-4-20250514`) + tool `web_search` |

**Aucune dépendance runtime** — uniquement `vite` en devDependency.

---

## 3. Structure des fichiers

```
OffroadWatt/
├── index.html          ← HTML shell + tout le CSS (CSS vars, ~170 lignes)
├── src/
│   └── main.js         ← Toute la logique applicative (~665 lignes)
├── package.json        ← { "vite": "^5.4.0" } devDependency
├── vite.config.js      ← Config minimale (root: '.', outDir: 'dist')
├── vercel.json         ← buildCommand + outputDirectory
├── .gitignore          ← node_modules/, dist/, .env.local
├── README.md           ← Documentation utilisateur
└── CLAUDE.md           ← Ce fichier (briefing technique)
```

---

## 4. Architecture du code (`src/main.js`)

### 4.1 Données statiques (en tête de fichier)

```js
const BATS    // 9 modèles de batteries {ah, v, label, type}
const DOD     // Profondeur de décharge par type: {AGM:0.5, GEL:0.5, LI:0.8}
const PANELS  // Puissances disponibles: [80,100,150,200,250,300,400,500] Wc
const SUN_ZONES  // 41 zones géographiques mondiales {r, n, h, eg}
const CATALOG    // 33 appareils preset {n, icon, w, h, cat}
const CATS    // ['Tout','Cuisine','Confort','Tech','Eau','Éclairage','Système']
const API_KEY // import.meta.env.VITE_ANTHROPIC_KEY || ''
```

### 4.2 État global

```js
let S = {
  vtype: 'campervan',       // 'campervan' | 'caravan' | 'van'
  apps: [...],              // [{id, n, icon, w, h, on, cat}]
  bat: BATS[4],             // batterie sélectionnée {ah:200, v:12, type:'LI'}
  batNb: 1,                 // nombre de batteries en parallèle (1-10)
  dod: 0.8,                 // profondeur de décharge (0.4 à 1.0)
  solW: 200,                // puissance d'un panneau en Wc
  solNb: 2,                 // nombre de panneaux
  solEff: 0.85,             // rendement MPPT (0.6 à 0.98)
  sunIdx: 3,                // index dans SUN_ZONES (3 = Paris 4.0h)
  customSunH: '',           // heures perso si sunIdx = dernier (Personnalisé)
  aiQuery: '',              // texte de recherche IA
  aiResults: [],            // [{name, brand, watts, voltage, price_eur, description, type, efficiency}]
  aiLoading: false,
  modal: null,              // null | {type:'catalog', catFilter:'Cuisine'} | {type:'custom'}
  tab: 'apps',              // 'apps' | 'energy' | 'ai' | 'deploy'
  catFilter: 'Tout',        // filtre catégorie onglet Appareils
}
```

### 4.3 Pattern de mise à jour

```js
const set = (updates) => { Object.assign(S, updates); render() }
// Exemple: set({ tab: 'energy', batNb: 3 })
```

**Il n'y a pas de système de diff/virtual DOM** — `render()` régénère tout l'innerHTML de `#root` à chaque changement, puis `bindEvents()` re-attache les listeners. C'est simple et fonctionnel pour cette taille d'app.

### 4.4 Fonction de calcul centrale

```js
function calc() {
  const cons = Σ(app.w × app.h) pour apps actifs          // Wh/jour
  const solar = solW × solNb × sunH() × solEff            // Wh/jour
  const net = max(0, cons - solar)                         // Wh déficit/jour
  const batWhUnit = bat.ah × bat.v                         // Wh par batterie
  const batWhTotal = batWhUnit × batNb                     // Wh total banc
  const usable = batWhTotal × dod                          // Wh utilisables
  const autDays = net > 0 ? usable / net : Infinity        // jours d'autonomie
  const solCovPct = min(100, solar / cons × 100)           // % couverture solaire
  return { cons, solar, net, batWhUnit, batWhTotal, usable, autDays, solCovPct, breakdown }
}
```

### 4.5 Fonctions de rendu

| Fonction | Rôle |
|---|---|
| `buildHTML()` | Assemblage complet (header + tabs + tab actif + modal) |
| `buildHeader()` | Logo + sélecteur véhicule |
| `buildTabs()` | Navigation 4 onglets |
| `buildAppsTab()` | Liste appareils + filtres catégorie + footer total |
| `buildEnergyTab()` | Batteries (grille + parallèle + DoD + résumé) + Solaire + Bilan + Comparatif |
| `buildAITab()` | Recherche composants via Claude API |
| `buildDeployTab()` | Feuille de route statique |
| `buildModal()` | Modal catalogue OU modal appareil custom |

### 4.6 Gestion des événements

`bindEvents()` utilise **data-attributes** pour éviter les handlers inline :

```html
<!-- Dans le HTML généré -->
<div data-tab="energy">Énergie</div>
<button data-toggle="3"></button>     <!-- toggle app id=3 -->
<div data-bat="4"></div>              <!-- sélectionner batterie index 4 -->
<div data-nb="2"></div>              <!-- 2 batteries en parallèle -->
<div data-panel="200"></div>         <!-- panneau 200Wc -->
<div data-catalog="0"></div>         <!-- ajouter item 0 du catalogue -->
<button data-del="5"></button>        <!-- supprimer app id=5 -->
<button data-ai="1"></button>         <!-- ajouter résultat IA index 1 -->
```

### 4.7 Recherche IA

```js
async function searchAI(q) {
  // Appel direct à l'API Anthropic depuis le navigateur
  // Header 'anthropic-dangerous-direct-browser-access': 'true' requis
  // Model: claude-sonnet-4-20250514
  // Tool: web_search_20250305
  // Réponse: JSON parsé depuis le bloc text
}
```

⚠️ **L'appel se fait côté client** (navigateur). En production, migrer vers une API Route Vercel (`api/search.js`) pour ne pas exposer la clé.

---

## 5. Configuration Vercel

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

**Variable d'environnement requise dans Vercel :**
- Nom : `VITE_ANTHROPIC_KEY`
- Valeur : `sk-ant-api03-...`
- Scope : Production + Preview

En local : créer `.env.local` à la racine avec `VITE_ANTHROPIC_KEY=sk-ant-...`

---

## 6. Commandes

```bash
npm install       # installer les dépendances (vite)
npm run dev       # serveur dev → http://localhost:5173
npm run build     # build production → dist/
npm run preview   # prévisualiser le build
```

---

## 7. Ce qui fonctionne actuellement

- [x] Onglet **Appareils** — liste complète, filtre par catégorie, toggle on/off, édition watts/heures inline, suppression, ajout depuis catalogue (33 items), ajout custom
- [x] Onglet **Énergie** — sélection batterie (9 modèles), batteries en parallèle 1-10, DoD slider, résumé Wh exact (Ah×V×N), panneaux solaires (8 puissances), rendement MPPT, 41 zones géographiques mondiales groupées par région, zone personnalisée, bilan Wh/jour correct, autonomie en jours/heures, comparatif batteries marché
- [x] Onglet **Recherche IA** — recherche via Claude API + web_search, ajout direct au calcul
- [x] Onglet **Déploiement** — feuille de route statique
- [x] Sélecteur véhicule (camping-car / caravane / van) — visuel uniquement pour l'instant
- [x] Build Vite fonctionnel, déployable sur Vercel

---

## 8. Pistes d'amélioration prioritaires

### Court terme
- [ ] **Sécuriser la clé API** : créer `api/search.js` (Vercel Serverless Function) pour proxifier les appels Anthropic
- [ ] **Persistance locale** : sauvegarder `S` dans `localStorage` pour retrouver sa configuration après rechargement
- [ ] **Export PDF** : générer un rapport de bilan (jsPDF ou print CSS)
- [ ] **Type de véhicule** : ajuster les presets d'appareils selon camping-car / van / caravane

### Moyen terme
- [ ] **Migration React + TypeScript** : découper en composants (`ApplianceManager`, `BatteryConfig`, `SolarConfig`, `ResultDashboard`)
- [ ] **Supabase** : authentification + sauvegarde de configurations en base
- [ ] **Partage de configuration** : URL avec state encodé en base64
- [ ] **Source de recharge alternateur** : ajouter les Ah rechargés en roulant

### Long terme
- [ ] **PWA** : installable sur mobile (vite-plugin-pwa)
- [ ] **Monitoring BLE** : intégration Victron Connect
- [ ] **Communauté** : partage de configurations entre utilisateurs

---

## 9. Repo GitHub

- **URL** : https://github.com/Chrisdesmurger/OffroadWatt
- **Branche principale** : `main`
- **Dernier commit** : `c2ca6a5` — migration Vite

```bash
# Cloner et démarrer
git clone https://github.com/Chrisdesmurger/OffroadWatt.git
cd OffroadWatt
npm install
npm run dev
```

---

## 10. Points d'attention pour la suite

1. **Pas de framework** — le rendu est du vanilla JS qui réécrit l'innerHTML à chaque `set()`. Pour scaler, migrer vers React.
2. **État non persistant** — rafraîchir la page remet tout à zéro. Implémenter `localStorage` en priorité.
3. **Clé API exposée** — acceptable en dev, à corriger avant mise en production publique.
4. **CSS inline dans index.html** — fonctionne bien avec Vite mais à migrer dans `src/style.css` si le fichier grossit.
5. **`vtype` (camping-car/van/caravane)** — stocké en state mais pas encore utilisé dans les calculs ni dans les presets d'appareils.
