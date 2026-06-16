// OffroadWatt — Calculateur d'autonomie électrique
// Vanilla JS / Vite
import { createClient } from '@supabase/supabase-js'
import { t, ta, getLang, setLang, initLang, localeCode, LANGS } from './i18n.js'

// Traduction des catégories et régions (les clés internes restent en français)
const tcat = (c) => t('cat.' + c)
const tregion = (r) => t('region.' + r)
const tbattype = (ty) => t('battype.' + ty)
// Convert Wh → Ah using the current battery voltage
const toAh = (wh) => { const v = S?.bat?.v || 12; const ah = wh / v; return ah >= 10 ? Math.round(ah) : +ah.toFixed(1) }

// ─── DATA ────────────────────────────────────────────────────────────────────

const BATS = [
  // AGM 12V — batteries plomb AGM du marché
  { ah: 60,  v: 12, label: '60 Ah 12V',  type: 'AGM', eur: 90   },
  { ah: 70,  v: 12, label: '70 Ah 12V',  type: 'AGM', eur: 110  },
  { ah: 80,  v: 12, label: '80 Ah 12V',  type: 'AGM', eur: 130  },
  { ah: 100, v: 12, label: '100 Ah 12V', type: 'AGM', eur: 160  },
  { ah: 105, v: 12, label: '105 Ah 12V', type: 'AGM', eur: 175  },
  { ah: 110, v: 12, label: '110 Ah 12V', type: 'AGM', eur: 185  },
  { ah: 120, v: 12, label: '120 Ah 12V', type: 'AGM', eur: 210  },
  { ah: 130, v: 12, label: '130 Ah 12V', type: 'AGM', eur: 240  },
  { ah: 140, v: 12, label: '140 Ah 12V', type: 'AGM', eur: 260  },
  { ah: 180, v: 12, label: '180 Ah 12V', type: 'AGM', eur: 340  },
  { ah: 200, v: 12, label: '200 Ah 12V', type: 'AGM', eur: 390  },
  // GEL 12V — batteries plomb gel du marché
  { ah: 75,  v: 12, label: '75 Ah 12V',  type: 'GEL', eur: 160  },
  { ah: 100, v: 12, label: '100 Ah 12V', type: 'GEL', eur: 200  },
  { ah: 120, v: 12, label: '120 Ah 12V', type: 'GEL', eur: 240  },
  { ah: 150, v: 12, label: '150 Ah 12V', type: 'GEL', eur: 290  },
  { ah: 200, v: 12, label: '200 Ah 12V', type: 'GEL', eur: 380  },
  { ah: 250, v: 12, label: '250 Ah 12V', type: 'GEL', eur: 480  },
  // Lithium 12V — batteries LiFePO4 du marché
  { ah: 50,  v: 12, label: '50 Ah 12V',  type: 'LI',  eur: 250  },
  { ah: 100, v: 12, label: '100 Ah 12V', type: 'LI',  eur: 380  },
  { ah: 120, v: 12, label: '120 Ah 12V', type: 'LI',  eur: 450  },
  { ah: 150, v: 12, label: '150 Ah 12V', type: 'LI',  eur: 520  },
  { ah: 200, v: 12, label: '200 Ah 12V', type: 'LI',  eur: 650  },
  { ah: 280, v: 12, label: '280 Ah 12V', type: 'LI',  eur: 850  },
  { ah: 300, v: 12, label: '300 Ah 12V', type: 'LI',  eur: 900  },
  { ah: 400, v: 12, label: '400 Ah 12V', type: 'LI',  eur: 1150 },
  { ah: 600, v: 12, label: '600 Ah 12V', type: 'LI',  eur: 1650 },
  // Lithium 24V — batteries LiFePO4 24V
  { ah: 50,  v: 24, label: '50 Ah 24V',  type: 'LI',  eur: 350  },
  { ah: 100, v: 24, label: '100 Ah 24V', type: 'LI',  eur: 550  },
  { ah: 150, v: 24, label: '150 Ah 24V', type: 'LI',  eur: 750  },
  { ah: 200, v: 24, label: '200 Ah 24V', type: 'LI',  eur: 950  },
  { ah: 280, v: 24, label: '280 Ah 24V', type: 'LI',  eur: 1250 },
  { ah: 300, v: 24, label: '300 Ah 24V', type: 'LI',  eur: 1350 },
  { ah: 400, v: 24, label: '400 Ah 24V', type: 'LI',  eur: 1700 },
]

// Coûts indicatifs marché européen pour le calcul système
const PANEL_EUR_PER_WC = 1.2  // panneau + fixation
const ALT_EUR_PER_A    = 8    // chargeur DC-DC (B2B) selon ampérage

// Types de batteries pour le filtre (ordre d'affichage)
const BAT_TYPES = [
  { id: 'AGM', label: 'AGM' },
  { id: 'GEL', label: 'Gel' },
  { id: 'LI',  label: 'Lithium' },
]

const DOD = { AGM: 0.5, GEL: 0.5, LI: 0.8 }
const PANELS = [80, 100, 150, 200, 250, 300, 400, 500]

const SUN_ZONES = [
  { r: 'Europe', n: 'Scandinavie', h: 2.5, eg: 'Oslo, Helsinki, Stockholm' },
  { r: 'Europe', n: 'Royaume-Uni', h: 3.0, eg: 'Londres, Dublin, Édimbourg' },
  { r: 'Europe', n: 'Bretagne / Normandie', h: 3.5, eg: 'Rennes, Caen, Nantes' },
  { r: 'Europe', n: 'Paris / Île-de-France', h: 4.0, eg: 'Paris, Reims, Orléans' },
  { r: 'Europe', n: 'Alsace / Suisse', h: 4.2, eg: 'Strasbourg, Bâle, Zurich' },
  { r: 'Europe', n: 'Bordeaux / Sud-Ouest', h: 4.8, eg: 'Bordeaux, Toulouse, Pau' },
  { r: 'Europe', n: 'Provence / PACA', h: 5.3, eg: 'Marseille, Nice, Toulon' },
  { r: 'Europe', n: 'Espagne Nord', h: 4.8, eg: 'Barcelone, Bilbao, Saragosse' },
  { r: 'Europe', n: 'Espagne Centre/Sud', h: 5.8, eg: 'Madrid, Séville, Grenade' },
  { r: 'Europe', n: 'Portugal', h: 5.5, eg: 'Lisbonne, Porto, Faro' },
  { r: 'Europe', n: 'Italie Centre', h: 5.0, eg: 'Rome, Florence, Bologne' },
  { r: 'Europe', n: 'Italie Sud / Sicile', h: 5.8, eg: 'Naples, Palerme, Catane' },
  { r: 'Europe', n: 'Grèce / Crète', h: 6.0, eg: 'Athènes, Thessalonique, Héraklion' },
  { r: 'Europe', n: 'Croatie / Balkans', h: 5.5, eg: 'Split, Dubrovnik, Sarajevo' },
  { r: 'Afrique & Moyen-Orient', n: 'Maroc Nord', h: 5.5, eg: 'Tanger, Fès, Casablanca' },
  { r: 'Afrique & Moyen-Orient', n: 'Maroc Sud', h: 6.5, eg: 'Marrakech, Agadir, Dakhla' },
  { r: 'Afrique & Moyen-Orient', n: 'Tunisie', h: 6.0, eg: 'Tunis, Djerba, Sfax' },
  { r: 'Afrique & Moyen-Orient', n: 'Algérie', h: 6.2, eg: 'Alger, Oran, Tamanrasset' },
  { r: 'Afrique & Moyen-Orient', n: 'Égypte', h: 7.0, eg: 'Le Caire, Louxor, Assouan' },
  { r: 'Afrique & Moyen-Orient', n: 'Sénégal / Mali', h: 6.5, eg: 'Dakar, Bamako, Saint-Louis' },
  { r: 'Afrique & Moyen-Orient', n: "Afrique de l'Est", h: 6.0, eg: 'Nairobi, Dar es Salaam' },
  { r: 'Afrique & Moyen-Orient', n: 'Afrique du Sud', h: 5.5, eg: 'Le Cap, Johannesburg, Durban' },
  { r: 'Afrique & Moyen-Orient', n: 'Émirats / Qatar', h: 7.0, eg: 'Dubaï, Abu Dhabi, Doha' },
  { r: 'Afrique & Moyen-Orient', n: 'Israël / Jordanie', h: 6.5, eg: 'Tel Aviv, Jérusalem, Aqaba' },
  { r: 'Amériques', n: 'Canada / Alaska', h: 3.0, eg: 'Montréal, Vancouver, Québec' },
  { r: 'Amériques', n: 'USA Nord-Est', h: 3.8, eg: 'New York, Boston, Philadelphie' },
  { r: 'Amériques', n: 'USA Sud-Est', h: 5.0, eg: 'Miami, Orlando, Atlanta' },
  { r: 'Amériques', n: 'USA Midwest', h: 4.5, eg: 'Chicago, Minneapolis, Denver' },
  { r: 'Amériques', n: 'USA Sud-Ouest', h: 6.5, eg: 'Phoenix, Las Vegas, Los Angeles' },
  { r: 'Amériques', n: 'Mexique', h: 6.0, eg: 'Cancún, Mexico, Oaxaca' },
  { r: 'Amériques', n: 'Colombie / Équateur', h: 5.0, eg: 'Bogotá, Medellín, Quito' },
  { r: 'Amériques', n: 'Brésil', h: 5.5, eg: 'Rio de Janeiro, São Paulo, Bahia' },
  { r: 'Amériques', n: 'Argentine / Chili', h: 4.5, eg: 'Buenos Aires, Santiago, Mendoza' },
  { r: 'Asie-Pacifique', n: 'Australie Sud-Est', h: 5.0, eg: 'Sydney, Melbourne, Brisbane' },
  { r: 'Asie-Pacifique', n: 'Australie Nord', h: 7.0, eg: 'Darwin, Cairns, Alice Springs' },
  { r: 'Asie-Pacifique', n: 'Nouvelle-Zélande', h: 4.5, eg: 'Auckland, Wellington, Christchurch' },
  { r: 'Asie-Pacifique', n: 'Thaïlande / Vietnam', h: 5.5, eg: 'Bangkok, Chiang Mai, Hô Chi Minh' },
  { r: 'Asie-Pacifique', n: 'Japon / Corée', h: 3.8, eg: 'Tokyo, Osaka, Séoul' },
  { r: 'Asie-Pacifique', n: 'Inde du Nord', h: 5.5, eg: 'New Delhi, Rajasthan, Jaipur' },
  { r: 'Asie-Pacifique', n: 'Inde du Sud', h: 6.0, eg: 'Mumbai, Goa, Bangalore' },
  { r: 'Personnalisé', n: 'Personnalisé', h: 0, eg: '' },
]

let CATALOG = []  // chargé 100% depuis Supabase au boot (loadCatalogFromDB)
const ICON_BY_CAT = {
  'Réfrigérateur':    'ti-device-fridge',
  'Micro-onde':       'ti-microwave',
  'Four':             'ti-flame',
  'Chauffe-eau':      'ti-droplet',
  'Chauffage':        'ti-temperature',
  'Chargeur solaire': 'ti-solar-panel',
  'Chargeur DC-DC':   'ti-current-dc',
  'Onduleur':         'ti-current-ac',
  'Télévision':       'ti-device-tv',
  'Satellite':        'ti-satellite',
  'Box internet':     'ti-wifi',
  'Pompe à eau':      'ti-droplet-half',
  'Chargeur batterie':'ti-battery-charging',
}

const CATS = ['Tout', 'Réfrigérateur', 'Micro-onde', 'Four', 'Chauffe-eau', 'Chauffage', 'Chargeur solaire', 'Chargeur DC-DC', 'Onduleur', 'Télévision', 'Satellite', 'Box internet', 'Pompe à eau', 'Chargeur batterie']
const CATICONS = {
  Tout: 'ti-apps',
  'Réfrigérateur': 'ti-device-fridge', 'Micro-onde': 'ti-microwave', 'Four': 'ti-flame',
  'Chauffe-eau': 'ti-droplet', 'Chauffage': 'ti-temperature', 'Chargeur solaire': 'ti-solar-panel',
  'Chargeur DC-DC': 'ti-current-dc', 'Onduleur': 'ti-current-ac', 'Télévision': 'ti-device-tv',
  'Satellite': 'ti-satellite', 'Box internet': 'ti-wifi', 'Pompe à eau': 'ti-droplet-half',
  'Chargeur batterie': 'ti-battery-charging',
}

// ─── PRESETS PAR TYPE DE VÉHICULE ──────────────────────────────────────────────
// Jeux d'appareils par défaut adaptés au profil de consommation de chaque véhicule.
// `batMinAh` = capacité lithium 12V minimale recommandée pour ce profil.
// `altOn`    = recharge alternateur active par défaut (les caravanes n'en ont pas).
// Les `id` sont attribués dynamiquement à l'application (voir applyVtypePreset).

const VTYPE_PRESETS = {
  // Van aménagé — setup léger et nomade : 12V partout, pas de gros 230V.
  van: {
    altOn: true, batMinAh: 100,
    apps: [
      { n: 'Réfrigérateur compresseur 12V 40L', icon: 'ti-fridge',         w: 45, h: 24,  cat: 'Cuisine'   },
      { n: 'Spots LED encastrés ×4',            icon: 'ti-lamp',           w: 12, h: 4,   cat: 'Éclairage' },
      { n: 'Éclairage LED bande 5m',            icon: 'ti-bulb',           w: 12, h: 4,   cat: 'Éclairage' },
      { n: 'Pompe à eau',                       icon: 'ti-droplet',        w: 30, h: 0.5, cat: 'Eau'       },
      { n: 'Laptop',                            icon: 'ti-device-laptop',  w: 65, h: 4,   cat: 'Tech'      },
      { n: 'Smartphone ×2',                     icon: 'ti-device-mobile',  w: 15, h: 3,   cat: 'Tech'      },
      { n: 'Routeur 4G',                        icon: 'ti-wifi',           w: 10, h: 24,  cat: 'Tech'      },
      { n: 'Ventilateur plafond 12V',           icon: 'ti-wind',           w: 22, h: 6,   cat: 'Confort'   },
      { n: 'Régulateur MPPT',                   icon: 'ti-solar-panel',    w: 5,  h: 24,  cat: 'Système'   },
      { n: 'BMS batterie Lithium',              icon: 'ti-battery-charging',w: 3, h: 24,  cat: 'Système'   },
    ],
  },
  // Camping-car — setup complet et confortable : appareils 230V + chauffage.
  campervan: {
    altOn: true, batMinAh: 200,
    apps: [
      { n: 'Réfrigérateur compresseur 12V 75L', icon: 'ti-fridge',         w: 55,  h: 24,   cat: 'Cuisine'   },
      { n: 'Micro-ondes',                       icon: 'ti-microwave',      w: 900, h: 0.25, cat: 'Cuisine'   },
      { n: 'Télévision 24" LED',                icon: 'ti-device-tv',      w: 25,  h: 3,    cat: 'Tech'      },
      { n: 'Plafonnier LED 12V principal',      icon: 'ti-bulb',           w: 12,  h: 5,    cat: 'Éclairage' },
      { n: 'Spots LED encastrés ×6',            icon: 'ti-lamp',           w: 18,  h: 4,    cat: 'Éclairage' },
      { n: 'Pompe à eau',                       icon: 'ti-droplet',        w: 50,  h: 0.5,  cat: 'Eau'       },
      { n: 'Chauffage diesel 2kW',              icon: 'ti-temperature',    w: 10,  h: 8,    cat: 'Confort',
        modes: [
          { label: 'Veille / allumage', watts: 10 },
          { label: 'Puissance min',     watts: 30 },
          { label: 'Puissance max',     watts: 80 },
        ], activeMode: 0 },
      { n: 'Aérateur de toit 12V',              icon: 'ti-wind',           w: 35,  h: 6,    cat: 'Confort'   },
      { n: 'Laptop',                            icon: 'ti-device-laptop',  w: 65,  h: 4,    cat: 'Tech'      },
      { n: 'Smartphone ×2',                     icon: 'ti-device-mobile',  w: 15,  h: 3,    cat: 'Tech'      },
      { n: 'Routeur 4G',                        icon: 'ti-wifi',           w: 10,  h: 24,   cat: 'Tech'      },
      { n: 'Régulateur MPPT',                   icon: 'ti-solar-panel',    w: 5,   h: 24,   cat: 'Système'   },
      { n: 'BMS batterie Lithium',              icon: 'ti-battery-charging',w: 3,  h: 24,   cat: 'Système'   },
    ],
  },
  // Caravane — profil proche du camping-car mais SANS alternateur (pas de moteur).
  caravan: {
    altOn: false, batMinAh: 150,
    apps: [
      { n: 'Réfrigérateur à absorption 3 voies 90L', icon: 'ti-fridge',     w: 180, h: 24,  cat: 'Cuisine'   },
      { n: 'Télévision 24" LED',                icon: 'ti-device-tv',      w: 25,  h: 3,    cat: 'Tech'      },
      { n: 'Plafonnier LED 12V principal',      icon: 'ti-bulb',           w: 12,  h: 5,    cat: 'Éclairage' },
      { n: 'Spots LED encastrés ×4',            icon: 'ti-lamp',           w: 12,  h: 4,    cat: 'Éclairage' },
      { n: 'Pompe à eau',                       icon: 'ti-droplet',        w: 30,  h: 0.5,  cat: 'Eau'       },
      { n: 'Chauffage gaz + électronique (Truma Combi 4)', icon: 'ti-temperature', w: 15, h: 24, cat: 'Confort',
        modes: [
          { label: 'Veille électronique', watts: 3  },
          { label: 'Ventilateur min',     watts: 8  },
          { label: 'Ventilateur max',     watts: 25 },
        ], activeMode: 1 },
      { n: 'Smartphone ×2',                     icon: 'ti-device-mobile',  w: 15,  h: 3,    cat: 'Tech'      },
      { n: 'Routeur 4G',                        icon: 'ti-wifi',           w: 10,  h: 24,   cat: 'Tech'      },
      { n: 'Régulateur MPPT',                   icon: 'ti-solar-panel',    w: 5,   h: 24,   cat: 'Système'   },
    ],
  },
}

// Instancie les appareils d'un preset avec des id uniques (clone profond léger).
function instantiatePresetApps(vtype) {
  const preset = VTYPE_PRESETS[vtype]
  if (!preset) return []
  const base = Date.now()
  return preset.apps.map((a, i) => ({
    id: base + i,
    n: a.n, icon: a.icon, w: a.w, h: a.h, on: true, cat: a.cat,
    ...(a.modes ? { modes: a.modes.map(m => ({ ...m })), activeMode: a.activeMode ?? 0 } : {}),
  }))
}

// Plus petite batterie du type demandé couvrant la capacité minimale recommandée.
function recommendedBatForVtype(vtype, type = 'LI') {
  const minAh = VTYPE_PRESETS[vtype]?.batMinAh || 100
  const candidates = BATS.filter(b => b.type === type && b.v === 12).sort((a, b) => a.ah - b.ah)
  return candidates.find(b => b.ah >= minAh) || candidates[candidates.length - 1] || null
}

// ─── ONBOARDING (#17) ──────────────────────────────────────────────────────────
// Usages optionnels proposés à l'étape 2 du wizard. Chaque usage déclare un
// prédicat qui identifie les appareils correspondants dans un preset vtype.
// Les appareils essentiels (frigo, éclairage, eau, système) sont toujours gardés.
const USAGES = [
  { id: 'cooking', icon: 'ti-microwave',     match: (n) => /micro-ondes|plaque|bouilloire|cafetière|café|four/i.test(n) },
  { id: 'tv',      icon: 'ti-device-tv',     match: (n) => /télévision|tv|box tnt/i.test(n) },
  { id: 'work',    icon: 'ti-device-laptop', match: (n) => /laptop|routeur|tablette|imprimante/i.test(n) },
  { id: 'heating', icon: 'ti-temperature',   match: (n) => /chauffage|truma|webasto|eberspächer|autoterm|radiateur/i.test(n) },
]
const USAGE_IDS = USAGES.map(u => u.id)

// Budgets batterie proposés à l'étape 3 → (type, multiplicateur de capacité min).
const WIZARD_BUDGETS = [
  { id: 'low',  type: 'AGM', mult: 1   },
  { id: 'mid',  type: 'LI',  mult: 1   },
  { id: 'high', type: 'LI',  mult: 1.5 },
]

const ONBOARDED_KEY = 'ow_onboarded'

// Choisit une batterie selon le véhicule et le budget retenu.
function batForBudget(vtype, budgetId) {
  const b = WIZARD_BUDGETS.find(x => x.id === budgetId) || WIZARD_BUDGETS[1]
  const targetAh = (VTYPE_PRESETS[vtype]?.batMinAh || 100) * b.mult
  const candidates = BATS.filter(x => x.type === b.type && x.v === 12).sort((a, c) => a.ah - c.ah)
  return candidates.find(x => x.ah >= targetAh) || candidates[candidates.length - 1] || BATS[1]
}

// Finalise le wizard : applique vtype + usages + budget puis marque l'onboarding fait.
function finishWizard(w) {
  const vtype = w.vtype || 'campervan'
  let apps = instantiatePresetApps(vtype)
  // Retire les appareils des usages optionnels non sélectionnés
  const selected = new Set(w.usages || [])
  apps = apps.filter(a => {
    const usage = USAGES.find(u => u.match(a.n))
    return usage ? selected.has(usage.id) : true
  })
  const bat = batForBudget(vtype, w.budget)
  // Solaire : 'have' / 'want' activent les panneaux, 'no' les désactive
  const solOn = w.solar ? (w.solar !== 'no') : true
  // Sans panneaux, retirer le régulateur MPPT des consommateurs (cohérent avec le toggle solaire)
  if (!solOn) apps = apps.filter(a => !/mppt|régulateur/i.test(a.n))
  try { localStorage.setItem(ONBOARDED_KEY, '1') } catch (_) {}
  set({
    vtype, apps, solOn,
    altOn: VTYPE_PRESETS[vtype]?.altOn ?? true,
    bat, batType: bat.type, dod: DOD[bat.type], batNb: 1,
    modal: null, tab: 'energy',
  })
}

function skipWizard() {
  try { localStorage.setItem(ONBOARDED_KEY, '1') } catch (_) {}
  set({ modal: null })
}

// ─── SUPABASE ─────────────────────────────────────────────────────────────────

const SB_URL  = 'https://ofjpskrjlwfebaqomijm.supabase.co'
const SB_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9manBza3JqbHdmZWJhcW9taWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODIzMTMsImV4cCI6MjA5NTY1ODMxM30.R2hqPwmvihdgVv7rwLp0r--Jo0Qp6m6ORc-PU4M58n8'

// Client Supabase (auth + requêtes authentifiées)
const supabase = createClient(SB_URL, SB_KEY)

// ─── AUTH ─────────────────────────────────────────────────────────────────────

async function initAuth() {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user) await onSignIn(session.user)

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) await onSignIn(session.user)
    if (event === 'SIGNED_OUT') set({ user: null, userConfigs: [] })
  })
}

async function onSignIn(user) {
  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  const plan = profile?.plan || 'free'
  set({ user: { id: user.id, email: user.email, plan }, modal: null, authLoading: false })
  loadUserConfigs()
}

async function loadUserConfigs() {
  const { data } = await supabase.from('user_configs').select('id, name, created_at, updated_at').order('updated_at', { ascending: false })
  if (data) set({ userConfigs: data })
}

async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
}

async function signInWithEmail(email) {
  set({ authLoading: true })
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  })
  if (error) { set({ authLoading: false }); alert(t('alert.error') + error.message); return }
  set({ authLoading: false, modal: { type: 'auth-sent', email } })
}

async function signOut() {
  await supabase.auth.signOut()
  set({ user: null, userConfigs: [] })
}

async function saveCurrentConfig(name) {
  if (!S.user) { set({ modal: { type: 'auth' } }); return }
  set({ saveLoading: true })

  const stateToSave = {
    vtype: S.vtype, apps: S.apps, bat: S.bat, batNb: S.batNb, dod: S.dod, batType: S.batType,
    solOn: S.solOn, solW: S.solW, solNb: S.solNb, solEff: S.solEff, sunIdx: S.sunIdx, customSunH: S.customSunH,
    altOn: S.altOn, altAmps: S.altAmps, altHours: S.altHours,
  }

  const isFree = S.user.plan === 'free'
  if (isFree && S.userConfigs.length >= 1) {
    await supabase.from('user_configs').update({ name, state: stateToSave, updated_at: new Date().toISOString() }).eq('id', S.userConfigs[0].id)
  } else {
    await supabase.from('user_configs').insert({ user_id: S.user.id, name, state: stateToSave })
  }

  await loadUserConfigs()
  set({ saveLoading: false, modal: null })
}

async function loadConfig(configId) {
  const { data } = await supabase.from('user_configs').select('state').eq('id', configId).single()
  if (!data?.state) return
  const st = data.state
  const bat = BATS.find(b => b.ah === st.bat?.ah && b.v === st.bat?.v) || BATS[4]
  set({ ...st, bat, modal: null, tab: 'energy' })
}

async function deleteConfig(configId) {
  await supabase.from('user_configs').delete().eq('id', configId)
  await loadUserConfigs()
}

// ─── STATE ───────────────────────────────────────────────────────────────────

let S = {
  vtype: 'campervan',
  apps: [
    { id: 4,             n: 'Laptop',                   icon: 'ti-device-laptop',  w: 65,  h: 4,    on: true, cat: 'Tech'      },
    { id: 5,             n: 'Smartphone ×2',            icon: 'ti-device-mobile',  w: 15,  h: 3,    on: true, cat: 'Tech'      },
    { id: 6,             n: 'Pompe à eau',              icon: 'ti-droplet',        w: 50,  h: 0.5,  on: true, cat: 'Eau'       },
    { id: 7,             n: 'Micro-ondes',              icon: 'ti-microwave',      w: 900, h: 0.25, on: true, cat: 'Cuisine'   },
    { id: 8,             n: 'Routeur 4G',               icon: 'ti-wifi',           w: 10,  h: 24,   on: true, cat: 'Tech'      },
    { id: 1780115079731, n: 'Dometic RDC 70 (Dometic)', icon: 'ti-bowl-spoon',     w: 45,  h: 24,   on: true, cat: 'Cuisine',
      modes: [
        { label: '12V veille/non-refroidissement',    watts: 5  },
        { label: 'Compresseur 12V refroidissement',   watts: 45 },
        { label: 'Chauffage anti-condensation',       watts: 15 },
      ], activeMode: 1 },
    { id: 1780115116303, n: 'Spots LED encastrés ×4',  icon: 'ti-lamp',            w: 20,  h: 4,    on: true, cat: 'Éclairage' },
    { id: 1780115130898, n: 'Éclairage LED bande 5m',  icon: 'ti-bulb',            w: 12,  h: 5,    on: true, cat: 'Éclairage' },
    { id: 1780115154949, n: 'Truma Combi 4 (Truma)',   icon: 'ti-temperature',     w: 15,  h: 24,   on: true, cat: 'Confort',
      modes: [
        { label: 'Veille électronique',              watts: 3  },
        { label: 'Ventilateur min',                  watts: 8  },
        { label: 'Ventilateur max',                  watts: 25 },
        { label: 'Pompe circulation eau chaude',     watts: 15 },
      ], activeMode: 3 },
    { id: 1780115201375, n: 'Régulateur MPPT',         icon: 'ti-solar-panel',     w: 5,   h: 24,   on: true, cat: 'Système'   },
    { id: 1780115206090, n: 'BMS batterie Lithium',    icon: 'ti-battery-charging',w: 3,   h: 24,   on: true, cat: 'Système'   },
  ],
  bat: BATS[1], batNb: 1, dod: 0.8, batType: 'AGM',
  solOn: true, solW: 200, solNb: 2, solEff: 0.85, sunIdx: 35, customSunH: '',
  altOn: true, altAmps: 20, altHours: 2,
  modal: null, tab: 'energy', catFilter: 'Tout',
  user: null, userConfigs: [], authLoading: false, saveLoading: false, summaryLoading: false,
  scenarios: { A: null, B: null }, hookupCost: 4,
}

// ─── PERSISTENCE ─────────────────────────────────────────────────────────────

const LS_KEY = 'ow_state_v1'

function persistState() {
  try {
    const snap = {
      vtype: S.vtype,
      apps: S.apps,
      bat: { ah: S.bat.ah, v: S.bat.v },
      batNb: S.batNb,
      dod: S.dod,
      batType: S.batType,
      solOn: S.solOn,
      solW: S.solW, solNb: S.solNb, solEff: S.solEff, sunIdx: S.sunIdx, customSunH: S.customSunH,
      altOn: S.altOn, altAmps: S.altAmps, altHours: S.altHours,
      catFilter: S.catFilter,
      hookupCost: S.hookupCost,
      scenarios: S.scenarios,
    }
    localStorage.setItem(LS_KEY, JSON.stringify(snap))
  } catch (_) {}
}

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return
    const p = JSON.parse(raw)
    const bat = BATS.find(b => b.ah === p.bat?.ah && b.v === p.bat?.v) || S.bat
    Object.assign(S, {
      vtype: p.vtype || S.vtype,
      apps: Array.isArray(p.apps) && p.apps.length ? p.apps : S.apps,
      bat,
      batNb: p.batNb ?? S.batNb,
      dod: p.dod ?? S.dod,
      batType: p.batType ?? (bat ? bat.type : S.batType),
      solOn: p.solOn ?? S.solOn,
      solW: p.solW ?? S.solW,
      solNb: p.solNb ?? S.solNb,
      solEff: p.solEff ?? S.solEff,
      sunIdx: p.sunIdx ?? S.sunIdx,
      customSunH: p.customSunH ?? S.customSunH,
      altOn: p.altOn ?? S.altOn,
      altAmps: p.altAmps ?? S.altAmps,
      altHours: p.altHours ?? S.altHours,
      catFilter: p.catFilter ?? S.catFilter,
      hookupCost: p.hookupCost ?? S.hookupCost,
      scenarios: p.scenarios ?? S.scenarios,
    })
  } catch (_) {}
}

// ─── PARTAGE PAR URL (#13) ───────────────────────────────────────────────────

// Sérialise la configuration courante (même forme que le snapshot persisté)
function shareSnapshot() {
  return {
    vtype: S.vtype,
    apps: S.apps,
    bat: { ah: S.bat.ah, v: S.bat.v },
    batNb: S.batNb,
    dod: S.dod,
    batType: S.batType,
    solOn: S.solOn,
    solW: S.solW, solNb: S.solNb, solEff: S.solEff, sunIdx: S.sunIdx, customSunH: S.customSunH,
    altOn: S.altOn, altAmps: S.altAmps, altHours: S.altHours,
    hookupCost: S.hookupCost,
  }
}

// Encode le state en base64 (UTF-8 sûr via encodeURIComponent)
function encodeState(snap = shareSnapshot()) {
  try { return btoa(encodeURIComponent(JSON.stringify(snap))) } catch (_) { return '' }
}

// Décode un paramètre base64 vers un objet de configuration partiel
function decodeState(param) {
  try { return JSON.parse(decodeURIComponent(atob(param))) } catch (_) { return null }
}

// Applique une configuration décodée sur le state (même logique que loadPersistedState)
function applyDecodedState(p) {
  if (!p || typeof p !== 'object') return false
  const bat = BATS.find(b => b.ah === p.bat?.ah && b.v === p.bat?.v) || S.bat
  Object.assign(S, {
    vtype: p.vtype || S.vtype,
    apps: Array.isArray(p.apps) && p.apps.length ? p.apps : S.apps,
    bat,
    batNb: p.batNb ?? S.batNb,
    dod: p.dod ?? S.dod,
    batType: p.batType ?? (bat ? bat.type : S.batType),
    solOn: p.solOn ?? S.solOn,
    solW: p.solW ?? S.solW,
    solNb: p.solNb ?? S.solNb,
    solEff: p.solEff ?? S.solEff,
    sunIdx: p.sunIdx ?? S.sunIdx,
    customSunH: p.customSunH ?? S.customSunH,
    altOn: p.altOn ?? S.altOn,
    altAmps: p.altAmps ?? S.altAmps,
    altHours: p.altHours ?? S.altHours,
    hookupCost: p.hookupCost ?? S.hookupCost,
  })
  return true
}

// Au boot, charge une config depuis ?c= — priorité sur localStorage
function loadStateFromURL() {
  try {
    const param = new URLSearchParams(window.location.search).get('c')
    if (!param) return false
    if (!applyDecodedState(decodeState(param))) return false
    persistState()
    // Nettoie l'URL pour ne pas re-partager un lien obsolète au refresh
    window.history.replaceState({}, '', window.location.pathname)
    return true
  } catch (_) { return false }
}

// Toast éphémère réutilisable (auto-disparait)
function showToast(msg) {
  let el = document.getElementById('ow-toast')
  if (!el) {
    el = document.createElement('div')
    el.id = 'ow-toast'
    el.className = 'ow-toast'
    document.body.appendChild(el)
  }
  el.textContent = msg
  // force reflow pour rejouer la transition si déjà visible
  void el.offsetWidth
  el.classList.add('show')
  clearTimeout(showToast._t)
  showToast._t = setTimeout(() => el.classList.remove('show'), 2400)
}

// Copie un texte dans le presse-papier (avec fallback execCommand)
async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true }
  } catch (_) {}
  try {
    const tmp = document.createElement('textarea')
    tmp.value = text
    tmp.style.position = 'fixed'; tmp.style.opacity = '0'
    document.body.appendChild(tmp)
    tmp.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(tmp)
    return ok
  } catch (_) { return false }
}

// Lien long auto-suffisant (base64) — secours si la création du lien court échoue
function longShareUrl() {
  return `${window.location.origin}${window.location.pathname}?c=${encodeState()}`
}

// Génère un code court aléatoire sans caractères ambigus
function genShareCode(len = 7) {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789'
  let s = ''
  try {
    const arr = new Uint32Array(len)
    crypto.getRandomValues(arr)
    for (let i = 0; i < len; i++) s += chars[arr[i] % chars.length]
  } catch (_) {
    for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  }
  return s
}

// Stocke la config dans Supabase et renvoie un lien court ?s=code
async function createShortLink() {
  const snap = shareSnapshot()
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = genShareCode()
    const { error } = await supabase.from('shared_configs').insert({ code, state: snap })
    if (!error) return `${window.location.origin}${window.location.pathname}?s=${code}`
    // 23505 = collision de clé primaire → on régénère un code
    if (error.code !== '23505') throw error
  }
  throw new Error('short link: too many collisions')
}

// Ouvre la fenêtre de partage et génère le lien court en arrière-plan
async function openShareModal() {
  set({ modal: { type: 'share', loading: true } })
  let url
  try { url = await createShortLink() }
  catch (_) { url = longShareUrl() }
  // L'utilisateur a peut-être fermé la modale entre-temps
  if (S.modal?.type !== 'share') return
  set({ modal: { type: 'share', loading: false, url } })
}

// Au boot, charge une config depuis un lien court ?s=code (asynchrone)
async function loadShortLink() {
  try {
    const code = new URLSearchParams(window.location.search).get('s')
    if (!code) return
    const { data, error } = await supabase.from('shared_configs').select('state').eq('code', code).single()
    if (error || !data?.state) return
    if (!applyDecodedState(data.state)) return
    persistState()
    window.history.replaceState({}, '', window.location.pathname)
    render()
    showToast(t('share.loaded'))
  } catch (_) {}
}

// ─── CORE ────────────────────────────────────────────────────────────────────

const set = (u) => { Object.assign(S, u); persistState(); render() }
const sunHOf = (st) => st.sunIdx === SUN_ZONES.length - 1 ? (parseFloat(st.customSunH) || 4.5) : SUN_ZONES[st.sunIdx].h
const sunH = () => sunHOf(S)

const ALT_EFF = 0.7 // rendement régulateur/pertes câbles

function calc(st = S) {
  const active = st.apps.filter(a => a.on)
  const cons = active.reduce((s, a) => s + a.w * a.h, 0)
  const solar = st.solOn === false ? 0 : st.solW * st.solNb * sunHOf(st) * st.solEff
  const alt = st.altOn ? st.altAmps * st.bat.v * st.altHours * ALT_EFF : 0
  const recharge = solar + alt
  const net = Math.max(0, cons - recharge)
  const batWhUnit = st.bat.ah * st.bat.v
  const batWhTotal = batWhUnit * st.batNb
  const usable = batWhTotal * st.dod
  const autDays = net > 0 ? usable / net : Infinity
  const solCovPct = cons > 0 ? Math.min(100, recharge / cons * 100) : 100
  return { cons, solar, alt, recharge, net, batWhUnit, batWhTotal, usable, autDays, solCovPct, breakdown: active.map(a => ({ ...a, wh: Math.round(a.w * a.h) })) }
}

// Coût du système énergétique (batteries + solaire + alternateur)
function systemCost(st = S) {
  const batCost = (st.bat.eur || 0) * st.batNb
  const solCost = st.solOn === false ? 0 : Math.round(st.solW * st.solNb * PANEL_EUR_PER_WC)
  const altCost = st.altOn ? Math.round(st.altAmps * ALT_EUR_PER_A) : 0
  return { batCost, solCost, altCost, total: batCost + solCost + altCost }
}

// Capture une copie figée de la configuration énergétique courante
function snapshotState(label) {
  const snap = JSON.parse(JSON.stringify({
    vtype: S.vtype, apps: S.apps, bat: S.bat, batNb: S.batNb, dod: S.dod, batType: S.batType,
    solOn: S.solOn, solW: S.solW, solNb: S.solNb, solEff: S.solEff, sunIdx: S.sunIdx, customSunH: S.customSunH,
    altOn: S.altOn, altAmps: S.altAmps, altHours: S.altHours,
  }))
  snap.label = label
  return snap
}

function captureScenario(slot) {
  const snap = snapshotState(slot === 'A' ? 'Setup A' : 'Setup B')
  set({ scenarios: { ...S.scenarios, [slot]: snap }, tab: 'compare' })
}

// Applique le preset d'appareils correspondant au type de véhicule.
// Remplace les appareils, ajuste l'alternateur et remonte la batterie si
// elle est en dessous du minimum recommandé pour ce profil.
function applyVtypePreset(vtype) {
  const preset = VTYPE_PRESETS[vtype]
  if (!preset) { set({ vtype, modal: null }); return }
  const apps = instantiatePresetApps(vtype)
  const update = { vtype, apps, altOn: preset.altOn, modal: null, tab: 'energy' }
  // Recommander une batterie lithium adaptée si la capacité actuelle est trop faible
  const rec = recommendedBatForVtype(vtype, S.bat?.type || 'LI')
  if (rec && (S.bat?.ah || 0) * (S.batNb || 1) < preset.batMinAh) {
    update.bat = rec
    update.batType = rec.type
    update.dod = DOD[rec.type]
    update.batNb = 1
  }
  set(update)
}

const fmtDays = (d) => isFinite(d) ? (d < 1 ? (d * 24).toFixed(1) + ' h' : d.toFixed(1) + ' j') : '∞'

// ─── RENDER ──────────────────────────────────────────────────────────────────

function render() {
  document.getElementById('root').innerHTML = buildHTML()
  bindEvents()
}

function buildMobBar() {
  const { cons, recharge, net, usable, autDays, solCovPct } = calc()
  const isDanger = net > usable
  const color = isDanger ? 'var(--rd)' : 'var(--te)'
  let autVal, autUnit
  if (!isFinite(autDays)) {
    autVal = '∞'; autUnit = t('unit.days')
  } else if (autDays < 1) {
    autVal = (autDays * 24).toFixed(1); autUnit = t('unit.hours')
  } else {
    autVal = autDays.toFixed(1); autUnit = t('unit.days')
  }
  const consAh = toAh(cons)
  const solarPill = S.solOn && cons > 0
    ? `<span class="mob-bar-sep">·</span><span class="mob-bar-pill" style="color:var(--so)"><i class="ti ti-sun"></i>${Math.round(solCovPct)}%</span>`
    : ''
  const warnPill = isDanger
    ? `<span class="mob-bar-warn"><i class="ti ti-alert-triangle" style="font-size:10px"></i>${t('autonomy.insufficient')}</span>`
    : ''
  return `<div class="mob-bar">
    <i class="ti ti-clock" style="color:${color};font-size:13px;flex-shrink:0"></i>
    <span class="mob-bar-val" style="color:${color}">${autVal}</span>
    <span class="mob-bar-unit">${autUnit}</span>
    <span class="mob-bar-sep">·</span>
    <span class="mob-bar-pill"><i class="ti ti-plug"></i>${consAh} Ah/j</span>
    ${solarPill}
    ${warnPill}
  </div>`
}

function buildHTML() {
  return `
    ${buildMobBar()}
    ${S.modal ? buildModal() : ''}
    ${buildHeader()}
    ${buildTabs()}
    ${S.tab === 'apps'    ? buildAppsTab()    : ''}
    ${S.tab === 'energy'  ? buildEnergyTab()  : ''}
    ${S.tab === 'compare' ? buildCompareTab() : ''}
  `
}

function buildHeader() {
  const authEl = S.user
    ? `<div class="auth-btn on" id="open-configs" title="${t('auth.myconfigs')}">
        <i class="ti ti-user-circle" style="font-size:15px"></i>
        <span class="auth-lbl">${S.user.email.split('@')[0]}</span>
        ${S.user.plan === 'pro' ? '<span class="pro-badge">PRO</span>' : ''}
        <i class="ti ti-chevron-down" style="font-size:10px;color:var(--t3)"></i>
      </div>`
    : `<button class="auth-btn" id="open-auth" title="${t('auth.signin')}">
        <i class="ti ti-user" style="font-size:14px"></i>
        <span class="auth-lbl">${t('auth.signin')}</span>
      </button>`

  const shareEl = `<button class="hdr-share-btn" id="share-header-btn" title="${t('share.config')}">
    <i class="ti ti-share" style="font-size:14px"></i>
    <span class="hdr-share-lbl">${t('share.headerBtn')}</span>
  </button>`

  const langEl = `<div class="lang-switch">
    ${LANGS.map(l => `<button class="lang-opt${getLang() === l.id ? ' on' : ''}" data-lang="${l.id}" title="${l.name}">${l.label}</button>`).join('')}
  </div>`

  return `
  <div class="hdr">
    <div>
      <div class="logo">OFFROAD<em>WATT</em></div>
      <div class="sub">${t('app.tagline')}</div>
    </div>
    <div class="vtypes">
      ${[['campervan','ti-camper','vt.campervan'],['caravan','ti-caravan','vt.caravan'],['van','ti-car','vt.van']].map(([v,ic,lb]) => `
        <div class="vt${S.vtype === v ? ' on' : ''}" data-vtype="${v}">
          <i class="ti ${ic}"></i><span>${t(lb)}</span>
        </div>`).join('')}
      ${shareEl}
      ${langEl}
      ${authEl}
    </div>
  </div>`
}

function buildTabs() {
  return `
  <div class="tabs">
    ${[['energy','ti-bolt','Dashboard'],['apps','ti-plug','Appareils'],['compare','ti-arrows-diff','Comparer']].map(([k,ic,lb]) => `
      <div class="tab${S.tab === k ? ' on' : ''}" data-tab="${k}"><i class="ti ${ic}"></i>${lb}</div>`).join('')}
  </div>`
}

// ── APPS TAB ─────────────────────────────────────────────────────────────────

function buildAppsTab() {
  return buildAppsCard()
}

// ── ENERGY TAB ───────────────────────────────────────────────────────────────

function buildAppRow(a) {
  const hasModes = a.modes && a.modes.length > 1
  if (hasModes) {
    return `
    <div class="arow has-modes${!a.on ? ' off' : ''}">
      <button class="tog${a.on ? ' on' : ''}" data-toggle="${a.id}"></button>
      <i class="${a.icon} ai"></i>
      <span class="an" title="${ta(a.n)}">${ta(a.n)}</span>
      <div class="hf"><input type="number" min="0" max="24" step="0.5" value="${a.h}" data-id="${a.id}" data-field="h" class="fi"><span>${t('unit.hday')}</span></div>
      <span class="wh">${a.on ? toAh(a.w * a.h) : 0} Ah</span>
      <button class="delbtn" data-del="${a.id}"><i class="ti ti-trash" style="font-size:12px"></i></button>
      <div class="mode-btns">
        ${a.modes.map((m, mi) => `
          <button class="modebtn${a.activeMode === mi ? ' on' : ''}" data-mode-id="${a.id}" data-mode-idx="${mi}">
            <span class="modew">${m.watts}W</span>
            <span class="model">${(l => l.length > 12 ? l.slice(0, 11) + '…' : l)(ta(m.label))}</span>
          </button>`).join('')}
      </div>
    </div>`
  }
  return `
  <div class="arow two-row${!a.on ? ' off' : ''}">
    <button class="tog${a.on ? ' on' : ''}" data-toggle="${a.id}"></button>
    <i class="${a.icon} ai"></i>
    <span class="an" title="${ta(a.n)}">${ta(a.n)}</span>
    <span class="wh">${a.on ? toAh(a.w * a.h) : 0} Ah</span>
    <button class="delbtn" data-del="${a.id}"><i class="ti ti-trash" style="font-size:12px"></i></button>
    <div class="row-inputs">
      <div class="wf"><input type="number" min="0" max="5000" value="${a.w}" data-id="${a.id}" data-field="w" class="fi"><span>W</span></div>
      <div class="hf"><input type="number" min="0" max="24" step="0.5" value="${a.h}" data-id="${a.id}" data-field="h" class="fi"><span>${t('unit.hday')}</span></div>
    </div>
  </div>`
}

function buildAppsCard() {
  const total = S.apps.filter(a => a.on).reduce((s, a) => s + a.w * a.h, 0)
  const active = S.apps.filter(a => a.on)
  // Liste unique triée automatiquement par sous-catégorie (ordre = CATS hors 'Tout')
  const order = CATS.filter(c => c !== 'Tout')
  const cats = [...new Set(S.apps.map(a => a.cat))]
    .sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b)
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
    })
  const groups = cats.map(cat => {
    const items = S.apps.filter(a => a.cat === cat)
    const gWh = items.filter(a => a.on).reduce((s, a) => s + a.w * a.h, 0)
    return `
      <div class="appgroup">
        <div class="appgroup-hd">
          <span><i class="ti ${CATICONS[cat] || 'ti-plug'}" style="font-size:10px;margin-right:4px"></i>${tcat(cat)}</span>
          <span class="appgroup-wh">${toAh(gWh)} Ah</span>
        </div>
        ${items.map(a => buildAppRow(a)).join('')}
      </div>`
  }).join('')
  return `
  <div class="card">
    <div class="ct"><i class="ti ti-plug"></i>${t('appliances.title')}</div>
    <div class="applist">
      ${groups}
    </div>
    <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">
      <button class="addbtn" style="flex:1;min-width:140px" id="open-catalog"><i class="ti ti-book"></i>${t('btn.catalog')}</button>
      <button class="addbtn" style="flex:1;min-width:140px" id="open-custom"><i class="ti ti-plus"></i>${t('btn.custom')}</button>
    </div>
    <div class="cons-footer">
      <div>
        <div style="font-size:11px;color:var(--t2)">${t('appliances.activeCount', { n: active.length, total: S.apps.length })}</div>
        <div style="font-size:10px;color:var(--t3)">${t('appliances.disabledExcluded')}</div>
      </div>
      <div style="text-align:right">
        <div class="cf-num">${toAh(total)} <span style="font-size:11px;font-weight:400;color:var(--t2)">${t('unit.ahday')}</span></div>
        <div style="font-size:10px;color:var(--t3)">${t('appliances.totalConsumption')}</div>
      </div>
    </div>
  </div>`
}

function buildEnergyTab() {
  const { cons, solar, alt, recharge, net, batWhUnit, batWhTotal, usable, autDays, solCovPct, breakdown } = calc()
  const isDanger = net > usable
  const autStr = isFinite(autDays) ? (autDays < 1 ? (autDays * 24).toFixed(1) + ' h' : autDays.toFixed(1) + ' j') : '∞'

  const sunOpts = (() => {
    let html = '', lastR = ''
    SUN_ZONES.forEach((z, i) => {
      if (z.r !== lastR) { if (lastR) html += '</optgroup>'; html += `<optgroup label="${tregion(z.r)}">`; lastR = z.r }
      const zoneName = z.r === 'Personnalisé' ? t('region.Personnalisé') : z.n
      html += `<option value="${i}"${S.sunIdx === i ? ' selected' : ''}>${zoneName}${i < SUN_ZONES.length - 1 ? ' — ' + z.h + 'h/j' : ''}</option>`
    })
    return html + '</optgroup>'
  })()

  return `
  <div class="col3">
    <div style="display:flex;flex-direction:column;gap:10px">
      ${buildAppsCard()}
    </div>

    <div style="display:flex;flex-direction:column;gap:10px">

      <div class="card">
        <div class="ct"><i class="ti ti-battery-charging"></i>${t('battery.title')}</div>
        <div class="bat-types">
          ${BAT_TYPES.map(bt => `<div class="btf${S.batType === bt.id ? ' on' : ''}" data-btype="${bt.id}">${tbattype(bt.id)}</div>`).join('')}
        </div>
        <div class="batgrid">
          ${BATS.map((b, i) => ({ b, i })).filter(({ b }) => b.type === S.batType).map(({ b, i }) => `
            <div class="bopt${S.bat.ah === b.ah && S.bat.v === b.v ? ' on' : ''}" data-bat="${i}">
              <div class="bah">${b.ah}Ah</div><div class="btype">${tbattype(b.type)} ${b.v}V</div>
            </div>`).join('')}
        </div>
        <div class="nb-row">
          <label>${t('battery.parallel')}</label>
          <div class="nb-btns">
            ${[1,2,3,4,5,6,7,8,9,10].map(n => `<div class="nbb${S.batNb === n ? ' on' : ''}" data-nb="${n}">${n}</div>`).join('')}
          </div>
        </div>
        <div class="dod-row">
          <label>${t('battery.dod')}</label>
          <input id="dod-range" type="range" min="0.4" max="1" step="0.05" value="${S.dod}">
          <span class="dv">${Math.round(S.dod * 100)}%</span>
        </div>
        <div style="font-size:10px;color:var(--t3);margin-top:3px">${t('battery.dodHint')}</div>
        <div class="bat-summary">
          <div class="bsrow"><span class="bsn">${t('battery.unit')}</span><span class="bsv">${S.bat.ah} Ah × ${S.bat.v} V</span></div>
          <div class="bsrow"><span class="bsn">${t('battery.parallelCount')}</span><span class="bsv am">${t('battery.totalAh', { nb: S.batNb, ah: S.bat.ah * S.batNb })}</span></div>
          <div class="bsrow"><span class="bsn">${t('battery.totalRaw')}</span><span class="bsv">${(S.bat.ah * S.batNb).toLocaleString()} Ah</span></div>
          <div class="bsrow"><span class="bsn">${t('battery.usable', { pct: Math.round(S.dod * 100) })}</span><span class="bsv hi">${toAh(usable).toLocaleString()} Ah</span></div>
        </div>
      </div>

      <div class="card">
        <div class="ct alt"><i class="ti ti-engine"></i>${t('alt.title')}
          <button class="tog${S.altOn ? ' on' : ''}" id="alt-toggle" style="margin-left:auto"></button>
        </div>
        ${S.altOn ? `
        <div class="sol-config">
          <div class="scf">
            <label>${t('alt.amps')}</label>
            <div style="display:flex;align-items:center;gap:5px">
              <input id="alt-amps" type="number" min="5" max="200" value="${S.altAmps}" style="width:70px">
              <span style="font-size:11px;color:var(--t3)">A</span>
            </div>
          </div>
          <div class="scf">
            <label>${t('alt.hours')}</label>
            <div style="display:flex;align-items:center;gap:5px">
              <input id="alt-hours" type="number" min="0.5" max="12" step="0.5" value="${S.altHours}" style="width:70px">
              <span style="font-size:11px;color:var(--t3)">${t('unit.hday')}</span>
            </div>
          </div>
        </div>
        <div class="sol-summary" style="background:rgba(167,139,250,.06);border-color:#4c3680">
          <div class="ss-item"><div class="ssn" style="color:var(--pu)">${S.altAmps} A</div><div class="ssl">${t('alt.amperage')}</div></div>
          <div style="width:1px;background:var(--b1)"></div>
          <div class="ss-item"><div class="ssn" style="color:var(--pu)">${S.altHours} h</div><div class="ssl">${t('alt.driving')}</div></div>
          <div style="width:1px;background:var(--b1)"></div>
          <div class="ss-item"><div class="ssn" style="color:var(--pu)">${toAh(S.altAmps * S.bat.v * S.altHours * ALT_EFF)} Ah</div><div class="ssl">${t('alt.charge')}</div></div>
        </div>
        <div style="font-size:10px;color:var(--t3);margin-top:4px">${t('alt.efficiency')}</div>` :
        `<div style="font-size:12px;color:var(--t3);padding:6px 0">${t('alt.disabled')}</div>`}
      </div>

      <div class="card">
        <div class="ct sol"><i class="ti ti-sun"></i>${t('solar.title')}
          <button class="tog${S.solOn ? ' on' : ''}" id="sol-toggle" style="margin-left:auto"></button>
        </div>
        ${!S.solOn ? `<div style="font-size:12px;color:var(--t3);padding:6px 0">${t('solar.disabled')}</div>` : `
        <div class="spgrid">
          ${PANELS.map(w => `<div class="spo${S.solW === w ? ' on' : ''}" data-panel="${w}"><div class="spw">${w}</div><div class="spl">Wc</div></div>`).join('')}
        </div>
        <div class="sol-config">
          <div class="scf">
            <label>${t('solar.count')}</label>
            <input id="sol-nb" type="number" min="1" max="12" value="${S.solNb}">
          </div>
          <div class="scf">
            <label>${t('solar.mppt')}</label>
            <input id="sol-eff" type="number" min="60" max="98" value="${Math.round(S.solEff * 100)}">
          </div>
        </div>
        <div class="scf">
          <label>${t('solar.zone')}</label>
          <select id="sun-zone">${sunOpts}</select>
        </div>
        ${S.sunIdx === SUN_ZONES.length - 1 ? `
          <div style="margin-top:5px;display:flex;align-items:center;gap:6px">
            <input id="custom-sun" type="number" min="1" max="12" step="0.5" placeholder="${t('unit.hday')}" value="${S.customSunH}"
              style="width:70px;background:var(--s2);border:1px solid var(--b1);border-radius:var(--r);color:var(--t1);font-family:var(--mono);font-size:11px;padding:4px 7px">
            <span style="font-size:11px;color:var(--t3)">${t('solar.customHours')}</span>
          </div>` : ''}
        <div class="sol-summary">
          <div class="ss-item"><div class="ssn">${S.solW * S.solNb} Wc</div><div class="ssl">${t('solar.installed')}</div></div>
          <div style="width:1px;background:var(--b1)"></div>
          <div class="ss-item"><div class="ssn">${sunH()} h</div><div class="ssl">${t('solar.sunPerDay')}</div></div>
          <div style="width:1px;background:var(--b1)"></div>
          <div class="ss-item"><div class="ssn">${toAh(solar)} Ah</div><div class="ssl">${t('solar.production')}</div></div>
        </div>`}
      </div>

    </div>

    <div style="display:flex;flex-direction:column;gap:10px">

      <div class="card">
        <div class="ct te"><i class="ti ti-activity"></i>${t('balance.title')}</div>
        <div class="ef-grid${S.altOn ? ' ef-grid-4' : ''}">
          <div class="ef sol"><div class="en">${toAh(solar)}</div><div class="el">${t('balance.whSolar')}</div></div>
          ${S.altOn ? `<div class="ef alt"><div class="en">${toAh(alt)}</div><div class="el">${t('balance.whAlt')}</div></div>` : ''}
          <div class="ef bat"><div class="en">${toAh(usable)}</div><div class="el">${t('balance.whUsable')}</div></div>
          <div class="ef net ${isDanger ? 'bad' : 'ok'}"><div class="en">${toAh(net)}</div><div class="el">${t('balance.whDeficit')}</div></div>
        </div>
        <div style="font-size:10px;color:var(--t3);display:flex;justify-content:space-between;margin-top:6px;margin-bottom:2px">
          <span>${t('balance.coverageTotal', { alt: S.altOn ? t('balance.coverageAlt') : '' })}</span>
          <span style="font-family:var(--mono);color:var(--so)">${Math.round(solCovPct)}%</span>
        </div>
        <div style="height:6px;background:var(--s3);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${Math.round(Math.min(100, solCovPct))}%;background:var(--so2);border-radius:3px;transition:width .4s"></div>
        </div>
      </div>

      <div class="card">
        <div class="ct te"><i class="ti ti-clock"></i>${t('autonomy.title')}</div>
        <div class="ab-grid">
          <div class="ab-item">
            <div class="abn">${S.altOn ? t('autonomy.withAlt') : t('autonomy.batteryOnly')}</div>
            <div class="abv" style="color:${isDanger ? 'var(--rd)' : 'var(--te)'}">${autStr}</div>
            <div class="abu">${isFinite(autDays) && autDays >= 1 ? t('unit.days') : isFinite(autDays) ? t('unit.hours') : t('unit.unlimited')}</div>
            <div class="tag ${isDanger ? 'twarn' : 'tok'}">
              <i class="ti ti-${isDanger ? 'alert-triangle' : 'check'}" style="font-size:10px"></i>
              ${isDanger ? t('autonomy.insufficient') : t('autonomy.correct')}
            </div>
          </div>
          <div class="ab-item">
            <div class="abn">${t('autonomy.totalConsumption')}</div>
            <div class="abv">${toAh(cons)}</div>
            <div class="abu">${t('unit.ahday')}</div>
            ${solar >= cons
              ? `<div class="tag tinf"><i class="ti ti-solar-panel" style="font-size:10px"></i>${t('autonomy.selfSufficient')}</div>`
              : solar > 0
                ? `<div class="tag tsol"><i class="ti ti-sun" style="font-size:10px"></i>${t('autonomy.solarCovers', { pct: Math.round(solCovPct) })}</div>`
                : ''}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="ct"><i class="ti ti-list"></i>${t('detail.title')}</div>
        <div class="bkdown">
          ${breakdown.slice(0, 6).map(a => `<div class="bkrow"><span class="bkn">${ta(a.n)}</span><span class="bkv">${toAh(a.wh)} Ah/j</span></div>`).join('')}
          ${breakdown.length > 6 ? `<div class="bkrow"><span class="bkn">${t('detail.others', { n: breakdown.length - 6 })}</span><span class="bkv">${toAh(breakdown.slice(6).reduce((s, a) => s + a.wh, 0))} Ah/j</span></div>` : ''}
          <div class="bkrow"><span>${t('detail.totalConsumed')}</span><span class="bkv" style="color:var(--am)">${toAh(cons)} Ah/j</span></div>
          <div class="bkrow"><span>${t('detail.solarProduction')}</span><span class="bkv" style="color:var(--so)">− ${toAh(Math.min(solar, cons))} Ah/j</span></div>
          ${S.altOn ? `<div class="bkrow"><span>${t('detail.altCharge')}</span><span class="bkv" style="color:var(--pu)">− ${toAh(Math.min(alt, Math.max(0, cons - solar)))} Ah/j</span></div>` : ''}
          <div class="bkrow" style="border-top:1px solid var(--b2);margin-top:2px">
            <span style="font-weight:500">${t('detail.batteryDeficit')}</span>
            <span class="bkv" style="color:${isDanger ? 'var(--rd)' : 'var(--te)'}">${toAh(net)} Ah/j</span>
          </div>
        </div>
      </div>

      <button class="save-cfg-btn" id="save-config-btn">
        <i class="ti ti-device-floppy"></i>
        ${S.user ? `${t('save.myConfig')}${S.userConfigs.length ? ` <span class="save-count">${S.userConfigs.length}</span>` : ''}` : t('save.accountRequired')}
      </button>

      <button class="pdf-btn" id="export-pdf">
        <i class="ti ti-mail-forward"></i> ${t('export.email')}
      </button>

      <button class="share-btn" id="share-config-btn">
        <i class="ti ti-link"></i> ${t('share.config')}
      </button>

      <button class="shopping-btn" id="open-shopping-list">
        <i class="ti ti-shopping-cart"></i> ${t('btn.shoppingList')}
      </button>

      <div class="capture-row">
        <span class="capture-lbl"><i class="ti ti-arrows-diff"></i> ${t('capture.label')}</span>
        <button class="capture-btn${S.scenarios.A ? ' filled' : ''}" id="capture-a">${t('capture.toA')}</button>
        <button class="capture-btn${S.scenarios.B ? ' filled' : ''}" id="capture-b">${t('capture.toB')}</button>
      </div>

    </div>
  </div>

  <div class="print-report" id="print-report">
    ${buildPrintReport({ cons, solar, alt, recharge, net, batWhUnit, batWhTotal, usable, autDays, solCovPct, breakdown, isDanger, autStr })}
  </div>`
}

function buildPrintReport({ cons, solar, alt, recharge, net, batWhUnit, batWhTotal, usable, autDays, solCovPct, breakdown, isDanger, autStr }) {
  const now = new Date()
  const dateStr = now.toLocaleDateString(localeCode(), { day: '2-digit', month: 'long', year: 'numeric' })
  const vtypeLabel = t('vt.' + S.vtype)
  const zone = SUN_ZONES[S.sunIdx]
  const sunHours = S.sunIdx === SUN_ZONES.length - 1 ? (parseFloat(S.customSunH) || 0) : zone.h

  return `
  <div class="pr-header">
    <div class="pr-logo">OffroadWatt</div>
    <div class="pr-meta">
      <div class="pr-title">${t('pr.title', { vtype: vtypeLabel })}</div>
      <div class="pr-date">${t('pr.generatedOn', { date: dateStr })}</div>
    </div>
  </div>

  <div class="pr-section">
    <div class="pr-sh">${t('pr.appliances')}</div>
    <table class="pr-table">
      <thead><tr><th>${t('pr.th.appliance')}</th><th>${t('pr.th.category')}</th><th>${t('pr.th.activeMode')}</th><th class="num">${t('pr.th.watts')}</th><th class="num">${t('pr.th.hoursDay')}</th><th class="num">${t('pr.th.whDay')}</th></tr></thead>
      <tbody>
        ${S.apps.map(a => {
          const modeLabel = (a.modes && a.modes.length > 1) ? a.modes[a.activeMode ?? 0]?.label ?? '' : '—'
          return `<tr class="${!a.on ? 'off' : ''}">
            <td>${ta(a.n)}${!a.on ? t('pr.disabled') : ''}</td>
            <td>${tcat(a.cat)}</td>
            <td>${modeLabel ? ta(modeLabel) : '—'}</td>
            <td class="num">${a.w} W</td>
            <td class="num">${a.h} h</td>
            <td class="num">${a.on ? toAh(a.w * a.h) : 0} Ah</td>
          </tr>`
        }).join('')}
        <tr class="pr-total"><td colspan="5">${t('pr.totalDaily')}</td><td class="num">${toAh(cons)} Ah/j</td></tr>
      </tbody>
    </table>
  </div>

  <div class="pr-grid">
    <div class="pr-section">
      <div class="pr-sh">${t('pr.battery')}</div>
      <table class="pr-kv">
        <tr><td>${t('pr.model')}</td><td>${S.bat.ah} Ah ${S.bat.v}V ${tbattype(S.bat.type)}</td></tr>
        <tr><td>${t('pr.batParallel')}</td><td>${S.batNb}</td></tr>
        <tr><td>${t('pr.totalRawCap')}</td><td>${(S.bat.ah * S.batNb).toLocaleString()} Ah</td></tr>
        <tr><td>${t('pr.dod')}</td><td>${Math.round(S.dod * 100)} %</td></tr>
        <tr class="pr-hi"><td>${t('pr.usableEnergy')}</td><td>${toAh(usable).toLocaleString()} Ah</td></tr>
      </table>
    </div>

    ${S.solOn ? `
    <div class="pr-section">
      <div class="pr-sh">${t('pr.solar')}</div>
      <table class="pr-kv">
        <tr><td>${t('pr.unitPower')}</td><td>${S.solW} Wc</td></tr>
        <tr><td>${t('pr.panelCount')}</td><td>${S.solNb}</td></tr>
        <tr><td>${t('pr.totalPower')}</td><td>${S.solW * S.solNb} Wc</td></tr>
        <tr><td>${t('pr.mpptEff')}</td><td>${Math.round(S.solEff * 100)} %</td></tr>
        <tr><td>${t('pr.zoneSun')}</td><td>${zone.r === 'Personnalisé' ? t('region.Personnalisé') : zone.n} — ${sunHours} h/j</td></tr>
        <tr class="pr-hi"><td>${t('pr.dailyProduction')}</td><td>${toAh(solar)} Ah/j</td></tr>
      </table>
    </div>` : ''}

    ${S.altOn ? `
    <div class="pr-section">
      <div class="pr-sh">${t('pr.altCharging')}</div>
      <table class="pr-kv">
        <tr><td>${t('pr.altAmps')}</td><td>${S.altAmps} A</td></tr>
        <tr><td>${t('pr.altHours')}</td><td>${S.altHours} h</td></tr>
        <tr><td>${t('pr.altEff')}</td><td>70 %</td></tr>
        <tr class="pr-hi"><td>${t('pr.dailyCharge')}</td><td>${toAh(alt)} Ah/j</td></tr>
      </table>
    </div>` : ''}
  </div>

  <div class="pr-section">
    <div class="pr-sh">${t('pr.balance')}</div>
    <table class="pr-kv">
      <tr><td>${t('pr.totalConsumption')}</td><td>${toAh(cons)} Ah/j</td></tr>
      <tr><td>${t('pr.solarProduction')}</td><td>− ${toAh(Math.min(solar, cons))} Ah/j</td></tr>
      ${S.altOn ? `<tr><td>${t('pr.altCharge')}</td><td>− ${toAh(Math.min(alt, Math.max(0, cons - solar)))} Ah/j</td></tr>` : ''}
      <tr class="${isDanger ? 'pr-danger' : 'pr-hi'}"><td>${t('pr.residualDeficit')}</td><td>${toAh(net)} Ah/j</td></tr>
      <tr><td>${t('pr.coverage', { alt: S.altOn ? t('balance.coverageAlt') : '' })}</td><td>${Math.round(solCovPct)} %</td></tr>
      <tr class="${isDanger ? 'pr-danger' : 'pr-ok'}"><td>${t('pr.estAutonomy')}</td><td>${autStr} ${isFinite(autDays) && autDays >= 1 ? t('unit.days') : isFinite(autDays) ? t('unit.hours') : ''}</td></tr>
    </table>
  </div>

  <div class="pr-footer">${t('pr.footer')}</div>`
}

function buildEmailSummaryHtml() {
  const { cons, solar, alt, net, usable, autDays, solCovPct } = calc()
  const isDanger = net > usable
  const autStr = !isFinite(autDays) ? '∞' : autDays < 1 ? (autDays * 24).toFixed(1) + ' h' : autDays.toFixed(1) + ' j'
  const zone = SUN_ZONES[S.sunIdx]
  const dateStr = new Date().toLocaleDateString(localeCode(), { day: '2-digit', month: 'long', year: 'numeric' })
  const autColor = isDanger ? '#ef4444' : '#2dd4bf'
  const solPct = Math.min(Math.round(solCovPct), 100)

  const appRows = S.apps.map(a => {
    const modeLabel = (a.modes && a.modes.length > 1) ? (a.modes[a.activeMode ?? 0]?.label ?? '') : ''
    const off = !a.on
    const nameHtml = modeLabel
      ? `${ta(a.n)} <span style="font-size:10px;color:#a0a09a">(${modeLabel})</span>`
      : ta(a.n)
    return `<tr>
      <td style="padding:7px 0;border-bottom:1px solid #f0ede9;color:${off ? '#c0bdb8' : '#2a2925'};font-size:12px">${nameHtml}</td>
      <td style="padding:7px 8px;border-bottom:1px solid #f0ede9;color:${off ? '#d0cdc8' : '#9a9890'};font-size:10px">${tcat(a.cat)}</td>
      <td style="padding:7px 8px;border-bottom:1px solid #f0ede9;font-family:'Courier New',monospace;text-align:right;font-size:11px;color:${off ? '#c0bdb8' : '#6a6760'}">${a.w}</td>
      <td style="padding:7px 8px;border-bottom:1px solid #f0ede9;font-family:'Courier New',monospace;text-align:right;font-size:11px;color:${off ? '#c0bdb8' : '#6a6760'}">${a.h}</td>
      <td style="padding:7px 0 7px 8px;border-bottom:1px solid #f0ede9;font-family:'Courier New',monospace;text-align:right;font-size:12px;font-weight:600;color:${off ? '#c0bdb8' : '#c47a18'}">${a.on ? toAh(a.w * a.h) + ' Ah' : '—'}</td>
    </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="${getLang()}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>OffroadWatt</title>
</head>
<body style="margin:0;padding:0;background:#f2f1ef;font-family:Arial,'Helvetica Neue',sans-serif;color:#2a2925">
<div style="max-width:600px;margin:0 auto;padding:24px 16px">

  <!-- Header -->
  <div style="background:#141817;border-radius:14px 14px 0 0;padding:22px 28px;border:1px solid #253029;border-bottom:none">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td><span style="font-family:'Courier New',monospace;font-size:22px;font-weight:700;color:#c47a18;letter-spacing:-0.5px">OffroadWatt</span></td>
        <td style="text-align:right;vertical-align:middle"><span style="font-size:11px;color:#4a6358">${dateStr}</span></td>
      </tr>
      <tr><td colspan="2" style="padding-top:4px"><span style="font-size:11px;color:#4a6358">${t('vt.' + S.vtype)}</span></td></tr>
    </table>
  </div>

  <!-- KPI bar -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1c221f;border:1px solid #253029;border-top:none">
    <tr>
      <td style="padding:18px 10px;text-align:center;border-right:1px solid #253029;width:33.3%">
        <div style="font-family:'Courier New',monospace;font-size:26px;font-weight:700;color:${autColor};line-height:1">${autStr}</div>
        <div style="font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#4a6358;margin-top:6px">${t('email.autonomyLabel')}</div>
      </td>
      <td style="padding:18px 10px;text-align:center;border-right:1px solid #253029;width:33.3%">
        <div style="font-family:'Courier New',monospace;font-size:26px;font-weight:700;color:#dde8e2;line-height:1">${toAh(cons)}</div>
        <div style="font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#4a6358;margin-top:6px">${t('email.consumptionLabel')}</div>
      </td>
      <td style="padding:18px 10px;text-align:center;width:33.3%">
        <div style="font-family:'Courier New',monospace;font-size:26px;font-weight:700;color:#f59e0b;line-height:1">${solPct}%</div>
        <div style="font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#4a6358;margin-top:6px">${t('email.solarLabel')}</div>
      </td>
    </tr>
  </table>

  <!-- Appliances -->
  <div style="background:#ffffff;border:1px solid #e4e3e0;border-top:none;padding:20px 24px">
    <div style="font-size:9px;font-family:'Courier New',monospace;text-transform:uppercase;letter-spacing:2px;color:#a0a09a;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #f0ede9">${t('email.devicesSection')}</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:12px">
      <thead>
        <tr>
          <th style="text-align:left;padding:0 0 8px;font-size:10px;font-weight:600;color:#c0bdb8;border-bottom:2px solid #f0ede9">${t('email.deviceCol')}</th>
          <th style="text-align:left;padding:0 8px 8px;font-size:10px;font-weight:600;color:#c0bdb8;border-bottom:2px solid #f0ede9">${t('email.categoryCol')}</th>
          <th style="text-align:right;padding:0 8px 8px;font-size:10px;font-weight:600;color:#c0bdb8;border-bottom:2px solid #f0ede9">W</th>
          <th style="text-align:right;padding:0 8px 8px;font-size:10px;font-weight:600;color:#c0bdb8;border-bottom:2px solid #f0ede9">${t('email.hoursPerDay')}</th>
          <th style="text-align:right;padding:0 0 8px 8px;font-size:10px;font-weight:600;color:#c0bdb8;border-bottom:2px solid #f0ede9">${t('email.ahPerDay')}</th>
        </tr>
      </thead>
      <tbody>${appRows}</tbody>
      <tfoot>
        <tr>
          <td colspan="4" style="padding:10px 8px 0 0;font-weight:700;font-size:12px;color:#2a2925;border-top:2px solid #f0ede9">${t('email.totalConsumption')}</td>
          <td style="padding:10px 0 0 8px;font-family:'Courier New',monospace;font-weight:700;text-align:right;color:#c47a18;border-top:2px solid #f0ede9">${toAh(cons)} Ah</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <!-- Config grid -->
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e3e0;border-top:none;background:#faf9f7">
    <tr>
      <td style="padding:16px 20px;${S.solOn ? 'border-right:1px solid #e4e3e0;' : ''}vertical-align:top;width:${S.solOn ? '50%' : '100%'}">
        <div style="font-size:9px;font-family:'Courier New',monospace;text-transform:uppercase;letter-spacing:2px;color:#a0a09a;margin-bottom:8px">${t('email.batterySection')}</div>
        <div style="font-size:13px;font-weight:700;color:#2a2925">${S.bat.ah} Ah ${S.bat.v}V ${tbattype(S.bat.type)}${S.batNb > 1 ? ` ×${S.batNb}` : ''}</div>
        <div style="font-size:11px;color:#7a7770;margin-top:4px">${t('email.dodLabel')} ${Math.round(S.dod * 100)}% · ${t('email.usableLabel')} <strong style="color:#2dd4bf">${toAh(usable)} Ah</strong></div>
      </td>
      ${S.solOn ? `<td style="padding:16px 20px;vertical-align:top">
        <div style="font-size:9px;font-family:'Courier New',monospace;text-transform:uppercase;letter-spacing:2px;color:#a0a09a;margin-bottom:8px">${t('email.solarSection')}</div>
        <div style="font-size:13px;font-weight:700;color:#2a2925">${S.solW * S.solNb} Wc (${S.solNb}×${S.solW})</div>
        <div style="font-size:11px;color:#7a7770;margin-top:4px">${zone.r === 'Personnalisé' ? t('region.Personnalisé') : zone.n} · <strong style="color:#f59e0b">${toAh(solar)} Ah/j</strong></div>
      </td>` : ''}
    </tr>
    ${S.altOn ? `<tr><td colspan="2" style="padding:12px 20px;border-top:1px solid #ebe9e5">
      <div style="font-size:9px;font-family:'Courier New',monospace;text-transform:uppercase;letter-spacing:2px;color:#a0a09a;margin-bottom:4px">${t('email.altSection')}</div>
      <div style="font-size:11px;color:#7a7770">${S.altAmps} A · ${S.altHours} h/j · <strong style="color:#a78bfa">${toAh(alt)} Ah</strong></div>
    </td></tr>` : ''}
  </table>

  <!-- Balance -->
  <div style="background:${isDanger ? '#fff5f5' : '#f0fdf6'};border:1px solid ${isDanger ? '#fecaca' : '#bbf7d0'};border-top:none;padding:16px 20px;border-radius:0 0 14px 14px">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size:12px;color:#6a6760;padding-bottom:8px">${t('email.deficitLabel')}</td>
        <td style="font-family:'Courier New',monospace;font-weight:700;text-align:right;font-size:13px;color:${isDanger ? '#dc2626' : '#16a34a'};padding-bottom:8px">${toAh(net)} Ah/j</td>
      </tr>
      <tr>
        <td style="font-size:15px;font-weight:700;color:#1a1915">${t('email.estAutonomy')}</td>
        <td style="font-family:'Courier New',monospace;font-size:24px;font-weight:700;text-align:right;color:${autColor}">${autStr}</td>
      </tr>
    </table>
  </div>

  <!-- CTA -->
  <div style="text-align:center;padding:28px 0 10px">
    <a href="https://app.offroadwatt.com" style="display:inline-block;background:#c47a18;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700;font-size:14px;letter-spacing:0.3px">${t('email.openApp')}</a>
  </div>

  <!-- Footer -->
  <p style="text-align:center;font-size:10px;color:#b0ada8;margin:8px 0 0">
    OffroadWatt · <a href="https://app.offroadwatt.com" style="color:#c47a18;text-decoration:none">app.offroadwatt.com</a>
  </p>

</div>
</body>
</html>`
}

// ── COMPARE TAB ──────────────────────────────────────────────────────────────

// Résumé court d'un scénario (batterie + solaire + alternateur)
function scenarioSummary(st) {
  const parts = [
    `${st.bat.ah}Ah ${st.bat.v}V ${tbattype(st.bat.type)}${st.batNb > 1 ? ` ×${st.batNb}` : ''}`,
  ]
  if (st.solOn !== false) parts.push(`${st.solW * st.solNb} ${t('compare.solarWc')}`)
  if (st.altOn) parts.push(`Alt ${st.altAmps}A`)
  return parts.join(' · ')
}

// Ligne de comparaison avec delta coloré
function cmpRow(label, vA, vB, fmt, opts = {}) {
  const { higherBetter = true, delta = true, unit = '' } = opts
  const dv = vB - vA
  let deltaHtml = ''
  if (delta && isFinite(dv) && dv !== 0) {
    const good = higherBetter ? dv > 0 : dv < 0
    const sign = dv > 0 ? '+' : ''
    deltaHtml = `<span class="cmp-delta ${good ? 'up' : 'down'}">${sign}${fmt(dv)}${unit}</span>`
  } else if (delta && (!isFinite(vA) || !isFinite(vB))) {
    deltaHtml = `<span class="cmp-delta">—</span>`
  }
  return `
  <tr>
    <td class="cmp-lbl">${label}</td>
    <td class="cmp-val">${fmt(vA)}${unit}</td>
    <td class="cmp-val">${fmt(vB)}${unit}</td>
    <td class="cmp-d">${deltaHtml}</td>
  </tr>`
}

function buildCompareTab() {
  const A = S.scenarios.A, B = S.scenarios.B
  let printReport = ''

  const slot = (key, snap) => snap
    ? `<div class="cmp-slot filled">
         <div class="cmp-slot-hd"><span class="cmp-tag">${key}</span> ${snap.label}
           <button class="cmp-clear" data-clear-scenario="${key}" title="${t('btn.close')}"><i class="ti ti-x"></i></button>
         </div>
         <div class="cmp-slot-sum">${scenarioSummary(snap)}</div>
       </div>`
    : `<div class="cmp-slot empty">
         <div class="cmp-slot-hd"><span class="cmp-tag empty">${key}</span> ${t('compare.noScenario')}</div>
         <div class="cmp-slot-sum">${t('compare.configurePrompt', { key })}</div>
       </div>`

  let body
  if (!A || !B) {
    body = `
    <div class="cmp-empty">
      <i class="ti ti-arrows-diff" style="font-size:30px;opacity:.25;display:block;margin-bottom:8px"></i>
      <div style="font-size:13px;color:var(--t2);margin-bottom:4px">${t('compare.emptyTitle')}</div>
      <div style="font-size:11px;color:var(--t3)">${t('compare.emptyHint')}</div>
      <button class="capture-btn" id="goto-dashboard" style="margin-top:12px">${t('compare.gotoDashboard')}</button>
    </div>`
  } else {
    const cA = calc(A), cB = calc(B)
    const r0 = (n) => Math.round(n)
    const gainAut = (isFinite(cB.autDays) && isFinite(cA.autDays)) ? cB.autDays - cA.autDays : null
    const winner = isFinite(cB.autDays) && isFinite(cA.autDays) ? (cB.autDays > cA.autDays ? 'B' : cA.autDays > cB.autDays ? 'A' : null) : null

    body = `
    <table class="cmp-table">
      <thead><tr><th></th><th><span class="cmp-tag">A</span> ${A.label}</th><th><span class="cmp-tag">B</span> ${B.label}</th><th>Δ</th></tr></thead>
      <tbody>
        ${cmpRow(t('compare.row.consumption'), toAh(cA.cons), toAh(cB.cons), r0, { higherBetter: false, unit: ' Ah' })}
        ${cmpRow(t('compare.row.solarProduction'), toAh(cA.solar), toAh(cB.solar), r0, { unit: ' Ah' })}
        ${(A.altOn || B.altOn) ? cmpRow(t('compare.row.altCharge'), toAh(cA.alt), toAh(cB.alt), r0, { unit: ' Ah' }) : ''}
        ${cmpRow(t('compare.row.usableEnergy'), toAh(cA.usable), toAh(cB.usable), r0, { unit: ' Ah' })}
        ${cmpRow(t('compare.row.deficit'), toAh(cA.net), toAh(cB.net), r0, { higherBetter: false, unit: ' Ah' })}
        ${cmpRow(t('compare.row.coverage'), cA.solCovPct, cB.solCovPct, r0, { unit: ' %' })}
        ${cmpRow(t('compare.row.autonomy'), cA.autDays, cB.autDays, fmtDays, { delta: false })}
      </tbody>
    </table>

    ${winner ? `<div class="cmp-winner"><i class="ti ti-trophy"></i> ${t('compare.winner', { w: winner })}</div>` : ''}

    ${gainAut != null ? `
    <div class="card" style="margin-top:12px">
      <div class="ct te"><i class="ti ti-trending-up"></i>${t('compare.autGainTitle')}</div>
      <div class="roi-grid">
        <div class="roi-item">
          <div class="roi-v" style="color:var(--te)">${(gainAut > 0 ? '+' : '') + gainAut.toFixed(1)}</div>
          <div class="roi-l">${t('compare.autGainDays')}</div>
        </div>
        <div class="roi-item">
          <div class="roi-v" style="color:var(--so)">${r0(cB.solCovPct - cA.solCovPct) > 0 ? '+' : ''}${r0(cB.solCovPct - cA.solCovPct)} %</div>
          <div class="roi-l">${t('compare.solarGain')}</div>
        </div>
      </div>
    </div>` : ''}

    <button class="pdf-btn" id="export-compare-pdf" style="margin-top:12px">
      <i class="ti ti-mail-forward"></i> ${t('export.email')}
    </button>`

    printReport = `
    <div class="print-report" id="print-report-compare">
      ${buildCompareReport(A, B, cA, cB)}
    </div>`
  }

  return `
  <div class="card">
    <div class="ct"><i class="ti ti-arrows-diff"></i>${t('compare.title')}</div>
    <p style="font-size:12px;color:var(--t2);margin-bottom:10px">${t('compare.subtitle')}</p>
    <div class="cmp-slots">
      ${slot('A', A)}
      ${slot('B', B)}
    </div>
    ${body}
  </div>
  ${printReport}`
}

function buildCompareReport(A, B, cA, cB) {
  const now = new Date().toLocaleDateString(localeCode(), { day: '2-digit', month: 'long', year: 'numeric' })
  const r0 = (n) => Math.round(n)
  const row = (label, vA, vB, unit = '') => `<tr><td>${label}</td><td class="num">${typeof vA === 'number' ? r0(vA) : vA}${unit}</td><td class="num">${typeof vB === 'number' ? r0(vB) : vB}${unit}</td></tr>`
  const gainAut = (isFinite(cB.autDays) && isFinite(cA.autDays)) ? cB.autDays - cA.autDays : null
  return `
  <div class="pr-header">
    <div class="pr-logo">OffroadWatt</div>
    <div class="pr-meta">
      <div class="pr-title">${t('pr.compare.title')}</div>
      <div class="pr-date">${t('pr.generatedOn', { date: now })}</div>
    </div>
  </div>
  <div class="pr-section">
    <div class="pr-sh">${t('pr.compare.setups')}</div>
    <table class="pr-kv">
      <tr><td>Setup A — ${A.label}</td><td>${scenarioSummary(A)}</td></tr>
      <tr><td>Setup B — ${B.label}</td><td>${scenarioSummary(B)}</td></tr>
    </table>
  </div>
  <div class="pr-section">
    <div class="pr-sh">${t('pr.balance')}</div>
    <table class="pr-table">
      <thead><tr><th>${t('pr.compare.criterion')}</th><th class="num">Setup A</th><th class="num">Setup B</th></tr></thead>
      <tbody>
        ${row(t('compare.row.consumption'), toAh(cA.cons), toAh(cB.cons), ' Ah/j')}
        ${row(t('compare.row.solarProduction'), toAh(cA.solar), toAh(cB.solar), ' Ah/j')}
        ${(A.altOn || B.altOn) ? row(t('compare.row.altCharge'), toAh(cA.alt), toAh(cB.alt), ' Ah/j') : ''}
        ${row(t('compare.row.usableEnergy'), toAh(cA.usable), toAh(cB.usable), ' Ah')}
        ${row(t('compare.row.deficit'), toAh(cA.net), toAh(cB.net), ' Ah/j')}
        ${row(t('compare.row.coverage'), cA.solCovPct, cB.solCovPct, ' %')}
        ${row(t('compare.row.autonomy'), fmtDays(cA.autDays), fmtDays(cB.autDays))}
      </tbody>
    </table>
  </div>
  ${gainAut != null ? `
  <div class="pr-section">
    <div class="pr-sh">${t('compare.autGainTitle')}</div>
    <table class="pr-kv">
      <tr class="${gainAut > 0 ? 'pr-ok' : ''}"><td>${t('compare.autGainDays')}</td><td>${gainAut > 0 ? '+' : ''}${gainAut.toFixed(1)} ${t('unit.days')}</td></tr>
      <tr><td>${t('compare.solarGain')}</td><td>${r0(cB.solCovPct - cA.solCovPct) > 0 ? '+' : ''}${r0(cB.solCovPct - cA.solCovPct)} %</td></tr>
    </table>
  </div>` : ''}
  <div class="pr-footer">${t('pr.compare.footer')}</div>`
}

// ── MODAL ────────────────────────────────────────────────────────────────────

function buildWizardModal(m) {
  const step = m.step || 1
  const totalSteps = 4
  const progress = `<div class="wiz-progress">
    ${[1, 2, 3, 4].map(s => `<div class="wiz-dot${s <= step ? ' on' : ''}"></div>`).join('')}
  </div>`
  const skipBtn = `<button id="wiz-skip" class="wiz-skip">${t('wizard.skip')}</button>`

  // ── Étape 1 : type de véhicule ──
  if (step === 1) {
    const cards = [['campervan', 'ti-camper'], ['caravan', 'ti-caravan'], ['van', 'ti-car']].map(([v, ic]) => `
      <div class="wiz-card${m.vtype === v ? ' on' : ''}" data-wiz-vtype="${v}">
        <i class="ti ${ic}"></i>
        <span>${t('vt.' + v)}</span>
      </div>`).join('')
    return `
    <div class="ov" id="modal-overlay">
      <div class="mo wiz" style="max-width:440px">
        ${progress}
        <h3>${t('wizard.step1.title')}</h3>
        <p class="wiz-sub">${t('wizard.step1.desc')}</p>
        <div class="wiz-cards">${cards}</div>
        <div class="wiz-nav">
          ${skipBtn}
          <button id="wiz-next" class="mo-ok" ${m.vtype ? '' : 'disabled'}>${t('wizard.next')} <i class="ti ti-arrow-right" style="font-size:12px"></i></button>
        </div>
      </div>
    </div>`
  }

  // ── Étape 2 : usages principaux ──
  if (step === 2) {
    const sel = new Set(m.usages || USAGE_IDS)
    const cards = USAGES.map(u => `
      <div class="wiz-usage${sel.has(u.id) ? ' on' : ''}" data-wiz-usage="${u.id}">
        <i class="ti ${u.icon}"></i>
        <span>${t('wizard.usage.' + u.id)}</span>
        <i class="ti ti-check wiz-check"></i>
      </div>`).join('')
    return `
    <div class="ov" id="modal-overlay">
      <div class="mo wiz" style="max-width:440px">
        ${progress}
        <h3>${t('wizard.step2.title')}</h3>
        <p class="wiz-sub">${t('wizard.step2.desc')}</p>
        <div class="wiz-usages">${cards}</div>
        <div class="wiz-nav">
          <button id="wiz-back" class="mo-cancel"><i class="ti ti-arrow-left" style="font-size:12px"></i> ${t('wizard.back')}</button>
          <button id="wiz-next" class="mo-ok">${t('wizard.next')} <i class="ti ti-arrow-right" style="font-size:12px"></i></button>
        </div>
      </div>
    </div>`
  }

  // ── Étape 3 : panneaux solaires ──
  if (step === 3) {
    const opts = [
      ['have', 'ti-solar-panel'],
      ['want', 'ti-solar-panel-2'],
      ['no',   'ti-sun-off'],
    ]
    const cards = opts.map(([id, ic]) => `
      <div class="wiz-usage${m.solar === id ? ' on' : ''}" data-wiz-solar="${id}">
        <i class="ti ${ic}"></i>
        <span>${t('wizard.solar.' + id)}</span>
        <i class="ti ti-check wiz-check"></i>
      </div>`).join('')
    return `
    <div class="ov" id="modal-overlay">
      <div class="mo wiz" style="max-width:440px">
        ${progress}
        <h3>${t('wizard.step3.title')}</h3>
        <p class="wiz-sub">${t('wizard.step3.desc')}</p>
        <div class="wiz-budgets">${cards}</div>
        <div class="wiz-nav">
          <button id="wiz-back" class="mo-cancel"><i class="ti ti-arrow-left" style="font-size:12px"></i> ${t('wizard.back')}</button>
          <button id="wiz-next" class="mo-ok" ${m.solar ? '' : 'disabled'}>${t('wizard.next')} <i class="ti ti-arrow-right" style="font-size:12px"></i></button>
        </div>
      </div>
    </div>`
  }

  // ── Étape 4 : budget batterie ──
  const labels = { low: '< 500 €', mid: '500 – 1500 €', high: '> 1500 €' }
  const cards = WIZARD_BUDGETS.map(b => {
    const bat = batForBudget(m.vtype || 'campervan', b.id)
    const typeLabel = tbattype(b.type)
    return `
      <div class="wiz-budget${m.budget === b.id ? ' on' : ''}" data-wiz-budget="${b.id}">
        <div class="wiz-budget-top">
          <span class="wiz-budget-type">${typeLabel}</span>
          <span class="wiz-budget-amt">${labels[b.id]}</span>
        </div>
        <div class="wiz-budget-bat">${bat.ah} Ah ${bat.v}V</div>
      </div>`
  }).join('')
  return `
  <div class="ov" id="modal-overlay">
    <div class="mo wiz" style="max-width:440px">
      ${progress}
      <h3>${t('wizard.step4.title')}</h3>
      <p class="wiz-sub">${t('wizard.step4.desc')}</p>
      <div class="wiz-budgets">${cards}</div>
      <div class="wiz-nav">
        <button id="wiz-back" class="mo-cancel"><i class="ti ti-arrow-left" style="font-size:12px"></i> ${t('wizard.back')}</button>
        <button id="wiz-finish" class="mo-ok" ${m.budget ? '' : 'disabled'}><i class="ti ti-check" style="font-size:12px"></i> ${t('wizard.finish')}</button>
      </div>
    </div>
  </div>`
}

function buildShoppingItems() {
  const items = []
  const batLabel = t('modal.shopping.batRec', { type: tbattype(S.bat.type), ah: S.bat.ah, v: S.bat.v })
  items.push({ icon: 'ti-battery-charging', cat: t('modal.shopping.battery'), name: batLabel, qty: S.batNb, eur: (S.bat.eur || 0) * S.batNb })

  if (S.solOn !== false) {
    items.push({ icon: 'ti-solar-panel', cat: t('modal.shopping.solar'), name: t('modal.shopping.panelRec', { w: S.solW }), qty: S.solNb, eur: Math.round(S.solW * S.solNb * PANEL_EUR_PER_WC) })
    const totalWc = S.solW * S.solNb
    const amps = Math.ceil(totalWc / S.bat.v * 1.25)
    let spec, mpptEur
    if (amps <= 15)      { spec = '75/15';   mpptEur = 120 }
    else if (amps <= 20) { spec = '100/20';  mpptEur = 160 }
    else if (amps <= 30) { spec = '100/30';  mpptEur = 210 }
    else if (amps <= 50) { spec = '150/35';  mpptEur = 280 }
    else if (amps <= 70) { spec = '150/45';  mpptEur = 350 }
    else                 { spec = '150/100'; mpptEur = 550 }
    items.push({ icon: 'ti-solar-panel', cat: t('modal.shopping.mppt'), name: t('modal.shopping.mpptRec', { spec }), qty: 1, eur: mpptEur })
  }

  if (S.altOn) {
    items.push({ icon: 'ti-engine', cat: t('modal.shopping.charger'), name: t('modal.shopping.chargerRec', { a: S.altAmps }), qty: 1, eur: Math.round(S.altAmps * ALT_EUR_PER_A) })
  }

  const maxAmps = Math.max(S.solOn !== false ? Math.ceil((S.solW * S.solNb) / S.bat.v) : 0, S.altOn ? S.altAmps : 0, 20)
  let mm2, cableEur
  if (maxAmps <= 20)      { mm2 = 4;  cableEur = 25 }
  else if (maxAmps <= 35) { mm2 = 6;  cableEur = 35 }
  else if (maxAmps <= 50) { mm2 = 10; cableEur = 50 }
  else if (maxAmps <= 80) { mm2 = 16; cableEur = 70 }
  else                    { mm2 = 25; cableEur = 95 }
  items.push({ icon: 'ti-plug', cat: t('modal.shopping.cables'), name: t('modal.shopping.cableNote', { mm: mm2, m: 5 }), qty: 1, eur: cableEur })

  const fuseAmps = Math.ceil(maxAmps * 1.25 / 5) * 5
  items.push({ icon: 'ti-shield', cat: t('modal.shopping.fuses'), name: t('modal.shopping.fuseNote', { a: fuseAmps }), qty: 1, eur: 20 })

  return items
}

function shoppingListToText(items) {
  const lines = items.map(it => {
    const q = it.qty > 1 ? ` ×${it.qty}` : ''
    return `- ${it.cat}: ${it.name}${q} — ~${it.eur}€`
  })
  const total = items.reduce((s, it) => s + it.eur, 0)
  lines.push('', `${t('modal.shopping.total')}: ~${total}€`)
  lines.push(t('modal.shopping.indicative'))
  return lines.join('\n')
}

function buildModal() {
  const m = S.modal

  if (m.type === 'wizard') return buildWizardModal(m)

  if (m.type === 'shopping-list') {
    const items = buildShoppingItems()
    const total = items.reduce((s, it) => s + it.eur, 0)
    return `
    <div class="ov" id="modal-overlay">
      <div class="mo" style="max-width:480px">
        <h3><i class="ti ti-shopping-cart"></i> ${t('modal.shopping.title')}</h3>
        <p style="font-size:11px;color:var(--t2);margin-bottom:12px">${t('modal.shopping.desc')}</p>
        <div class="shop-list">
          ${items.map(it => `
            <div class="shop-item">
              <i class="${it.icon}" style="font-size:15px;color:var(--te);flex-shrink:0"></i>
              <div style="flex:1;min-width:0">
                <div style="font-size:11px;color:var(--t3);font-family:var(--mono);text-transform:uppercase;letter-spacing:.3px;font-size:9px">${it.cat}</div>
                <div style="font-size:12px;color:var(--t1)">${it.name}${it.qty > 1 ? ` <span style="color:var(--am);font-family:var(--mono);font-size:11px">${t('modal.shopping.qty', { n: it.qty })}</span>` : ''}</div>
              </div>
              <div style="font-family:var(--mono);font-size:12px;color:var(--am);font-weight:700;flex-shrink:0">~${it.eur}€</div>
            </div>`).join('')}
        </div>
        <div class="shop-total">
          <span>${t('modal.shopping.total')}</span>
          <span style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--am)">~${total}€</span>
        </div>
        <p style="font-size:10px;color:var(--t3);text-align:center;margin-top:8px">${t('modal.shopping.indicative')}</p>
        <div class="mo-btns" style="margin-top:12px">
          <button id="close-modal" class="mo-cancel">${t('btn.close')}</button>
          <button id="shopping-copy" class="mo-ok"><i class="ti ti-copy" style="font-size:11px"></i> ${t('modal.shopping.copy')}</button>
        </div>
      </div>
    </div>`
  }

  if (m.type === 'share') {
    const url = m.url || ''
    const u = encodeURIComponent(url)
    const txt = encodeURIComponent(t('share.text'))
    const subject = encodeURIComponent(t('share.emailSubject'))
    const socials = url ? `
      <div class="share-socials">
        <a class="share-soc" href="https://wa.me/?text=${txt}%20${u}" target="_blank" rel="noopener"><i class="ti ti-brand-whatsapp"></i>WhatsApp</a>
        <a class="share-soc" href="https://www.facebook.com/sharer/sharer.php?u=${u}" target="_blank" rel="noopener"><i class="ti ti-brand-facebook"></i>Facebook</a>
        <a class="share-soc" href="https://twitter.com/intent/tweet?text=${txt}&url=${u}" target="_blank" rel="noopener"><i class="ti ti-brand-x"></i>X</a>
        <a class="share-soc" href="https://t.me/share/url?url=${u}&text=${txt}" target="_blank" rel="noopener"><i class="ti ti-brand-telegram"></i>Telegram</a>
        <a class="share-soc" href="mailto:?subject=${subject}&body=${txt}%20${u}"><i class="ti ti-mail"></i>${t('share.viaEmail')}</a>
      </div>` : ''
    return `
    <div class="ov" id="modal-overlay">
      <div class="mo" style="max-width:420px">
        <h3><i class="ti ti-share"></i> ${t('share.modalTitle')}</h3>
        <p style="font-size:11px;color:var(--t2);margin-bottom:12px">${t('share.modalDesc')}</p>
        ${m.loading
          ? `<div style="text-align:center;padding:18px;color:var(--t3);font-size:12px">
              <i class="ti ti-loader-2" style="font-size:18px;animation:spin 1s linear infinite"></i>
              <div style="margin-top:8px">${t('share.generating')}</div>
            </div>`
          : `<div class="share-url-row">
              <input id="share-url" type="text" readonly value="${url}" onclick="this.select()">
              <button class="share-copy-btn" id="share-copy"><i class="ti ti-copy" style="font-size:13px"></i> ${t('share.copyBtn')}</button>
            </div>
            ${socials}
            ${navigator.share ? `<button class="mo-ok" id="share-native" style="width:100%;margin-top:12px"><i class="ti ti-share" style="font-size:12px"></i> ${t('share.native')}</button>` : ''}`}
        <div class="mo-btns" style="margin-top:12px"><button id="close-modal" class="mo-cancel" style="flex:1">${t('btn.close')}</button></div>
      </div>
    </div>`
  }

  if (m.type === 'vtype-confirm') {
    const v = m.vtype
    const preset = VTYPE_PRESETS[v]
    const icon = { campervan: 'ti-camper', caravan: 'ti-caravan', van: 'ti-car' }[v] || 'ti-camper'
    const count = preset ? preset.apps.length : 0
    return `
    <div class="ov" id="modal-overlay">
      <div class="mo" style="max-width:400px">
        <h3><i class="ti ${icon}"></i> ${t('vt.' + v)}</h3>
        <p style="font-size:12px;color:var(--t2);line-height:1.5;margin-bottom:16px">
          ${t('modal.vtype.desc', { count, vtype: t('vt.' + v) })}
        </p>
        <div class="mo-btns" style="flex-direction:column;gap:8px">
          <button id="vtype-apply" class="mo-ok" style="width:100%">
            <i class="ti ti-wand" style="font-size:12px"></i> ${t('modal.vtype.apply')}
          </button>
          <button id="vtype-keep" class="mo-cancel" style="width:100%">${t('modal.vtype.keep')}</button>
        </div>
      </div>
    </div>`
  }

  if (m.type === 'auth' || m.type === 'auth-save') {
    return `
    <div class="ov" id="modal-overlay">
      <div class="mo" style="max-width:400px">
        <h3><i class="ti ti-user-circle"></i> ${t('modal.auth.title')}</h3>
        <p style="font-size:11px;color:var(--t2);margin-bottom:14px">
          ${t('modal.auth.desc')}
        </p>
        <button class="google-btn" id="auth-google">
          <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          ${t('modal.auth.google')}
        </button>
        <div class="auth-divider"><span>${t('modal.auth.orEmail')}</span></div>
        <input id="auth-email" type="email" placeholder="${t('modal.auth.emailPlaceholder')}"
          style="width:100%;margin-bottom:8px;background:var(--s2);border:1px solid var(--b1);border-radius:var(--r);color:var(--t1);font-size:12px;padding:8px 10px">
        <button id="auth-email-send" class="mo-ok" style="width:100%" ${S.authLoading ? 'disabled' : ''}>
          ${S.authLoading ? t('modal.auth.sending') : `<i class="ti ti-send" style="font-size:11px"></i> ${t('modal.auth.sendLink')}`}
        </button>
        <div class="mo-btns" style="margin-top:10px"><button id="close-modal" class="mo-cancel">${t('btn.cancel')}</button></div>
      </div>
    </div>`
  }

  if (m.type === 'auth-sent') {
    return `
    <div class="ov" id="modal-overlay">
      <div class="mo" style="max-width:380px;text-align:center">
        <div style="font-size:32px;margin-bottom:8px">📬</div>
        <h3>${t('modal.sent.title')}</h3>
        <p style="font-size:12px;color:var(--t2);margin-top:8px">
          ${t('modal.sent.body', { email: `<strong style="color:var(--t1)">${m.email}</strong>` })}
          <span style="color:var(--t3);font-size:11px">${t('modal.sent.valid')}</span>
        </p>
        <div class="mo-btns" style="margin-top:14px"><button id="close-modal" class="mo-cancel" style="flex:1">${t('btn.close')}</button></div>
      </div>
    </div>`
  }

  if (m.type === 'email-summary') {
    if (m.sent) {
      return `
      <div class="ov" id="modal-overlay">
        <div class="mo" style="max-width:380px;text-align:center">
          <div style="font-size:36px;margin-bottom:8px">✅</div>
          <h3>${t('modal.summary.sentTitle')}</h3>
          <p style="font-size:12px;color:var(--t2);margin:8px 0 16px">${t('modal.summary.sentBody', { email: `<strong style="color:var(--t1)">${m.email}</strong>` })}</p>
          <button id="close-modal" class="mo-ok" style="width:100%">${t('btn.close')}</button>
        </div>
      </div>`
    }
    return `
    <div class="ov" id="modal-overlay">
      <div class="mo" style="max-width:420px">
        <h3><i class="ti ti-mail-forward"></i> ${t('modal.summary.title')}</h3>
        <p style="font-size:11px;color:var(--t2);margin-bottom:14px">${t('modal.summary.desc')}</p>
        <input id="summary-email" type="email" placeholder="${t('modal.auth.emailPlaceholder')}"
          style="width:100%;margin-bottom:8px;background:var(--s2);border:1px solid var(--b1);border-radius:var(--r);color:var(--t1);font-size:12px;padding:8px 10px"
          value="${S.user?.email || ''}">
        <button id="summary-send" class="mo-ok" style="width:100%" ${S.summaryLoading ? 'disabled' : ''}>
          ${S.summaryLoading
            ? `<i class="ti ti-loader-2" style="font-size:11px;animation:spin 1s linear infinite"></i> ${t('modal.summary.sending')}`
            : `<i class="ti ti-send" style="font-size:11px"></i> ${t('modal.summary.send')}`}
        </button>
        ${m.error ? `<p style="font-size:11px;color:var(--rd);margin-top:8px;text-align:center">${m.error}</p>` : ''}
        <div class="mo-btns" style="margin-top:10px"><button id="close-modal" class="mo-cancel">${t('btn.cancel')}</button></div>
      </div>
    </div>`
  }

  if (m.type === 'save') {
    const isFree = S.user?.plan === 'free'
    const defaultName = S.userConfigs.length > 0 ? S.userConfigs[0].name : t('modal.save.defaultName')
    return `
    <div class="ov" id="modal-overlay">
      <div class="mo" style="max-width:380px">
        <h3><i class="ti ti-device-floppy"></i> ${t('modal.save.title')}</h3>
        <input id="save-name" type="text" placeholder="${t('modal.save.namePlaceholder')}" value="${defaultName}"
          style="width:100%;margin-bottom:8px;background:var(--s2);border:1px solid var(--b1);border-radius:var(--r);color:var(--t1);font-size:12px;padding:8px 10px">
        <div class="mo-btns">
          <button id="close-modal" class="mo-cancel">${t('btn.cancel')}</button>
          <button id="confirm-save" class="mo-ok" ${S.saveLoading ? 'disabled' : ''}>
            ${S.saveLoading ? t('modal.save.saving') : `<i class="ti ti-check" style="font-size:11px"></i> ${t('modal.save.save')}`}
          </button>
        </div>
      </div>
    </div>`
  }

  if (m.type === 'configs') {
    const isFree = S.user?.plan === 'free'
    return `
    <div class="ov" id="modal-overlay">
      <div class="mo">
        <h3><i class="ti ti-bookmark"></i> ${t('modal.configs.title')}</h3>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <span style="font-size:11px;color:var(--t3)">${S.user?.email}</span>
          <button id="auth-signout" style="margin-left:auto;font-size:10px;background:none;border:1px solid var(--b1);color:var(--t3);border-radius:var(--r);padding:3px 8px;cursor:pointer">
            <i class="ti ti-logout"></i> ${t('modal.configs.signout')}
          </button>
        </div>
        ${S.userConfigs.length === 0
          ? `<div style="text-align:center;padding:20px;color:var(--t3);font-size:12px">
              ${t('modal.configs.empty')}
             </div>`
          : S.userConfigs.map(c => `
            <div class="config-item">
              <div>
                <div class="ci-name">${c.name}</div>
                <div class="ci-date">${t('modal.configs.modified', { date: new Date(c.updated_at).toLocaleDateString(localeCode()) })}</div>
              </div>
              <div style="display:flex;gap:5px;align-items:center">
                <button class="mo-ok" style="padding:4px 10px;font-size:10px" data-load-config="${c.id}">
                  <i class="ti ti-upload" style="font-size:10px"></i> ${t('modal.configs.load')}
                </button>
                <button class="mo-cancel" style="padding:4px 8px;font-size:10px" data-del-config="${c.id}">
                  <i class="ti ti-trash" style="font-size:10px"></i>
                </button>
              </div>
            </div>`).join('')}
        <div class="mo-btns" style="margin-top:12px">
          <button id="close-modal" class="mo-cancel">${t('btn.close')}</button>
          <button class="mo-ok" id="open-save-from-configs"><i class="ti ti-plus" style="font-size:10px"></i> ${t('modal.configs.newSave')}</button>
        </div>
      </div>
    </div>`
  }

  if (m.type === 'catalog') {
    const cf = m.catFilter || 'Tout'
    const search = (m.search || '').toLowerCase().trim()
    const batV = S.bat?.v || 12
    const toAhLocal = (wh) => { const ah = wh / batV; return ah >= 10 ? Math.round(ah) : +ah.toFixed(1) }

    const allItems = search
      ? CATALOG.filter(c => c.n.toLowerCase().includes(search))
      : (cf === 'Tout' ? CATALOG : CATALOG.filter(c => c.cat === cf))

    return `
    <div class="ov" id="modal-overlay">
      <div class="mo">
        <h3><i class="ti ti-book"></i> Catalogue d'appareils <span style="font-size:10px;color:var(--t3);font-family:var(--mono);font-weight:400;margin-left:4px">${CATALOG.length} appareils</span></h3>
        <input id="catalog-search" type="text" placeholder="Rechercher un appareil…" value="${m.search || ''}"
          style="width:100%;margin-bottom:10px;background:var(--s2);border:1px solid var(--b1);border-radius:var(--r);color:var(--t1);font-size:12px;padding:8px 10px">
        <div class="catcatalog">
          ${CATS.map(c => `
            <div class="cf${cf === c && !search ? ' on' : ''}" data-modal-cat="${c}">${tcat(c)}</div>`).join('')}
        </div>
        <div class="catgrid">
          ${allItems.map(item => `
            <div class="catitem" data-catalog="${CATALOG.indexOf(item)}">
              <div>
                <div class="cin">${item.n}</div>
                <div class="cim"><span class="ciw">${item.w}W</span><span>${item.h}h/j</span><span style="color:var(--te)">${toAhLocal(item.w * item.h)} Ah/j</span></div>
              </div>
              <i class="ti ti-plus" style="font-size:14px;color:var(--t3)"></i>
            </div>`).join('')}
          ${allItems.length === 0 ? `<div style="grid-column:1/-1;padding:20px;text-align:center;color:var(--t3);font-size:11px">${!catalogLoaded ? 'Chargement du catalogue…' : 'Aucun appareil trouvé'}</div>` : ''}
        </div>
        <div class="mo-btns"><button id="close-modal" class="mo-cancel">${t('btn.close')}</button></div>
      </div>
    </div>`
  }
  return `
  <div class="ov" id="modal-overlay">
    <div class="mo">
      <h3><i class="ti ti-plus"></i> ${t('modal.custom.title')}</h3>
      <input id="mn" type="text" placeholder="${t('modal.custom.namePlaceholder')}" style="width:100%;margin-bottom:7px">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-bottom:7px">
        <div><label style="font-size:11px;color:var(--t2);display:block;margin-bottom:3px">${t('modal.custom.watts')}</label><input id="mw" type="number" placeholder="W" min="0" max="5000" style="width:100%"></div>
        <div><label style="font-size:11px;color:var(--t2);display:block;margin-bottom:3px">${t('modal.custom.hours')}</label><input id="mh" type="number" placeholder="h" min="0" max="24" step="0.5" value="4" style="width:100%"></div>
        <div><label style="font-size:11px;color:var(--t2);display:block;margin-bottom:3px">${t('modal.custom.category')}</label>
          <select id="mc" style="width:100%">${CATS.filter(c => c !== 'Tout').map(c => `<option value="${c}">${tcat(c)}</option>`).join('')}</select>
        </div>
      </div>
      <div class="mo-btns">
        <button id="close-modal" class="mo-cancel">${t('btn.cancel')}</button>
        <button id="confirm-custom" class="mo-ok">${t('btn.add')}</button>
      </div>
    </div>
  </div>`
}

// ─── EVENTS ──────────────────────────────────────────────────────────────────

function bindEvents() {
  // Language switch
  document.querySelectorAll('[data-lang]').forEach(el => el.addEventListener('click', () => {
    setLang(el.dataset.lang)
    render()
  }))
  // Vtypes — propose de charger le preset d'appareils du véhicule choisi
  document.querySelectorAll('[data-vtype]').forEach(el => el.addEventListener('click', () => {
    const v = el.dataset.vtype
    if (v === S.vtype) return
    set({ modal: { type: 'vtype-confirm', vtype: v } })
  }))
  // Modal vtype : confirmer le chargement des presets ou changer le type sans toucher aux appareils
  document.getElementById('vtype-apply')?.addEventListener('click', () => applyVtypePreset(S.modal.vtype))
  document.getElementById('vtype-keep')?.addEventListener('click', () => set({ vtype: S.modal.vtype, modal: null }))

  // Wizard d'onboarding (#17)
  document.querySelectorAll('[data-wiz-vtype]').forEach(el => el.addEventListener('click', () =>
    set({ modal: { ...S.modal, vtype: el.dataset.wizVtype } })))
  document.querySelectorAll('[data-wiz-usage]').forEach(el => el.addEventListener('click', () => {
    const cur = new Set(S.modal.usages || USAGE_IDS)
    const id = el.dataset.wizUsage
    cur.has(id) ? cur.delete(id) : cur.add(id)
    set({ modal: { ...S.modal, usages: [...cur] } })
  }))
  document.querySelectorAll('[data-wiz-solar]').forEach(el => el.addEventListener('click', () =>
    set({ modal: { ...S.modal, solar: el.dataset.wizSolar } })))
  document.querySelectorAll('[data-wiz-budget]').forEach(el => el.addEventListener('click', () =>
    set({ modal: { ...S.modal, budget: el.dataset.wizBudget } })))
  document.getElementById('wiz-next')?.addEventListener('click', () => {
    const m = S.modal
    // À l'entrée de l'étape 2, pré-cocher tous les usages si rien n'est encore défini
    const usages = m.usages || USAGE_IDS
    set({ modal: { ...m, step: (m.step || 1) + 1, usages } })
  })
  document.getElementById('wiz-back')?.addEventListener('click', () =>
    set({ modal: { ...S.modal, step: Math.max(1, (S.modal.step || 1) - 1) } }))
  document.getElementById('wiz-finish')?.addEventListener('click', () => finishWizard(S.modal))
  document.getElementById('wiz-skip')?.addEventListener('click', () => skipWizard())
  // Tabs
  document.querySelectorAll('[data-tab]').forEach(el => el.addEventListener('click', () => set({ tab: el.dataset.tab })))
  // Categories filter
  document.querySelectorAll('[data-cat]').forEach(el => el.addEventListener('click', () => set({ catFilter: el.dataset.cat })))
  // App toggles
  document.querySelectorAll('[data-toggle]').forEach(el => el.addEventListener('click', () => {
    const id = parseInt(el.dataset.toggle)
    set({ apps: S.apps.map(a => a.id === id ? { ...a, on: !a.on } : a) })
  }))
  // App field edits
  document.querySelectorAll('.fi').forEach(inp => inp.addEventListener('change', e => {
    const id = parseInt(e.target.dataset.id), field = e.target.dataset.field, val = parseFloat(e.target.value) || 0
    set({ apps: S.apps.map(a => a.id === id ? { ...a, [field]: val } : a) })
  }))
  // Delete app
  document.querySelectorAll('[data-del]').forEach(el => el.addEventListener('click', () => {
    const id = parseInt(el.dataset.del)
    set({ apps: S.apps.filter(a => a.id !== id) })
  }))
  // Alternateur
  document.getElementById('alt-toggle')?.addEventListener('click', () => set({ altOn: !S.altOn }))
  document.getElementById('alt-amps')?.addEventListener('change', e => set({ altAmps: Math.max(5, parseFloat(e.target.value) || 20) }))
  document.getElementById('alt-hours')?.addEventListener('change', e => set({ altHours: Math.max(0.5, parseFloat(e.target.value) || 2) }))
  // Battery type filter
  document.querySelectorAll('[data-btype]').forEach(el => el.addEventListener('click', () => {
    const t = el.dataset.btype
    const u = { batType: t }
    // Si la batterie sélectionnée n'est pas du type choisi, basculer sur la première de ce type
    if (S.bat.type !== t) {
      const first = BATS.find(b => b.type === t)
      if (first) { u.bat = first; u.dod = DOD[first.type] }
    }
    set(u)
  }))
  // Battery options
  document.querySelectorAll('[data-bat]').forEach(el => el.addEventListener('click', () => {
    const b = BATS[parseInt(el.dataset.bat)]
    set({ bat: b, dod: DOD[b.type], batType: b.type })
  }))
  // Parallel count
  document.querySelectorAll('[data-nb]').forEach(el => el.addEventListener('click', () => set({ batNb: parseInt(el.dataset.nb) })))
  // DoD slider
  document.getElementById('dod-range')?.addEventListener('input', e => set({ dod: parseFloat(e.target.value) }))
  // Solar panels
  document.getElementById('sol-toggle')?.addEventListener('click', () => {
    const solOn = !S.solOn
    // Ajout/retrait automatique du régulateur MPPT dans les consommateurs
    let apps = S.apps
    if (solOn) {
      const hasMppt = apps.some(a => /mppt|régulateur/i.test(a.n))
      if (!hasMppt) {
        apps = [...apps, { id: Date.now(), n: 'Régulateur MPPT', icon: 'ti-solar-panel', w: 5, h: 24, on: true, cat: 'Système' }]
      }
    } else {
      // Décoché : on retire le régulateur MPPT des consommateurs
      apps = apps.filter(a => !/mppt|régulateur/i.test(a.n))
    }
    set({ solOn, apps })
  })
  document.querySelectorAll('[data-panel]').forEach(el => el.addEventListener('click', () => set({ solW: parseInt(el.dataset.panel) })))
  document.getElementById('sol-nb')?.addEventListener('change', e => set({ solNb: Math.max(1, parseInt(e.target.value) || 1) }))
  document.getElementById('sol-eff')?.addEventListener('change', e => set({ solEff: Math.min(0.98, Math.max(0.6, (parseInt(e.target.value) || 85) / 100)) }))
  document.getElementById('sun-zone')?.addEventListener('change', e => set({ sunIdx: parseInt(e.target.value) }))
  document.getElementById('custom-sun')?.addEventListener('input', e => { S.customSunH = e.target.value; render() })
  // Mode switch on appliance card
  document.querySelectorAll('[data-mode-id]').forEach(el => el.addEventListener('click', () => {
    const id = parseInt(el.dataset.modeId), mi = parseInt(el.dataset.modeIdx)
    set({ apps: S.apps.map(a => {
      if (a.id !== id) return a
      const newW = a.modes[mi]?.watts ?? a.w
      return { ...a, activeMode: mi, w: newW }
    })})
  }))
  // Open modals
  document.getElementById('open-custom')?.addEventListener('click', () => set({ modal: { type: 'custom' } }))
  // Modal overlay close
  document.getElementById('modal-overlay')?.addEventListener('click', e => {
    if (e.target.id !== 'modal-overlay') return
    // Le wizard exige un choix explicite (Passer / Terminer) pour ne pas réapparaître
    if (S.modal?.type === 'wizard') return
    set({ modal: null })
  })
  document.getElementById('close-modal')?.addEventListener('click', () => set({ modal: null }))
  document.getElementById('confirm-custom')?.addEventListener('click', confirmCustom)
  // Catalog category filter inside modal
  document.querySelectorAll('[data-modal-cat]').forEach(el => el.addEventListener('click', () => set({ modal: { ...S.modal, catFilter: el.dataset.modalCat } })))
  // Add from local catalog presets
  document.querySelectorAll('[data-catalog]').forEach(el => el.addEventListener('click', () => {
    const item = CATALOG[parseInt(el.dataset.catalog)]
    set({ apps: [...S.apps, { id: Date.now(), n: item.n, icon: item.icon, w: item.w, h: item.h, on: true, cat: item.cat }], modal: null, tab: 'energy' })
  }))
  // Add catalog
  document.getElementById('open-catalog')?.addEventListener('click', () => set({ modal: { type: 'catalog', catFilter: 'Tout', search: '' } }))
  document.getElementById('catalog-search')?.addEventListener('input', e => { set({ modal: { ...S.modal, search: e.target.value } }) })

  // Comparateur
  document.getElementById('capture-a')?.addEventListener('click', () => captureScenario('A'))
  document.getElementById('capture-b')?.addEventListener('click', () => captureScenario('B'))
  document.getElementById('goto-dashboard')?.addEventListener('click', () => set({ tab: 'energy' }))
  document.querySelectorAll('[data-clear-scenario]').forEach(el => el.addEventListener('click', () => {
    set({ scenarios: { ...S.scenarios, [el.dataset.clearScenario]: null } })
  }))
  // Email summary buttons
  const openSummaryModal = () => set({ modal: { type: 'email-summary' } })
  document.getElementById('export-pdf')?.addEventListener('click', openSummaryModal)
  document.getElementById('export-compare-pdf')?.addEventListener('click', openSummaryModal)
  // Partage de configuration — ouvre la fenêtre de partage (#13)
  document.getElementById('share-config-btn')?.addEventListener('click', openShareModal)
  document.getElementById('open-shopping-list')?.addEventListener('click', () => set({ modal: { type: 'shopping-list' } }))
  document.getElementById('shopping-copy')?.addEventListener('click', async () => {
    const items = buildShoppingItems()
    const ok = await copyText(shoppingListToText(items))
    showToast(ok ? t('modal.shopping.copied') : '')
  })
  document.getElementById('share-header-btn')?.addEventListener('click', openShareModal)
  document.getElementById('share-copy')?.addEventListener('click', async () => {
    const ok = await copyText(S.modal?.url || '')
    showToast(ok ? t('share.copied') : t('share.failed'))
  })
  document.getElementById('share-native')?.addEventListener('click', async () => {
    try { await navigator.share({ title: t('share.modalTitle'), text: t('share.text'), url: S.modal?.url }) } catch (_) {}
  })
  // Email summary modal — send
  document.getElementById('summary-send')?.addEventListener('click', async () => {
    const email = document.getElementById('summary-email')?.value?.trim()
    if (!email) return
    set({ summaryLoading: true })
    try {
      const html = buildEmailSummaryHtml()
      const { cons, autDays } = calc()
      const autStr = !isFinite(autDays) ? '∞' : autDays < 1 ? (autDays * 24).toFixed(1) + 'h' : autDays.toFixed(1) + 'j'
      const subject = `${t('modal.summary.emailSubject')} — ${autStr} · ${toAh(cons)} Ah/j`
      const res = await fetch('/api/send-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, subject, html }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Erreur envoi')
      set({ summaryLoading: false, modal: { type: 'email-summary', sent: true, email } })
    } catch (err) {
      set({ summaryLoading: false, modal: { ...S.modal, error: err.message } })
    }
  })

  // Auth
  document.getElementById('open-auth')?.addEventListener('click', () => set({ modal: { type: 'auth' } }))
  document.getElementById('open-configs')?.addEventListener('click', () => set({ modal: { type: 'configs' } }))
  document.getElementById('auth-google')?.addEventListener('click', () => signInWithGoogle())
  document.getElementById('auth-email-send')?.addEventListener('click', () => {
    const email = document.getElementById('auth-email')?.value?.trim()
    if (email) signInWithEmail(email)
  })
  document.getElementById('auth-signout')?.addEventListener('click', () => signOut())

  // Save config
  document.getElementById('save-config-btn')?.addEventListener('click', () => {
    if (!S.user) { set({ modal: { type: 'auth' } }); return }
    set({ modal: { type: 'save' } })
  })
  document.getElementById('confirm-save')?.addEventListener('click', () => {
    const name = document.getElementById('save-name')?.value?.trim() || 'Ma configuration'
    saveCurrentConfig(name)
  })
  document.getElementById('open-save-from-configs')?.addEventListener('click', () => set({ modal: { type: 'save' } }))

  // Load / delete configs
  document.querySelectorAll('[data-load-config]').forEach(el => el.addEventListener('click', () => loadConfig(el.dataset.loadConfig)))
  document.querySelectorAll('[data-del-config]').forEach(el => el.addEventListener('click', () => {
    if (confirm(t('confirm.deleteConfig'))) deleteConfig(el.dataset.delConfig)
  }))
}

function confirmCustom() {
  const n = document.getElementById('mn')?.value?.trim()
  const w = parseFloat(document.getElementById('mw')?.value) || 0
  const h = parseFloat(document.getElementById('mh')?.value) || 0
  const cat = document.getElementById('mc')?.value || 'Tech'
  if (!n) return
  set({ apps: [...S.apps, { id: Date.now(), n, icon: ICON_BY_CAT[cat] || 'ti-plug', w, h, on: true, cat }], modal: null })
}

// ─── CATALOGUE (100% Supabase) ───────────────────────────────────────────────
// Charge le catalogue d'appareils depuis equipment_catalog. Aucune donnée
// statique : la table est alimentée par le seed initial + l'agent hebdomadaire
// (api/cron-catalog.js) qui n'insère jamais de doublon et ne supprime rien.
let catalogLoaded = false
async function loadCatalogFromDB() {
  try {
    const { data, error } = await supabase
      .from('equipment_catalog')
      .select('name, icon, watts, hours, category')
      .not('category', 'is', null)
      .not('watts', 'is', null)
      .order('category', { ascending: true })
      .order('name', { ascending: true })
    if (error) throw error
    CATALOG = (data || []).map(r => ({
      n: r.name,
      icon: r.icon || ICON_BY_CAT[r.category] || 'ti-plug',
      w: Number(r.watts),
      h: r.hours != null ? Number(r.hours) : 4,
      cat: r.category,
    }))
  } catch (e) {
    console.warn('Catalogue indisponible :', e?.message || e)
    CATALOG = []
  } finally {
    catalogLoaded = true
    if (S.modal?.type === 'catalog') render()
  }
}

// ─── BOOT ────────────────────────────────────────────────────────────────────
initLang()
loadPersistedState()
// Une config partagée (?c= base64 ou ?s= lien court) a priorité sur le localStorage (#13)
const sharedLoaded = loadStateFromURL()
const hasShortParam = new URLSearchParams(window.location.search).has('s')
// Première visite → wizard d'onboarding (#17) — sauf si on arrive via un lien partagé
try {
  if (!sharedLoaded && !hasShortParam && !localStorage.getItem(ONBOARDED_KEY)) {
    S.modal = { type: 'wizard', step: 1, vtype: S.vtype, usages: USAGE_IDS.slice(), solar: null, budget: null }
  }
} catch (_) {}
render()
if (sharedLoaded) showToast(t('share.loaded'))
if (hasShortParam) loadShortLink()  // chargement asynchrone depuis Supabase
loadCatalogFromDB()                 // catalogue chargé 100% depuis Supabase
initAuth()
