# CLAUDE.md — Briefing technique pour Claude Code

Ce fichier documente l'état complet du projet **OffroadWatt** pour permettre une reprise de développement dans Claude Code sans perte de contexte.

---

## 1. Présentation du projet

**OffroadWatt** est un calculateur d'autonomie électrique pour camping-car, caravane et van.

L'utilisateur configure :
- ses **appareils consommateurs** (watts, heures/jour, multi-modes 12V/Gaz)
- sa **banque de batteries** (Ah, voltage, nombre en parallèle, profondeur de décharge)
- ses **panneaux solaires** (Wc, nombre, rendement MPPT, zone géographique)
- sa **recharge alternateur** (ampérage dédié, heures de roulage/jour)

L'application calcule en temps réel :
- la consommation totale en **Ah/jour** (affiché) — calcul interne en Wh
- la production solaire + alternateur en **Ah/jour**
- le déficit journalier résiduel
- l'**autonomie en jours** (batterie seule ou avec recharge)
- des recommandations de batterie du marché

Fonctionnalités complémentaires :
- **Multilingue** — Anglais (défaut), Espagnol, Français — détection auto navigateur + sélecteur header
- **Recherche IA** (Anthropic Claude API via Edge Function Vercel) — trouve des composants réels avec consommation exacte, enrichit le catalogue Supabase
- **Catalogue fusionné** — le modal Catalogue du dashboard affiche les presets locaux ET les items du catalogue Supabase IA
- **Export PDF** — rapport A4 imprimable via `window.print()`
- **Auth Supabase** — Magic Link email + Google OAuth, configurations sauvegardées en base par utilisateur
- **Comparateur de setups** — compare 2 configurations côte à côte avec ROI

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
| Auth | **Supabase Auth** — Magic Link + Google OAuth |
| SDK Supabase | `@supabase/supabase-js` ^2.49.0 (runtime dependency) |
| Node.js | `20.x` (fixé dans `package.json` engines) |

---

## 3. Structure des fichiers

```
OffroadWatt/
├── index.html          ← HTML shell + tout le CSS (~300 lignes)
├── src/
│   ├── main.js         ← Toute la logique applicative (~1300 lignes)
│   └── i18n.js         ← Module i18n — dictionnaires EN/ES/FR + helpers
├── api/
│   └── search.js       ← Vercel Edge Function — proxy Anthropic + streaming SSE
├── package.json        ← vite + @supabase/supabase-js, engines: node 20.x
├── vite.config.js      ← Config minimale (root: '.', outDir: 'dist')
├── vercel.json         ← buildCommand + outputDirectory + Edge Function config
├── .gitignore          ← node_modules/, dist/, .env.local
├── README.md           ← Documentation utilisateur
└── CLAUDE.md           ← Ce fichier (briefing technique)
```

---

## 4. Architecture du code

### 4.1 Module i18n (`src/i18n.js`)

```js
export const LANGS = [{ id: 'en', label: 'EN', name: 'English' }, ...]

export function t(key, vars)     // Traduit une clé UI avec interpolation {placeholder}
export function ta(frName)       // Traduit un nom d'appareil (clé canonique française → EN/ES)
export function getLang()        // Retourne la langue active
export function setLang(l)       // Change la langue + localStorage
export function initLang()       // Détecte et initialise la langue au boot
export function localeCode()     // 'en-US' | 'es-ES' | 'fr-FR' pour Intl/date
export function detectLang()     // navigator.language → localStorage → fallback 'en'
```

**Dictionnaires** : `DICT` (clés UI) + `APPL` (noms d'appareils).
- Clé `APPL` = libellé français canonique (tel que stocké dans CATALOG / state)
- `ta()` retourne le libellé français si `_lang === 'fr'`, sinon `APPL[name][_lang]`
- La langue est persistée dans `localStorage` sous la clé `ow_lang`

**Sélecteur dans le header** (boutons EN/ES/FR) — bindé dans `bindEvents()` :
```js
document.querySelectorAll('[data-lang]').forEach(el =>
  el.addEventListener('click', () => { setLang(el.dataset.lang); render() })
)
```

### 4.2 Données statiques (`src/main.js`)

```js
const BATS       // 34 modèles de batteries {ah, v, label, type, eur}
const DOD        // Profondeur de décharge par type: {AGM:0.5, GEL:0.5, LI:0.8}
const BAT_TYPES  // [{id:'AGM'}, {id:'GEL'}, {id:'LI'}] — filtre type batterie
const PANELS     // Puissances disponibles: [80,100,150,200,250,300,400,500] Wc
const SUN_ZONES  // 41 zones géographiques mondiales {r, n, h, eg}
const CATALOG    // 33 appareils preset {n, icon, w, h, cat}
const CATS       // ['Tout','Cuisine','Confort','Tech','Eau','Éclairage','Système']
```

**Catalogue batteries (34 modèles) :**
- AGM 12V : 60, 70, 80, 100, 105, 110, 120, 130, 140, 180, 200 Ah
- GEL 12V : 75, 100, 120, 150, 200, 250 Ah
- Lithium 12V : 50, 100, 120, 150, 200, 280, 300, 400, 600 Ah
- Lithium 24V : 50, 100, 150, 200, 280, 300, 400 Ah

### 4.3 État global

```js
let S = {
  vtype: 'campervan',       // 'campervan' | 'caravan' | 'van'
  apps: [...],              // [{id, n, icon, w, h, on, cat, modes?, activeMode?}]
  bat: BATS[...],           // batterie sélectionnée
  batType: 'LI',            // filtre type batterie affiché
  batNb: 1,                 // batteries en parallèle
  dod: 0.8,                 // profondeur de décharge
  solOn: true,              // solaire activé/désactivé
  solW: 200, solNb: 2, solEff: 0.85, sunIdx: 3, customSunH: '',
  altOn: false, altAmps: 20, altHours: 2,   // recharge alternateur
  aiQuery: '',
  aiResults: [],            // merge catalogue + online
  aiCatalogResults: [],     // résultats depuis Supabase
  aiOnlineResults: [],      // résultats nouveaux depuis l'API
  aiLoading: false,
  aiError: null,
  modal: null,              // { type: 'auth'|'auth-sent'|'save'|'configs'|'catalog'|'custom', ...data }
  tab: 'energy',            // onglet par défaut
  catFilter: 'Tout',
  compareA: null,           // snapshot config A pour comparateur
  compareB: null,           // snapshot config B pour comparateur
  hookupCost: 15,           // coût nuit borne (€) pour calcul ROI
  user: null,               // { id, email, plan: 'free'|'pro' }
  userConfigs: [],          // [{id, name, created_at, updated_at}]
  authLoading: false,
  saveLoading: false,
}
```

### 4.4 Conversion Wh → Ah

**Tous les nombres affichés à l'utilisateur sont en Ah.** Les calculs internes restent en Wh.

```js
// Helper de conversion
const toAh = (wh) => {
  const v = S?.bat?.v || 12
  const ah = wh / v
  return ah >= 10 ? Math.round(ah) : +ah.toFixed(1)
}
```

S'adapte automatiquement si la batterie est en 24V. Les Wc (solaire) et W (appareils) restent en watts car ce sont des puissances.

### 4.5 Constante alternateur

```js
const ALT_EFF = 0.7  // rendement câbles + régulateur
// Ah alternateur/jour = altAmps × altHours × ALT_EFF  (déjà en A, pas besoin de diviser par v)
```

### 4.6 Multi-modes appareils

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

Layout dans le dashboard — **2 lignes** :
- Ligne 1 : toggle · icône · nom · `h/j` input · Ah · supprimer
- Ligne 2 : boutons de mode compacts (`watts en gras` + label court traduit via `ta()`)

Changer de mode met à jour `w` et recalcule l'autonomie en temps réel.

### 4.7 Fonctions de rendu principales

| Fonction | Rôle |
|---|---|
| `buildEnergyTab()` | Dashboard principal — layout 3 colonnes |
| `buildAppRow(a)` | Ligne appareil — gère regular et multi-modes (2 layouts) |
| `buildAppsCard()` | Carte appareils groupés par sous-catégorie |
| `buildPrintReport(...)` | Rapport PDF caché, visible uniquement à l'impression |
| `buildAITab()` | Recherche IA — quota, sections catalogue + résultats en ligne |
| `buildAIResultCard(r, i, source)` | Card résultat avec badge 'catalog' ou 'online' |
| `buildCompareTab()` | Comparateur de setups A vs B |
| `buildCompareReport()` | PDF comparatif imprimable |
| `buildModal()` | Dispatch vers auth / auth-sent / save / configs / catalog / custom |

### 4.8 Navigation

```
Onglet 1 : Dashboard (energy)  ← onglet par défaut
Onglet 2 : Appareils (apps)    ← vue dédiée secondaire
Onglet 3 : Recherche IA (ai)
Onglet 4 : Comparer (compare)  ← comparateur de setups
```

### 4.9 Helpers de traduction

```js
const tcat    = (c)  => t('cat.' + c)        // catégorie d'appareil
const tregion = (r)  => t('region.' + r)      // zone géographique
const tbattype = (ty) => t('battype.' + ty)   // type de batterie
const toAh    = (wh) => ...                   // Wh → Ah selon bat.v
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

## 6. Supabase

**Projet :** `ofjpskrjlwfebaqomijm` — OffroadWatt — eu-west-3 (Paris)
**URL :** `https://ofjpskrjlwfebaqomijm.supabase.co`
**Clé anon publique :** `SB_KEY` dans `src/main.js`

### Tables

#### `equipment_catalog` (catalogue communautaire)
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
RLS : lecture + insertion publiques anonymes.
Index full-text PostgreSQL `tsvector` français sur name+brand+type+description.

#### `profiles` (utilisateurs)
```sql
id uuid primary key references auth.users(id)
email text
plan text default 'free'   -- 'free' | 'pro'
created_at timestamptz
```
RLS : chaque user voit/modifie uniquement son profil.
Trigger `on_auth_user_created` → insère automatiquement à l'inscription.

#### `user_configs` (configurations sauvegardées)
```sql
id uuid primary key default gen_random_uuid()
user_id uuid references profiles(id)
name text not null
state jsonb not null       -- sérialisation complète de S (apps, bat, sol, alt...)
created_at timestamptz
updated_at timestamptz
```
RLS : chaque user voit/modifie uniquement ses configs.

### Flux catalogue IA

1. `searchCatalog(q)` → full-text Supabase, résultats instantanés (badge vert)
2. Appel `api/search` en streaming → Anthropic haiku
3. Nouveaux résultats upsertés dans Supabase automatiquement (badge jaune)
4. Cache mémoire `_catalogCache` 60s pour éviter les requêtes répétées
5. `sbTypeToCat(type)` → mappe le champ `type` Supabase vers une catégorie locale

### Catalogue dans le modal Dashboard

Le modal "Catalogue d'appareils" (bouton dans la carte Appareils) affiche **deux sources** :
- Section 1 : presets locaux (33 items hardcodés dans `CATALOG`) — noms traduits via `ta()`
- Section 2 : items Supabase filtrés via `sbTypeToCat()` avec badge teal "Catalogue IA"

### Auth Supabase

```js
const supabase = createClient(SB_URL, SB_KEY)  // @supabase/supabase-js v2
```

- **Magic Link** : `supabase.auth.signInWithOtp({ email })`
- **Google OAuth** : `supabase.auth.signInWithOAuth({ provider: 'google' })`
  - Nécessite configuration manuelle dans Supabase Dashboard → Auth → Providers → Google
  - Callback URL : `https://ofjpskrjlwfebaqomijm.supabase.co/auth/v1/callback`
- **Session** : gérée automatiquement par le SDK (localStorage)
- `initAuth()` appelé au boot → vérifie la session existante

### Freemium

| Feature | Free | Pro |
|---|---|---|
| Configs sauvegardées | 1 (écrasement) | Illimitées |
| Recherches IA / jour | 5 (localStorage) | Illimitées |
| Export PDF | ✓ | ✓ |

Le plan est stocké dans `profiles.plan`. La mise à jour vers Pro (via Stripe, à implémenter) modifie ce champ.

---

## 7. Export PDF

Bouton "Exporter en PDF" en bas de la colonne bilan → `window.print()`.

Un `<div class="print-report">` caché contient le rapport complet :
- En-tête avec logo + type de véhicule + date (formatée selon la locale)
- Tableau des appareils (nom traduit, catégorie, mode actif traduit, W, h/j, Ah)
- Cards batteries / solaire / alternateur côte à côte
- Tableau bilan en Ah (consommation, production, déficit, autonomie)

`@media print` dans `index.html` : masque toute l'UI, affiche uniquement `.print-report`.

---

## 8. Configuration Vercel

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
- `RESEND_API_KEY` — envoi des emails de récapitulatif
- `STRIPE_SECRET_KEY` — clé secrète Stripe (Pro, issue #9)
- `STRIPE_PRICE_ID` — id du prix récurrent du produit « OffroadWatt Pro » (4,99€/mois)
- `STRIPE_WEBHOOK_SECRET` — secret de signature de l'endpoint webhook Stripe
- `SUPABASE_URL` — URL du projet Supabase (utilisé par le webhook Stripe)
- `SUPABASE_SERVICE_ROLE_KEY` — clé service_role (server-side, le webhook met à jour `profiles.plan`)

### Stripe Pro (`api/create-checkout.js` + `api/stripe-webhook.js`)
- `create-checkout` : crée une session Stripe Checkout (mode subscription) et renvoie `url`. Le front (`upgradeToPro()`) redirige l'utilisateur.
- `stripe-webhook` : vérifie la signature (Web Crypto HMAC-SHA256) puis met à jour `profiles.plan` (`pro`/`free`) via la clé service_role. Mappe l'abonnement à l'utilisateur via `client_reference_id` (id Supabase) et la colonne `profiles.stripe_customer_id`.
- Migration SQL : `supabase/stripe.sql` (ajoute `stripe_customer_id`). À exécuter dans le SQL Editor Supabase.
- Setup manuel : créer le produit/prix Stripe, renseigner les env vars Vercel, et déclarer l'endpoint webhook `https://app.offroadwatt.com/api/stripe-webhook` (events `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`).

---

## 9. Commandes

```bash
npm install       # installer les dépendances (vite + @supabase/supabase-js)
npm run dev       # serveur dev → http://localhost:5173
npm run build     # build production → dist/
npm run preview   # prévisualiser le build
```

---

## 10. Ce qui fonctionne

- [x] **Dashboard** — onglet principal, layout 3 colonnes (appareils | batteries+solaire | bilan)
- [x] **Appareils** — toggle, édition watts/heures, groupés par sous-catégorie, catalogue 33 items, custom
- [x] **Multi-modes** — layout 2 lignes propre, switch inline, h/j toujours éditable
- [x] **Batteries** — 34 modèles (AGM/GEL/LI, 12V/24V), filtre par type, parallèle 1-10, DoD slider
- [x] **Solaire** — toggle on/off, 8 puissances, rendement MPPT, 41 zones géographiques mondiales
- [x] **Recharge alternateur** — ampérage + heures roulage, rendement 70%, intégré au bilan
- [x] **Bilan en Ah** — toutes les valeurs affichées en Ah (cohérence avec batteries), calcul interne Wh
- [x] **Autonomie** — jours/heures, couverture %, comparatif batteries marché
- [x] **Multilingue** — EN (défaut) / ES / FR, détection navigateur, sélecteur header, localStorage
- [x] **Traduction appareils** — noms et labels de modes traduits en EN/ES via `ta()`
- [x] **Export PDF** — rapport A4 complet via print CSS, valeurs en Ah, date localisée
- [x] **Recherche IA** — Edge Function streaming, haiku model, résultats en ~3-5s
- [x] **Catalogue Supabase** — communautaire, enrichissement automatique par les recherches
- [x] **Catalogue fusionné** — modal Dashboard affiche presets locaux + items IA Supabase
- [x] **Comparateur de setups** — capture A/B, tableau delta, ROI, PDF comparatif
- [x] **Auth Supabase** — Magic Link + Google OAuth, bouton dans le header
- [x] **Sauvegarde configs** — par utilisateur en base, chargement multi-appareils
- [x] **Rate limit IA** — 5 recherches/jour pour free (localStorage), illimité pour Pro
- [x] **Persistance localStorage** — state complet survit au refresh (`ow_state_v1`)
- [x] **Build Vite** — déployable sur Vercel
- [x] **Stripe Pro** — bouton « Passer Pro », modal, Checkout + webhook, MAJ `profiles.plan` (issue #9, setup Stripe manuel restant)

---

## 11. Repo GitHub

- **URL** : https://github.com/Chrisdesmurger/OffroadWatt
- **Branche principale** : `main`

---

## 12. Points d'attention

1. **Pas de framework** — `render()` réécrit l'innerHTML à chaque `set()`. Pour scaler, migrer vers React.
2. **`_catalogCache`** — variable module-level, perdu au refresh. Rechargé au boot via `loadCatalogFromDB()`.
3. **Rate limit IA** — implémenté en localStorage (client-side). Facile à contourner. Passer server-side avec Supabase Edge Function si nécessaire.
4. **Google OAuth** — nécessite configuration manuelle dans Supabase Dashboard + Google Cloud Console.
5. **`vtype`** — stocké en state mais pas encore utilisé dans les calculs ni les presets d'appareils.
6. **Edge Function** — Web APIs uniquement (pas de `require`, pas de `https` Node.js). `fetch` natif.
7. **`sbTypeToCat()`** — mapping regex `type Supabase → catégorie locale`. Si un type ne matche pas, l'item n'apparaît dans aucun filtre. À enrichir si besoin.
8. **Noms d'appareils** — stockés en français canonique dans le state/localStorage. `ta()` traduit à l'affichage. Les noms ajoutés manuellement (custom) ne sont pas dans `APPL` → affichés tels quels.

---

## 13. Pistes d'amélioration

### Court terme
- [ ] **Partage de configuration** — URL avec state encodé en base64
- [ ] **`vtype` actif** — ajuster presets et calculs selon camping-car / van / caravane
- [ ] **Rate limit IA server-side** — Supabase Edge Function pour enforcement côté serveur
- [ ] **Traduction noms custom** — les appareils ajoutés manuellement ne passent pas par `ta()`

### Moyen terme
- [ ] **Stripe** — paiement Pro (~4,99€/mois), webhook → update `profiles.plan`
- [ ] **Migration React + TypeScript** — composants `ApplianceManager`, `BatteryConfig`, etc.

### Long terme
- [ ] **PWA** — installable mobile (vite-plugin-pwa)
- [ ] **Monitoring BLE** — intégration Victron Connect
