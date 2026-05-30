// OffroadWatt — Calculateur d'autonomie électrique
// Vanilla JS / Vite
import { createClient } from '@supabase/supabase-js'

// ─── DATA ────────────────────────────────────────────────────────────────────

const BATS = [
  { ah: 60,  v: 12, label: '60 Ah 12V',  type: 'AGM', eur: 110  },
  { ah: 100, v: 12, label: '100 Ah 12V', type: 'AGM', eur: 180  },
  { ah: 120, v: 12, label: '120 Ah 12V', type: 'AGM', eur: 230  },
  { ah: 150, v: 12, label: '150 Ah 12V', type: 'GEL', eur: 320  },
  { ah: 200, v: 12, label: '200 Ah 12V', type: 'LI',  eur: 550  },
  { ah: 300, v: 12, label: '300 Ah 12V', type: 'LI',  eur: 850  },
  { ah: 400, v: 12, label: '400 Ah 12V', type: 'LI',  eur: 1150 },
  { ah: 200, v: 24, label: '200 Ah 24V', type: 'LI',  eur: 650  },
  { ah: 400, v: 24, label: '400 Ah 24V', type: 'LI',  eur: 1300 },
]

// Coûts indicatifs marché européen pour le calcul système
const PANEL_EUR_PER_WC = 1.2  // panneau + fixation
const ALT_EUR_PER_A    = 8    // chargeur DC-DC (B2B) selon ampérage

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

const CATALOG = [
  { n: 'Réfrigérateur compresseur 12V', icon: 'ti-fridge', w: 45, h: 24, cat: 'Cuisine' },
  { n: 'Réfrigérateur à absorption', icon: 'ti-fridge', w: 180, h: 24, cat: 'Cuisine' },
  { n: 'Congélateur portable 12V', icon: 'ti-snowflake', w: 55, h: 24, cat: 'Cuisine' },
  { n: 'Plaque induction 1 feu', icon: 'ti-flame', w: 1500, h: 0.5, cat: 'Cuisine' },
  { n: 'Micro-ondes', icon: 'ti-microwave', w: 900, h: 0.3, cat: 'Cuisine' },
  { n: 'Machine à café', icon: 'ti-coffee', w: 800, h: 0.2, cat: 'Cuisine' },
  { n: 'Cafetière filtre', icon: 'ti-cup', w: 700, h: 0.2, cat: 'Cuisine' },
  { n: 'Bouilloire électrique', icon: 'ti-droplet', w: 1500, h: 0.1, cat: 'Cuisine' },
  { n: 'Ventilateur 12V', icon: 'ti-wind', w: 20, h: 8, cat: 'Confort' },
  { n: 'Climatiseur 12V portatif', icon: 'ti-air-conditioning', w: 400, h: 4, cat: 'Confort' },
  { n: 'Chauffage diesel (Webasto/Eberspächer)', icon: 'ti-temperature', w: 40, h: 8, cat: 'Confort' },
  { n: 'Chauffage électrique soufflant', icon: 'ti-temperature', w: 1000, h: 3, cat: 'Confort' },
  { n: 'Couverture chauffante 12V', icon: 'ti-bed', w: 60, h: 6, cat: 'Confort' },
  { n: 'Chauffe-eau électrique', icon: 'ti-droplets', w: 1200, h: 0.5, cat: 'Confort' },
  { n: 'Laptop / MacBook', icon: 'ti-device-laptop', w: 65, h: 4, cat: 'Tech' },
  { n: 'Smartphone ×2', icon: 'ti-device-mobile', w: 15, h: 3, cat: 'Tech' },
  { n: 'Tablette', icon: 'ti-device-tablet', w: 20, h: 3, cat: 'Tech' },
  { n: 'Télévision 24"', icon: 'ti-device-tv', w: 80, h: 3, cat: 'Tech' },
  { n: 'Drone (chargeur)', icon: 'ti-drone', w: 60, h: 2, cat: 'Tech' },
  { n: 'Appareil photo', icon: 'ti-camera', w: 10, h: 2, cat: 'Tech' },
  { n: 'Routeur 4G/WiFi', icon: 'ti-wifi', w: 10, h: 24, cat: 'Tech' },
  { n: 'Enceinte Bluetooth', icon: 'ti-music', w: 10, h: 4, cat: 'Tech' },
  { n: 'Pompe à eau 12V', icon: 'ti-droplet', w: 50, h: 0.5, cat: 'Eau' },
  { n: 'Douche extérieure chauffante', icon: 'ti-droplets', w: 200, h: 0.3, cat: 'Eau' },
  { n: 'WC électrique (Dometic)', icon: 'ti-toilet-paper', w: 30, h: 0.2, cat: 'Eau' },
  { n: 'Éclairage LED bande 5m', icon: 'ti-bulb', w: 12, h: 5, cat: 'Éclairage' },
  { n: 'Spots LED encastrés ×4', icon: 'ti-lamp', w: 20, h: 4, cat: 'Éclairage' },
  { n: "Lumière d'ambiance 12V", icon: 'ti-lamp-2', w: 8, h: 4, cat: 'Éclairage' },
  { n: 'Phares de travail ext.', icon: 'ti-focus', w: 50, h: 2, cat: 'Éclairage' },
  { n: 'Convertisseur 12V→230V', icon: 'ti-plug', w: 30, h: 24, cat: 'Système' },
  { n: 'Régulateur MPPT', icon: 'ti-solar-panel', w: 5, h: 24, cat: 'Système' },
  { n: 'BMS batterie Lithium', icon: 'ti-battery-charging', w: 3, h: 24, cat: 'Système' },
  { n: 'Alarme / GPS tracker', icon: 'ti-map-pin', w: 5, h: 24, cat: 'Système' },
]

const CATS = ['Tout', 'Cuisine', 'Confort', 'Tech', 'Eau', 'Éclairage', 'Système']
const CATICONS = {
  Cuisine: 'ti-bowl-spoon', Confort: 'ti-armchair', Tech: 'ti-cpu',
  Eau: 'ti-droplet', Éclairage: 'ti-bulb', Système: 'ti-settings', Tout: 'ti-apps',
}

// ─── API KEY ──────────────────────────────────────────────────────────────────
const API_KEY = import.meta.env.VITE_ANTHROPIC_KEY || ''

// ─── SUPABASE ─────────────────────────────────────────────────────────────────

const SB_URL  = 'https://ofjpskrjlwfebaqomijm.supabase.co'
const SB_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9manBza3JqbHdmZWJhcW9taWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODIzMTMsImV4cCI6MjA5NTY1ODMxM30.R2hqPwmvihdgVv7rwLp0r--Jo0Qp6m6ORc-PU4M58n8'
const SB_HDR  = { 'Content-Type': 'application/json', 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }

// Client Supabase (auth + requêtes authentifiées)
const supabase = createClient(SB_URL, SB_KEY)

// ─── AI RATE LIMIT ────────────────────────────────────────────────────────────

const AI_LIMIT_FREE = 5

function getAiSearchesLeft() {
  if (S.user?.plan === 'pro') return Infinity
  const today = new Date().toDateString()
  const stored = JSON.parse(localStorage.getItem('ow_ai_searches') || '{}')
  if (stored.date !== today) return AI_LIMIT_FREE
  return Math.max(0, AI_LIMIT_FREE - (stored.count || 0))
}

function consumeAiSearch() {
  const today = new Date().toDateString()
  const stored = JSON.parse(localStorage.getItem('ow_ai_searches') || '{}')
  const count = stored.date === today ? (stored.count || 0) + 1 : 1
  localStorage.setItem('ow_ai_searches', JSON.stringify({ date: today, count }))
}

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
  if (error) { set({ authLoading: false }); alert('Erreur : ' + error.message); return }
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
    vtype: S.vtype, apps: S.apps, bat: S.bat, batNb: S.batNb, dod: S.dod,
    solW: S.solW, solNb: S.solNb, solEff: S.solEff, sunIdx: S.sunIdx, customSunH: S.customSunH,
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

// Cache mémoire pour éviter des requêtes répétées à Supabase dans la session
let _catalogCache = null
let _catalogCacheAt = 0

async function loadCatalogFromDB() {
  if (_catalogCache && Date.now() - _catalogCacheAt < 60_000) return _catalogCache
  try {
    const res = await fetch(`${SB_URL}/rest/v1/equipment_catalog?select=*&order=created_at.desc&limit=500`, { headers: SB_HDR })
    if (!res.ok) return []
    _catalogCache = await res.json()
    _catalogCacheAt = Date.now()
    return _catalogCache
  } catch { return [] }
}

async function searchCatalog(q) {
  if (!q.trim()) return []
  const terms = q.toLowerCase().split(/\s+/).filter(t => t.length > 2)
  if (!terms.length) return []

  // Recherche via full-text Postgres (rapide)
  const tsQuery = terms.join(' | ')
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/equipment_catalog?select=*&fts=search_vector.phfts(french).${encodeURIComponent(tsQuery)}&limit=10`,
      { headers: SB_HDR }
    )
    if (res.ok) {
      const rows = await res.json()
      if (rows.length) return rows
    }
  } catch {}

  // Fallback : filtre client sur le cache
  const catalog = await loadCatalogFromDB()
  return catalog.filter(r => {
    const hay = [r.name, r.brand, r.type, r.description].join(' ').toLowerCase()
    return terms.some(t => hay.includes(t))
  })
}

async function mergeIntoCatalog(newResults) {
  if (!newResults.length) return
  const rows = newResults.map(r => ({
    name: r.name,
    brand: r.brand || null,
    voltage: r.voltage || 12,
    price_eur: r.price_eur || null,
    description: r.description || null,
    type: r.type || null,
    efficiency: r.efficiency || null,
    modes: r.modes || null,
    search_keywords: [r.name, r.brand, r.type].filter(Boolean).map(s => s.toLowerCase()),
  }))
  try {
    await fetch(`${SB_URL}/rest/v1/equipment_catalog`, {
      method: 'POST',
      headers: { ...SB_HDR, 'Prefer': 'resolution=ignore-duplicates' },
      body: JSON.stringify(rows),
    })
    _catalogCache = null // invalider le cache
  } catch {}
}

// Mapping type Supabase → catégorie locale
function sbTypeToCat(type) {
  if (!type) return null
  const t = type.toLowerCase()
  if (/chauffage|climatiseur|clim|ventilat|confort|couverture/.test(t)) return 'Confort'
  if (/réfrigér|frigo|congél|micro.onde|café|bouilloire|plaque|cuisine|cuisson/.test(t)) return 'Cuisine'
  if (/éclairage|lampe|led|lumière|spot|phare/.test(t)) return 'Éclairage'
  if (/pompe|eau|douche|wc|toilette/.test(t)) return 'Eau'
  if (/laptop|ordinat|télé|tv|smartphone|téléphone|routeur|drone|appareil.photo|enceinte|tablette/.test(t)) return 'Tech'
  if (/convertisseur|régulat|bms|alarme|gps|système|onduleur/.test(t)) return 'Système'
  return null
}

// ─── STATE ───────────────────────────────────────────────────────────────────

let S = {
  vtype: 'campervan',
  apps: [
    { id: 1, n: 'Réfrigérateur 12V',  icon: 'ti-fridge',         w: 45,  h: 24,   on: true,  cat: 'Cuisine'   },
    { id: 2, n: 'Éclairage LED',       icon: 'ti-bulb',           w: 15,  h: 5,    on: true,  cat: 'Éclairage' },
    { id: 3, n: 'Ventilateur 12V',     icon: 'ti-wind',           w: 20,  h: 8,    on: true,  cat: 'Confort'   },
    { id: 4, n: 'Laptop',              icon: 'ti-device-laptop',  w: 65,  h: 4,    on: true,  cat: 'Tech'      },
    { id: 5, n: 'Smartphone ×2',       icon: 'ti-device-mobile',  w: 15,  h: 3,    on: true,  cat: 'Tech'      },
    { id: 6, n: 'Pompe à eau',         icon: 'ti-droplet',        w: 50,  h: 0.5,  on: false, cat: 'Eau'       },
    { id: 7, n: 'Micro-ondes',         icon: 'ti-microwave',      w: 900, h: 0.25, on: false, cat: 'Cuisine'   },
    { id: 8, n: 'Routeur 4G',          icon: 'ti-wifi',           w: 10,  h: 24,   on: false, cat: 'Tech'      },
    { id: 9, n: 'Convertisseur',       icon: 'ti-plug',           w: 30,  h: 24,   on: false, cat: 'Système'   },
  ],
  bat: BATS[4], batNb: 1, dod: 0.8,
  solW: 200, solNb: 2, solEff: 0.85, sunIdx: 3, customSunH: '',
  altOn: false, altAmps: 20, altHours: 2,
  aiQuery: '', aiResults: [], aiCatalogResults: [], aiOnlineResults: [], aiLoading: false, aiError: null,
  modal: null, tab: 'energy', catFilter: 'Tout',
  user: null, userConfigs: [], authLoading: false, saveLoading: false,
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

// ─── CORE ────────────────────────────────────────────────────────────────────

const set = (u) => { Object.assign(S, u); persistState(); render() }
const sunHOf = (st) => st.sunIdx === SUN_ZONES.length - 1 ? (parseFloat(st.customSunH) || 4.5) : SUN_ZONES[st.sunIdx].h
const sunH = () => sunHOf(S)

const ALT_EFF = 0.7 // rendement régulateur/pertes câbles

function calc(st = S) {
  const active = st.apps.filter(a => a.on)
  const cons = active.reduce((s, a) => s + a.w * a.h, 0)
  const solar = st.solW * st.solNb * sunHOf(st) * st.solEff
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
  const solCost = Math.round(st.solW * st.solNb * PANEL_EUR_PER_WC)
  const altCost = st.altOn ? Math.round(st.altAmps * ALT_EUR_PER_A) : 0
  return { batCost, solCost, altCost, total: batCost + solCost + altCost }
}

// Capture une copie figée de la configuration énergétique courante
function snapshotState(label) {
  const snap = JSON.parse(JSON.stringify({
    vtype: S.vtype, apps: S.apps, bat: S.bat, batNb: S.batNb, dod: S.dod,
    solW: S.solW, solNb: S.solNb, solEff: S.solEff, sunIdx: S.sunIdx, customSunH: S.customSunH,
    altOn: S.altOn, altAmps: S.altAmps, altHours: S.altHours,
  }))
  snap.label = label
  return snap
}

function captureScenario(slot) {
  const snap = snapshotState(slot === 'A' ? 'Setup A' : 'Setup B')
  set({ scenarios: { ...S.scenarios, [slot]: snap }, tab: 'compare' })
}

const fmtDays = (d) => isFinite(d) ? (d < 1 ? (d * 24).toFixed(1) + ' h' : d.toFixed(1) + ' j') : '∞'

// ─── RENDER ──────────────────────────────────────────────────────────────────

function render() {
  document.getElementById('root').innerHTML = buildHTML()
  bindEvents()
}

function buildHTML() {
  return `
    ${S.modal ? buildModal() : ''}
    ${buildHeader()}
    ${buildTabs()}
    ${S.tab === 'apps'    ? buildAppsTab()    : ''}
    ${S.tab === 'energy'  ? buildEnergyTab()  : ''}
    ${S.tab === 'compare' ? buildCompareTab() : ''}
    ${S.tab === 'ai'      ? buildAITab()      : ''}
    ${S.tab === 'deploy'  ? buildDeployTab()  : ''}
  `
}

function buildHeader() {
  const authEl = S.user
    ? `<div class="auth-btn on" id="open-configs" title="Mes configurations">
        <i class="ti ti-user-circle" style="font-size:15px"></i>
        <span>${S.user.email.split('@')[0]}</span>
        ${S.user.plan === 'pro' ? '<span class="pro-badge">PRO</span>' : ''}
        <i class="ti ti-chevron-down" style="font-size:10px;color:var(--t3)"></i>
      </div>`
    : `<button class="auth-btn" id="open-auth">
        <i class="ti ti-user" style="font-size:14px"></i> Se connecter
      </button>`

  return `
  <div class="hdr">
    <div>
      <div class="logo">OFFROAD<em>WATT</em></div>
      <div class="sub">Calculateur d'autonomie électrique • camping-car • caravane • van</div>
    </div>
    <div class="vtypes">
      ${[['campervan','ti-camper-van','Camping-car'],['caravan','ti-caravan','Caravane'],['van','ti-car','Van']].map(([v,ic,lb]) => `
        <div class="vt${S.vtype === v ? ' on' : ''}" data-vtype="${v}">
          <i class="${ic}"></i><span>${lb}</span>
        </div>`).join('')}
      ${authEl}
    </div>
  </div>`
}

function buildTabs() {
  return `
  <div class="tabs">
    ${[['energy','ti-bolt','Dashboard'],['apps','ti-plug','Appareils'],['compare','ti-arrows-diff','Comparer'],['ai','ti-sparkles','Recherche IA'],['deploy','ti-rocket','Déploiement']].map(([k,ic,lb]) => `
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
      <span class="an" title="${a.n}">${a.n}</span>
      <div class="hf"><input type="number" min="0" max="24" step="0.5" value="${a.h}" data-id="${a.id}" data-field="h" class="fi"><span>h/j</span></div>
      <span class="wh">${a.on ? Math.round(a.w * a.h) : 0} Wh</span>
      <button class="delbtn" data-del="${a.id}"><i class="ti ti-trash" style="font-size:12px"></i></button>
      <div class="mode-btns">
        ${a.modes.map((m, mi) => `
          <button class="modebtn${a.activeMode === mi ? ' on' : ''}" data-mode-id="${a.id}" data-mode-idx="${mi}">
            <span class="modew">${m.watts}W</span>
            <span class="model">${m.label.length > 12 ? m.label.slice(0, 11) + '…' : m.label}</span>
          </button>`).join('')}
      </div>
    </div>`
  }
  return `
  <div class="arow two-row${!a.on ? ' off' : ''}">
    <button class="tog${a.on ? ' on' : ''}" data-toggle="${a.id}"></button>
    <i class="${a.icon} ai"></i>
    <span class="an" title="${a.n}">${a.n}</span>
    <span class="wh">${a.on ? Math.round(a.w * a.h) : 0} Wh</span>
    <button class="delbtn" data-del="${a.id}"><i class="ti ti-trash" style="font-size:12px"></i></button>
    <div class="row-inputs">
      <div class="wf"><input type="number" min="0" max="5000" value="${a.w}" data-id="${a.id}" data-field="w" class="fi"><span>W</span></div>
      <div class="hf"><input type="number" min="0" max="24" step="0.5" value="${a.h}" data-id="${a.id}" data-field="h" class="fi"><span>h/j</span></div>
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
          <span><i class="ti ${CATICONS[cat] || 'ti-plug'}" style="font-size:10px;margin-right:4px"></i>${cat}</span>
          <span class="appgroup-wh">${Math.round(gWh)} Wh</span>
        </div>
        ${items.map(a => buildAppRow(a)).join('')}
      </div>`
  }).join('')
  return `
  <div class="card">
    <div class="ct"><i class="ti ti-plug"></i>Appareils consommateurs</div>
    <div class="applist">
      ${groups}
    </div>
    <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">
      <button class="addbtn" style="flex:1;min-width:140px" id="open-catalog"><i class="ti ti-book"></i>Catalogue</button>
      <button class="addbtn" style="flex:1;min-width:140px" id="open-custom"><i class="ti ti-plus"></i>Personnalisé</button>
    </div>
    <div class="cons-footer">
      <div>
        <div style="font-size:11px;color:var(--t2)">${active.length} actif(s) sur ${S.apps.length}</div>
        <div style="font-size:10px;color:var(--t3)">Désactivés exclus du calcul</div>
      </div>
      <div style="text-align:right">
        <div class="cf-num">${Math.round(total)} <span style="font-size:11px;font-weight:400;color:var(--t2)">Wh/jour</span></div>
        <div style="font-size:10px;color:var(--t3)">consommation totale</div>
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
      if (z.r !== lastR) { if (lastR) html += '</optgroup>'; html += `<optgroup label="${z.r}">`; lastR = z.r }
      html += `<option value="${i}"${S.sunIdx === i ? ' selected' : ''}>${z.n}${i < SUN_ZONES.length - 1 ? ' — ' + z.h + 'h/j' : ''}</option>`
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
        <div class="ct"><i class="ti ti-battery-charging"></i>Banc de batteries</div>
        <div class="batgrid">
          ${BATS.map((b, i) => `
            <div class="bopt${S.bat.ah === b.ah && S.bat.v === b.v ? ' on' : ''}" data-bat="${i}">
              <div class="bah">${b.ah}Ah</div><div class="btype">${b.type} ${b.v}V</div>
            </div>`).join('')}
        </div>
        <div class="nb-row">
          <label>En parallèle</label>
          <div class="nb-btns">
            ${[1,2,3,4,5,6,7,8,9,10].map(n => `<div class="nbb${S.batNb === n ? ' on' : ''}" data-nb="${n}">${n}</div>`).join('')}
          </div>
        </div>
        <div class="dod-row">
          <label>Profondeur décharge</label>
          <input id="dod-range" type="range" min="0.4" max="1" step="0.05" value="${S.dod}">
          <span class="dv">${Math.round(S.dod * 100)}%</span>
        </div>
        <div style="font-size:10px;color:var(--t3);margin-top:3px">LiPo 80% · GEL 50% · AGM 50%</div>
        <div class="bat-summary">
          <div class="bsrow"><span class="bsn">Batterie unitaire</span><span class="bsv">${S.bat.ah} Ah × ${S.bat.v} V = ${S.bat.ah * S.bat.v} Wh</span></div>
          <div class="bsrow"><span class="bsn">Nombre en parallèle</span><span class="bsv am">× ${S.batNb} → ${S.bat.ah * S.batNb} Ah total</span></div>
          <div class="bsrow"><span class="bsn">Énergie totale brute</span><span class="bsv">${batWhTotal.toLocaleString()} Wh</span></div>
          <div class="bsrow"><span class="bsn">Utilisable (${Math.round(S.dod * 100)}% DoD)</span><span class="bsv hi">${Math.round(usable).toLocaleString()} Wh</span></div>
        </div>
      </div>

      <div class="card">
        <div class="ct alt"><i class="ti ti-engine"></i>Recharge alternateur
          <button class="tog${S.altOn ? ' on' : ''}" id="alt-toggle" style="margin-left:auto"></button>
        </div>
        ${S.altOn ? `
        <div class="sol-config">
          <div class="scf">
            <label>Ampérage dédié batteries</label>
            <div style="display:flex;align-items:center;gap:5px">
              <input id="alt-amps" type="number" min="5" max="200" value="${S.altAmps}" style="width:70px">
              <span style="font-size:11px;color:var(--t3)">A</span>
            </div>
          </div>
          <div class="scf">
            <label>Heures de roulage / jour</label>
            <div style="display:flex;align-items:center;gap:5px">
              <input id="alt-hours" type="number" min="0.5" max="12" step="0.5" value="${S.altHours}" style="width:70px">
              <span style="font-size:11px;color:var(--t3)">h/j</span>
            </div>
          </div>
        </div>
        <div class="sol-summary" style="background:rgba(167,139,250,.06);border-color:#4c3680">
          <div class="ss-item"><div class="ssn" style="color:var(--pu)">${S.altAmps} A</div><div class="ssl">Ampérage</div></div>
          <div style="width:1px;background:var(--b1)"></div>
          <div class="ss-item"><div class="ssn" style="color:var(--pu)">${S.altHours} h</div><div class="ssl">Roulage / jour</div></div>
          <div style="width:1px;background:var(--b1)"></div>
          <div class="ss-item"><div class="ssn" style="color:var(--pu)">${Math.round(S.altAmps * S.bat.v * S.altHours * ALT_EFF)} Wh</div><div class="ssl">Recharge / jour</div></div>
        </div>
        <div style="font-size:10px;color:var(--t3);margin-top:4px">Rendement câbles + régulateur : 70%</div>` :
        `<div style="font-size:12px;color:var(--t3);padding:6px 0">Activez pour comptabiliser la recharge en roulant.</div>`}
      </div>

      <div class="card">
        <div class="ct sol"><i class="ti ti-sun"></i>Panneaux solaires</div>
        <div class="spgrid">
          ${PANELS.map(w => `<div class="spo${S.solW === w ? ' on' : ''}" data-panel="${w}"><div class="spw">${w}</div><div class="spl">Wc</div></div>`).join('')}
        </div>
        <div class="sol-config">
          <div class="scf">
            <label>Nombre de panneaux</label>
            <input id="sol-nb" type="number" min="1" max="12" value="${S.solNb}">
          </div>
          <div class="scf">
            <label>Rendement MPPT (%)</label>
            <input id="sol-eff" type="number" min="60" max="98" value="${Math.round(S.solEff * 100)}">
          </div>
        </div>
        <div class="scf">
          <label>Zone géographique</label>
          <select id="sun-zone">${sunOpts}</select>
        </div>
        ${S.sunIdx === SUN_ZONES.length - 1 ? `
          <div style="margin-top:5px;display:flex;align-items:center;gap:6px">
            <input id="custom-sun" type="number" min="1" max="12" step="0.5" placeholder="h/jour" value="${S.customSunH}"
              style="width:70px;background:var(--s2);border:1px solid var(--b1);border-radius:var(--r);color:var(--t1);font-family:var(--mono);font-size:11px;padding:4px 7px">
            <span style="font-size:11px;color:var(--t3)">heures de soleil / jour</span>
          </div>` : ''}
        <div class="sol-summary">
          <div class="ss-item"><div class="ssn">${S.solW * S.solNb} Wc</div><div class="ssl">Puissance installée</div></div>
          <div style="width:1px;background:var(--b1)"></div>
          <div class="ss-item"><div class="ssn">${sunH()} h</div><div class="ssl">Soleil / jour</div></div>
          <div style="width:1px;background:var(--b1)"></div>
          <div class="ss-item"><div class="ssn">${Math.round(solar)} Wh</div><div class="ssl">Production / jour</div></div>
        </div>
      </div>

    </div>

    <div style="display:flex;flex-direction:column;gap:10px">

      <div class="card">
        <div class="ct te"><i class="ti ti-activity"></i>Bilan énergétique journalier</div>
        <div class="ef-grid${S.altOn ? ' ef-grid-4' : ''}">
          <div class="ef sol"><div class="en">${Math.round(solar)}</div><div class="el">Wh solaire / jour</div></div>
          ${S.altOn ? `<div class="ef alt"><div class="en">${Math.round(alt)}</div><div class="el">Wh alternateur / jour</div></div>` : ''}
          <div class="ef bat"><div class="en">${Math.round(usable)}</div><div class="el">Wh utilisables</div></div>
          <div class="ef net ${isDanger ? 'bad' : 'ok'}"><div class="en">${Math.round(net)}</div><div class="el">Wh déficit / jour</div></div>
        </div>
        <div style="font-size:10px;color:var(--t3);display:flex;justify-content:space-between;margin-top:6px;margin-bottom:2px">
          <span>Couverture totale (solaire${S.altOn ? ' + alternateur' : ''})</span>
          <span style="font-family:var(--mono);color:var(--so)">${Math.round(solCovPct)}%</span>
        </div>
        <div style="height:6px;background:var(--s3);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${Math.round(Math.min(100, solCovPct))}%;background:var(--so2);border-radius:3px;transition:width .4s"></div>
        </div>
      </div>

      <div class="card">
        <div class="ct te"><i class="ti ti-clock"></i>Autonomie</div>
        <div class="ab-grid">
          <div class="ab-item">
            <div class="abn">${S.altOn ? 'Avec alternateur + batterie' : 'Sans soleil (batterie seule)'}</div>
            <div class="abv" style="color:${isDanger ? 'var(--rd)' : 'var(--te)'}">${autStr}</div>
            <div class="abu">${isFinite(autDays) && autDays >= 1 ? 'jours' : isFinite(autDays) ? 'heures' : 'illimité'}</div>
            <div class="tag ${isDanger ? 'twarn' : 'tok'}">
              <i class="ti ti-${isDanger ? 'alert-triangle' : 'check'}" style="font-size:10px"></i>
              ${isDanger ? 'Batterie insuffisante' : 'Autonomie correcte'}
            </div>
          </div>
          <div class="ab-item">
            <div class="abn">Consommation totale</div>
            <div class="abv">${Math.round(cons)}</div>
            <div class="abu">Wh / jour</div>
            ${solar >= cons
              ? `<div class="tag tinf"><i class="ti ti-solar-panel" style="font-size:10px"></i>Autosuffisant ☀️</div>`
              : solar > 0
                ? `<div class="tag tsol"><i class="ti ti-sun" style="font-size:10px"></i>Solaire couvre ${Math.round(solCovPct)}%</div>`
                : ''}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="ct"><i class="ti ti-list"></i>Détail consommation</div>
        <div class="bkdown">
          ${breakdown.slice(0, 6).map(a => `<div class="bkrow"><span class="bkn">${a.n}</span><span class="bkv">${a.wh} Wh/j</span></div>`).join('')}
          ${breakdown.length > 6 ? `<div class="bkrow"><span class="bkn">+${breakdown.length - 6} autres</span><span class="bkv">${breakdown.slice(6).reduce((s, a) => s + a.wh, 0)} Wh/j</span></div>` : ''}
          <div class="bkrow"><span>Total consommé</span><span class="bkv" style="color:var(--am)">${Math.round(cons)} Wh/j</span></div>
          <div class="bkrow"><span>Production solaire</span><span class="bkv" style="color:var(--so)">− ${Math.round(Math.min(solar, cons))} Wh/j</span></div>
          ${S.altOn ? `<div class="bkrow"><span>Recharge alternateur</span><span class="bkv" style="color:var(--pu)">− ${Math.round(Math.min(alt, Math.max(0, cons - solar)))} Wh/j</span></div>` : ''}
          <div class="bkrow" style="border-top:1px solid var(--b2);margin-top:2px">
            <span style="font-weight:500">Déficit batterie</span>
            <span class="bkv" style="color:${isDanger ? 'var(--rd)' : 'var(--te)'}">${Math.round(net)} Wh/j</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="ct te"><i class="ti ti-chart-bar"></i>Comparatif batteries du marché</div>
        <div class="rec-list">
          ${BATS.filter((b, i, arr) => arr.findIndex(x => x.ah === b.ah && x.v === b.v) === i).map(b => {
            const wu = b.ah * b.v * DOD[b.type]
            const d = net > 0 ? wu / net : Infinity
            const isCur = S.bat.ah === b.ah && S.bat.v === b.v
            return `
            <div class="ritem${d >= 1 ? ' best' : ''}">
              <div>
                <div class="ri-c">${b.ah}Ah ${b.v}V${isCur ? '<span class="btag">✓ sélectionnée</span>' : ''}</div>
                <div class="ri-s">${b.type} · ${b.ah * b.v} Wh brut · utilisable ${Math.round(b.ah * b.v * DOD[b.type])} Wh</div>
              </div>
              <div>
                <div class="ri-d">${isFinite(d) && d < 999 ? d.toFixed(1) + ' j' : '∞'}</div>
                <div class="ri-n">autonomie</div>
              </div>
            </div>`
          }).join('')}
        </div>
      </div>

      <button class="save-cfg-btn" id="save-config-btn">
        <i class="ti ti-device-floppy"></i>
        ${S.user ? `Sauvegarder ma config${S.userConfigs.length ? ` <span class="save-count">${S.userConfigs.length}</span>` : ''}` : 'Sauvegarder (compte requis)'}
      </button>

      <button class="pdf-btn" id="export-pdf" onclick="window.print()">
        <i class="ti ti-printer"></i> Exporter en PDF
      </button>

      <div class="capture-row">
        <span class="capture-lbl"><i class="ti ti-arrows-diff"></i> Comparer cette config :</span>
        <button class="capture-btn${S.scenarios.A ? ' filled' : ''}" id="capture-a">Capturer en A</button>
        <button class="capture-btn${S.scenarios.B ? ' filled' : ''}" id="capture-b">Capturer en B</button>
      </div>

    </div>
  </div>

  <div class="print-report" id="print-report">
    ${buildPrintReport({ cons, solar, alt, recharge, net, batWhUnit, batWhTotal, usable, autDays, solCovPct, breakdown, isDanger, autStr })}
  </div>`
}

function buildPrintReport({ cons, solar, alt, recharge, net, batWhUnit, batWhTotal, usable, autDays, solCovPct, breakdown, isDanger, autStr }) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  const vtypeLabel = { campervan: 'Camping-car', caravan: 'Caravane', van: 'Van' }[S.vtype] || 'Véhicule'
  const zone = SUN_ZONES[S.sunIdx]
  const sunHours = S.sunIdx === SUN_ZONES.length - 1 ? (parseFloat(S.customSunH) || 0) : zone.h

  return `
  <div class="pr-header">
    <div class="pr-logo">OffroadWatt</div>
    <div class="pr-meta">
      <div class="pr-title">Rapport d'autonomie électrique — ${vtypeLabel}</div>
      <div class="pr-date">Généré le ${dateStr}</div>
    </div>
  </div>

  <div class="pr-section">
    <div class="pr-sh">Appareils consommateurs</div>
    <table class="pr-table">
      <thead><tr><th>Appareil</th><th>Catégorie</th><th>Mode actif</th><th class="num">Watts</th><th class="num">Heures/j</th><th class="num">Wh/jour</th></tr></thead>
      <tbody>
        ${S.apps.map(a => {
          const modeLabel = (a.modes && a.modes.length > 1) ? a.modes[a.activeMode ?? 0]?.label ?? '' : '—'
          return `<tr class="${!a.on ? 'off' : ''}">
            <td>${a.n}${!a.on ? ' (désactivé)' : ''}</td>
            <td>${a.cat}</td>
            <td>${modeLabel}</td>
            <td class="num">${a.w} W</td>
            <td class="num">${a.h} h</td>
            <td class="num">${a.on ? Math.round(a.w * a.h) : 0} Wh</td>
          </tr>`
        }).join('')}
        <tr class="pr-total"><td colspan="5">Total consommation journalière</td><td class="num">${Math.round(cons)} Wh/j</td></tr>
      </tbody>
    </table>
  </div>

  <div class="pr-grid">
    <div class="pr-section">
      <div class="pr-sh">Banc de batteries</div>
      <table class="pr-kv">
        <tr><td>Modèle</td><td>${S.bat.ah} Ah ${S.bat.v}V ${S.bat.type}</td></tr>
        <tr><td>Batteries en parallèle</td><td>${S.batNb}</td></tr>
        <tr><td>Capacité totale brute</td><td>${batWhTotal.toLocaleString()} Wh</td></tr>
        <tr><td>Profondeur de décharge</td><td>${Math.round(S.dod * 100)} %</td></tr>
        <tr class="pr-hi"><td>Énergie utilisable</td><td>${Math.round(usable).toLocaleString()} Wh</td></tr>
      </table>
    </div>

    <div class="pr-section">
      <div class="pr-sh">Panneaux solaires</div>
      <table class="pr-kv">
        <tr><td>Puissance unitaire</td><td>${S.solW} Wc</td></tr>
        <tr><td>Nombre de panneaux</td><td>${S.solNb}</td></tr>
        <tr><td>Puissance totale</td><td>${S.solW * S.solNb} Wc</td></tr>
        <tr><td>Rendement MPPT</td><td>${Math.round(S.solEff * 100)} %</td></tr>
        <tr><td>Zone / Ensoleillement</td><td>${zone.n} — ${sunHours} h/j</td></tr>
        <tr class="pr-hi"><td>Production journalière</td><td>${Math.round(solar)} Wh/j</td></tr>
      </table>
    </div>

    ${S.altOn ? `
    <div class="pr-section">
      <div class="pr-sh">Recharge alternateur</div>
      <table class="pr-kv">
        <tr><td>Ampérage dédié batteries</td><td>${S.altAmps} A</td></tr>
        <tr><td>Heures de roulage / jour</td><td>${S.altHours} h</td></tr>
        <tr><td>Rendement (câbles + régulateur)</td><td>70 %</td></tr>
        <tr class="pr-hi"><td>Recharge journalière</td><td>${Math.round(alt)} Wh/j</td></tr>
      </table>
    </div>` : ''}
  </div>

  <div class="pr-section">
    <div class="pr-sh">Bilan énergétique</div>
    <table class="pr-kv">
      <tr><td>Consommation totale</td><td>${Math.round(cons)} Wh/j</td></tr>
      <tr><td>Production solaire</td><td>− ${Math.round(Math.min(solar, cons))} Wh/j</td></tr>
      ${S.altOn ? `<tr><td>Recharge alternateur</td><td>− ${Math.round(Math.min(alt, Math.max(0, cons - solar)))} Wh/j</td></tr>` : ''}
      <tr class="${isDanger ? 'pr-danger' : 'pr-hi'}"><td>Déficit batterie résiduel</td><td>${Math.round(net)} Wh/j</td></tr>
      <tr><td>Couverture solaire${S.altOn ? ' + alternateur' : ''}</td><td>${Math.round(solCovPct)} %</td></tr>
      <tr class="${isDanger ? 'pr-danger' : 'pr-ok'}"><td>Autonomie estimée (batterie)</td><td>${autStr} ${isFinite(autDays) && autDays >= 1 ? 'jours' : isFinite(autDays) ? 'heures' : ''}</td></tr>
    </table>
  </div>

  <div class="pr-footer">Rapport généré par OffroadWatt — Calculateur d'autonomie électrique pour camping-car, van et caravane</div>`
}

// ── COMPARE TAB ──────────────────────────────────────────────────────────────

// Résumé court d'un scénario (batterie + solaire + alternateur)
function scenarioSummary(st) {
  const parts = [
    `${st.bat.ah}Ah ${st.bat.v}V ${st.bat.type}${st.batNb > 1 ? ` ×${st.batNb}` : ''}`,
    `${st.solW * st.solNb} Wc solaire`,
  ]
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
           <button class="cmp-clear" data-clear-scenario="${key}" title="Vider"><i class="ti ti-x"></i></button>
         </div>
         <div class="cmp-slot-sum">${scenarioSummary(snap)}</div>
       </div>`
    : `<div class="cmp-slot empty">
         <div class="cmp-slot-hd"><span class="cmp-tag empty">${key}</span> Aucun scénario</div>
         <div class="cmp-slot-sum">Configurez le Dashboard puis cliquez « Capturer en ${key} ».</div>
       </div>`

  let body
  if (!A || !B) {
    body = `
    <div class="cmp-empty">
      <i class="ti ti-arrows-diff" style="font-size:30px;opacity:.25;display:block;margin-bottom:8px"></i>
      <div style="font-size:13px;color:var(--t2);margin-bottom:4px">Capturez deux configurations pour les comparer</div>
      <div style="font-size:11px;color:var(--t3)">Construisez un setup dans le Dashboard, capturez-le en A,<br>modifiez-le (batterie, solaire…), puis capturez-le en B.</div>
      <button class="capture-btn" id="goto-dashboard" style="margin-top:12px">→ Aller au Dashboard</button>
    </div>`
  } else {
    const cA = calc(A), cB = calc(B)
    const kA = systemCost(A), kB = systemCost(B)
    const r0 = (n) => Math.round(n)
    const surcout = kB.total - kA.total
    const gainAut = (isFinite(cB.autDays) && isFinite(cA.autDays)) ? cB.autDays - cA.autDays : null
    const coutParJour = (gainAut && gainAut > 0 && surcout > 0) ? surcout / gainAut : null
    const nuitsCamping = (surcout > 0 && S.hookupCost > 0) ? surcout / S.hookupCost : null
    const winner = isFinite(cB.autDays) && isFinite(cA.autDays) ? (cB.autDays > cA.autDays ? 'B' : cA.autDays > cB.autDays ? 'A' : null) : null

    body = `
    <table class="cmp-table">
      <thead><tr><th></th><th><span class="cmp-tag">A</span> ${A.label}</th><th><span class="cmp-tag">B</span> ${B.label}</th><th>Δ</th></tr></thead>
      <tbody>
        ${cmpRow('Consommation', cA.cons, cB.cons, r0, { higherBetter: false, unit: ' Wh' })}
        ${cmpRow('Production solaire', cA.solar, cB.solar, r0, { unit: ' Wh' })}
        ${(A.altOn || B.altOn) ? cmpRow('Recharge alternateur', cA.alt, cB.alt, r0, { unit: ' Wh' }) : ''}
        ${cmpRow('Énergie utilisable', cA.usable, cB.usable, r0, { unit: ' Wh' })}
        ${cmpRow('Déficit / jour', cA.net, cB.net, r0, { higherBetter: false, unit: ' Wh' })}
        ${cmpRow('Couverture', cA.solCovPct, cB.solCovPct, r0, { unit: ' %' })}
        ${cmpRow('Autonomie', cA.autDays, cB.autDays, fmtDays, { delta: false })}
      </tbody>
      <tbody class="cmp-cost">
        ${cmpRow('Coût batteries', kA.batCost, kB.batCost, r0, { higherBetter: false, unit: ' €' })}
        ${cmpRow('Coût solaire', kA.solCost, kB.solCost, r0, { higherBetter: false, unit: ' €' })}
        ${(A.altOn || B.altOn) ? cmpRow('Coût alternateur', kA.altCost, kB.altCost, r0, { higherBetter: false, unit: ' €' }) : ''}
        ${cmpRow('Coût système total', kA.total, kB.total, r0, { higherBetter: false, unit: ' €' })}
      </tbody>
    </table>

    ${winner ? `<div class="cmp-winner"><i class="ti ti-trophy"></i> Setup <strong>${winner}</strong> offre la meilleure autonomie</div>` : ''}

    <div class="card" style="margin-top:12px">
      <div class="ct te"><i class="ti ti-calculator"></i>Rentabilité (B vs A)</div>
      ${surcout === 0 ? `<div style="font-size:12px;color:var(--t3)">Les deux setups ont le même coût système.</div>` : `
      <div class="roi-grid">
        <div class="roi-item">
          <div class="roi-v" style="color:${surcout > 0 ? 'var(--am)' : 'var(--gr)'}">${surcout > 0 ? '+' : ''}${r0(surcout)} €</div>
          <div class="roi-l">Surcoût de B</div>
        </div>
        <div class="roi-item">
          <div class="roi-v" style="color:var(--te)">${gainAut != null ? (gainAut > 0 ? '+' : '') + gainAut.toFixed(1) + ' j' : '∞'}</div>
          <div class="roi-l">Gain d'autonomie</div>
        </div>
        <div class="roi-item">
          <div class="roi-v">${coutParJour != null ? '~' + r0(coutParJour) + ' €' : '—'}</div>
          <div class="roi-l">Coût / jour gagné</div>
        </div>
        <div class="roi-item">
          <div class="roi-v">${nuitsCamping != null ? '~' + r0(nuitsCamping) : '—'}</div>
          <div class="roi-l">Nuits camping équiv.</div>
        </div>
      </div>
      <div class="roi-param">
        <label>Prix électricité camping / nuit</label>
        <input id="hookup-cost" type="number" min="0" max="30" step="0.5" value="${S.hookupCost}"> €
        <span style="color:var(--t3);font-size:10px;margin-left:auto">Le surcoût équivaut à ${nuitsCamping != null ? r0(nuitsCamping) + ' nuits' : '—'} de borne électrique</span>
      </div>`}
    </div>

    <button class="pdf-btn" id="export-compare-pdf" onclick="window.print()" style="margin-top:12px">
      <i class="ti ti-printer"></i> Exporter le comparatif en PDF
    </button>`

    printReport = `
    <div class="print-report" id="print-report-compare">
      ${buildCompareReport(A, B, cA, cB, kA, kB, { surcout, gainAut, coutParJour, nuitsCamping })}
    </div>`
  }

  return `
  <div class="card">
    <div class="ct"><i class="ti ti-arrows-diff"></i>Comparateur de setups</div>
    <p style="font-size:12px;color:var(--t2);margin-bottom:10px">Comparez deux configurations énergétiques côte à côte — autonomie, coût système et rentabilité.</p>
    <div class="cmp-slots">
      ${slot('A', A)}
      ${slot('B', B)}
    </div>
    ${body}
  </div>
  ${printReport}`
}

function buildCompareReport(A, B, cA, cB, kA, kB, roi) {
  const now = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  const r0 = (n) => Math.round(n)
  const row = (label, vA, vB, unit = '') => `<tr><td>${label}</td><td class="num">${typeof vA === 'number' ? r0(vA) : vA}${unit}</td><td class="num">${typeof vB === 'number' ? r0(vB) : vB}${unit}</td></tr>`
  return `
  <div class="pr-header">
    <div class="pr-logo">OffroadWatt</div>
    <div class="pr-meta">
      <div class="pr-title">Comparatif de configurations énergétiques</div>
      <div class="pr-date">Généré le ${now}</div>
    </div>
  </div>
  <div class="pr-section">
    <div class="pr-sh">Setups comparés</div>
    <table class="pr-kv">
      <tr><td>Setup A — ${A.label}</td><td>${scenarioSummary(A)}</td></tr>
      <tr><td>Setup B — ${B.label}</td><td>${scenarioSummary(B)}</td></tr>
    </table>
  </div>
  <div class="pr-section">
    <div class="pr-sh">Bilan énergétique</div>
    <table class="pr-table">
      <thead><tr><th>Critère</th><th class="num">Setup A</th><th class="num">Setup B</th></tr></thead>
      <tbody>
        ${row('Consommation', cA.cons, cB.cons, ' Wh/j')}
        ${row('Production solaire', cA.solar, cB.solar, ' Wh/j')}
        ${(A.altOn || B.altOn) ? row('Recharge alternateur', cA.alt, cB.alt, ' Wh/j') : ''}
        ${row('Énergie utilisable', cA.usable, cB.usable, ' Wh')}
        ${row('Déficit / jour', cA.net, cB.net, ' Wh/j')}
        ${row('Couverture', cA.solCovPct, cB.solCovPct, ' %')}
        ${row('Autonomie', fmtDays(cA.autDays), fmtDays(cB.autDays))}
      </tbody>
    </table>
  </div>
  <div class="pr-section">
    <div class="pr-sh">Coût du système</div>
    <table class="pr-table">
      <thead><tr><th>Poste</th><th class="num">Setup A</th><th class="num">Setup B</th></tr></thead>
      <tbody>
        ${row('Batteries', kA.batCost, kB.batCost, ' €')}
        ${row('Solaire', kA.solCost, kB.solCost, ' €')}
        ${(A.altOn || B.altOn) ? row('Alternateur', kA.altCost, kB.altCost, ' €') : ''}
        <tr class="pr-total"><td>Total système</td><td class="num">${kA.total} €</td><td class="num">${kB.total} €</td></tr>
      </tbody>
    </table>
  </div>
  <div class="pr-section">
    <div class="pr-sh">Rentabilité (B vs A)</div>
    <table class="pr-kv">
      <tr class="pr-hi"><td>Surcoût de B</td><td>${roi.surcout > 0 ? '+' : ''}${r0(roi.surcout)} €</td></tr>
      <tr><td>Gain d'autonomie</td><td>${roi.gainAut != null ? (roi.gainAut > 0 ? '+' : '') + roi.gainAut.toFixed(1) + ' jours' : 'illimité'}</td></tr>
      <tr><td>Coût par jour d'autonomie gagné</td><td>${roi.coutParJour != null ? '~' + r0(roi.coutParJour) + ' €/jour' : '—'}</td></tr>
      <tr><td>Équivalent nuits de borne électrique</td><td>${roi.nuitsCamping != null ? '~' + r0(roi.nuitsCamping) + ' nuits (à ' + S.hookupCost + ' €/nuit)' : '—'}</td></tr>
    </table>
  </div>
  <div class="pr-footer">Rapport généré par OffroadWatt — Prix système indicatifs marché européen, hors pose</div>`
}

// ── AI TAB ───────────────────────────────────────────────────────────────────

function buildAIResultCard(r, i, source) {
  const modes = r.modes && r.modes.length > 1 ? r.modes : null
  const mainWatts = modes ? modes[0]?.watts : (r.watts ?? null)
  const canAdd = mainWatts != null || modes

  return `
  <div class="ai-item">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
      <div class="ain">${r.name}${r.brand ? ` <span style="font-size:10px;color:var(--t3)">— ${r.brand}</span>` : ''}
        ${source === 'catalog' ? `<span class="src-badge catalog"><i class="ti ti-database"></i></span>` : source === 'online' ? `<span class="src-badge online"><i class="ti ti-world"></i> Nouveau</span>` : ''}
      </div>
      ${r.efficiency ? `<span style="font-size:10px;color:var(--te);font-family:var(--mono);white-space:nowrap">${r.efficiency}</span>` : ''}
    </div>
    <div class="aimeta">
      ${r.voltage ? `<span>${r.voltage}V</span>` : ''}
      ${r.price_eur ? `<span class="aip">~${r.price_eur} €</span>` : ''}
      ${r.type ? `<span style="color:var(--t3)">${r.type}</span>` : ''}
    </div>
    <div class="aid">${r.description}</div>
    ${modes ? `
      <div style="margin-top:5px;display:flex;flex-wrap:wrap;gap:4px">
        ${modes.map(m => `<span style="background:var(--s3);border:1px solid var(--b1);border-radius:3px;padding:2px 7px;font-size:10px;font-family:var(--mono)"><span style="color:var(--am)">${m.watts} W</span> <span style="color:var(--t3)">${m.label}</span></span>`).join('')}
      </div>
      <div style="font-size:10px;color:var(--t3);margin-top:3px">← Switchable depuis le dashboard</div>` :
      mainWatts != null ? `<div class="aimeta" style="margin-top:4px"><span class="aiw">${mainWatts} W</span><span style="font-size:10px;color:var(--t3)">12V</span></div>` : ''}
    ${canAdd ? `<button class="aiadd" data-ai="${i}"><i class="ti ti-plus" style="font-size:10px"></i> Ajouter au dashboard</button>` : ''}
  </div>`
}

function buildAITab() {
  const catalogSize = _catalogCache ? _catalogCache.length : '…'
  const catResults = S.aiCatalogResults
  const onlResults = S.aiOnlineResults
  const searchesLeft = getAiSearchesLeft()
  const isPro = S.user?.plan === 'pro'

  return `
  <div class="card">
    <div class="ct">
      <i class="ti ti-sparkles"></i>Recherche d'équipements par IA
      ${catalogSize > 0 ? `<span class="cat-badge"><i class="ti ti-database" style="font-size:10px"></i> ${catalogSize} en catalogue</span>` : ''}
    </div>
    <p style="font-size:12px;color:var(--t2);margin-bottom:8px">Catalogue partagé Supabase — recherche instantanée, puis en ligne pour les nouveaux modèles. Chaque résultat enrichit la base commune.</p>
    ${!isPro ? `
    <div class="ai-quota${searchesLeft === 0 ? ' depleted' : ''}">
      <i class="ti ti-${searchesLeft > 0 ? 'bolt' : 'lock'}" style="font-size:11px"></i>
      ${searchesLeft > 0
        ? `<span>${searchesLeft}/${AI_LIMIT_FREE} recherche${searchesLeft > 1 ? 's' : ''} restante${searchesLeft > 1 ? 's' : ''} aujourd'hui</span>`
        : `<span>Quota journalier atteint — <button class="quota-cta" id="open-auth-quota">Passer en Pro</button> pour des recherches illimitées</span>`}
    </div>` : ''}
    <div class="ai-row">
      <input class="ai-in" id="aiq" type="text" placeholder="Ex: chauffage diesel Webasto, réfrigérateur 12V Dometic, pompe eau Shurflo…" value="${S.aiQuery}">
      <button class="aibtn" id="ai-search" ${S.aiLoading || searchesLeft === 0 ? 'disabled' : ''}>
        ${S.aiLoading ? '<div class="loading"><span></span><span></span><span></span></div>' : '<i class="ti ti-search"></i> Chercher'}
      </button>
    </div>
    ${S.aiError ? `<div class="api-warn" style="margin-top:8px"><strong>⚠️ Erreur</strong> — ${S.aiError}</div>` : ''}

    ${catResults.length ? `
      <div class="ai-section-hd"><i class="ti ti-database"></i> Catalogue hors ligne — ${catResults.length} résultat(s)</div>
      ${catResults.map((r, i) => buildAIResultCard(r, i, 'catalog')).join('')}` : ''}

    ${S.aiLoading ? `
      <div class="ai-section-hd" style="color:var(--so)"><i class="ti ti-world"></i> Recherche en ligne…
        <div class="loading" style="display:inline-flex;margin-left:6px"><span></span><span></span><span></span></div>
      </div>` : onlResults.length ? `
      <div class="ai-section-hd" style="color:var(--te)"><i class="ti ti-world"></i> Résultats en ligne — ${onlResults.length} nouveau(x)</div>
      ${onlResults.map((r, i) => buildAIResultCard(r, catResults.length + i, 'online')).join('')}` : ''}

    ${!catResults.length && !onlResults.length && !S.aiLoading && !S.aiError ? `
      <div style="text-align:center;padding:28px;color:var(--t3)">
        <i class="ti ti-search" style="font-size:26px;opacity:.3;display:block;margin-bottom:5px"></i>
        <div style="font-size:11px">Tapez un équipement — catalogue local d'abord, puis recherche IA en ligne</div>
      </div>` : ''}
  </div>`
}

// ── DEPLOY TAB ───────────────────────────────────────────────────────────────

function buildDeployTab() {
  const phases = [
    ['01','Setup local',['bfree'],`
      <li>Installer <strong>Node.js 20+</strong> et <strong>Git</strong></li>
      <li>Cloner : <code>git clone https://github.com/Chrisdesmurger/OffroadWatt.git</code></li>
      <li>Installer : <code>cd OffroadWatt && npm install</code></li>
      <li>Lancer : <code>npm run dev</code> → <strong>http://localhost:5173</strong></li>`],
    ['02','Clé API Anthropic',['bpaid'],`
      <li>Créer un compte → <strong>console.anthropic.com</strong> → API Keys</li>
      <li>Créer <code>.env.local</code> : <code>VITE_ANTHROPIC_KEY=sk-ant-…</code></li>
      <li><code>.env.local</code> est dans <code>.gitignore</code> — jamais committé</li>
      <li>En prod : variable d'environnement dans Vercel Settings</li>`],
    ['03','Déploiement Vercel',['bfree'],`
      <li>S'inscrire sur <strong>vercel.com</strong> → "Continue with GitHub"</li>
      <li>"Add New Project" → importer <strong>OffroadWatt</strong></li>
      <li>Settings → <strong>Environment Variables</strong> → ajouter <code>VITE_ANTHROPIC_KEY</code></li>
      <li>Cliquer <strong>Deploy</strong> → URL live en ~2 minutes</li>
      <li>Chaque <code>git push main</code> redéploie automatiquement</li>`],
    ['04','Sécuriser l\'API',['bfree'],`
      <li>Créer <code>api/search.js</code> — API Route Vercel (côté serveur)</li>
      <li>La clé ne sera jamais exposée dans le navigateur</li>
      <li>Rate limiting : <strong>Upstash Redis</strong> gratuit (100k req/jour)</li>`],
    ['05','Fonctionnalités avancées',['bfree','bpaid'],`
      <li>Sauvegarde configs utilisateur : <strong>Supabase</strong> (gratuit)</li>
      <li>Export PDF du bilan : <code>npm install jspdf</code></li>
      <li>PWA installable mobile : <code>npm install vite-plugin-pwa</code></li>
      <li>Monitoring batterie BLE : <strong>Victron Connect API</strong></li>`],
  ]
  return `
  <div class="card">
    <div class="ct"><i class="ti ti-rocket"></i>Feuille de route — Déploiement sur Vercel</div>
    <p style="font-size:12px;color:var(--t2);margin-bottom:14px">Ce projet est un vrai projet Vite. Voici les étapes pour le faire tourner en local et en production.</p>
    ${phases.map(([n, t, b, tasks]) => `
      <div class="rm-phase">
        <div class="rm-num"><strong>${n}</strong><small>Phase</small></div>
        <div class="rm-body">
          <div class="rm-title">${t}${b.map(x => `<span class="rtbadge ${x}">${x === 'bfree' ? 'Gratuit' : 'Payant'}</span>`).join('')}</div>
          <ul class="rm-tasks">${tasks}</ul>
        </div>
      </div>`).join('')}
    <div style="background:var(--s2);border:1px solid var(--b1);border-radius:var(--r);padding:10px;margin-top:4px">
      <div style="font-family:var(--mono);font-size:9px;color:var(--am);margin-bottom:5px;letter-spacing:1px">STACK</div>
      <div class="stacks">
        ${[['Vite','hot'],['Vanilla JS','hot'],['Vercel','free'],['Supabase','free'],['Anthropic API','hot'],['jsPDF','free'],['Upstash Redis','free'],['vite-plugin-pwa','free']].map(([s,t]) => `<span class="stk ${t}">${s}</span>`).join('')}
      </div>
    </div>
  </div>`
}

// ── MODAL ────────────────────────────────────────────────────────────────────

function buildModal() {
  const m = S.modal

  if (m.type === 'auth' || m.type === 'auth-save') {
    return `
    <div class="ov" id="modal-overlay">
      <div class="mo" style="max-width:400px">
        <h3><i class="ti ti-user-circle"></i> Créer un compte / Se connecter</h3>
        <p style="font-size:11px;color:var(--t2);margin-bottom:14px">
          Sauvegardez votre configuration et accédez-y depuis n'importe quel appareil.
          Plan gratuit inclus — 1 config sauvegardée.
        </p>
        <button class="google-btn" id="auth-google">
          <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continuer avec Google
        </button>
        <div class="auth-divider"><span>ou par email (lien magique)</span></div>
        <input id="auth-email" type="email" placeholder="votre@email.com"
          style="width:100%;margin-bottom:8px;background:var(--s2);border:1px solid var(--b1);border-radius:var(--r);color:var(--t1);font-size:12px;padding:8px 10px">
        <button id="auth-email-send" class="mo-ok" style="width:100%" ${S.authLoading ? 'disabled' : ''}>
          ${S.authLoading ? 'Envoi en cours…' : '<i class="ti ti-send" style="font-size:11px"></i> Recevoir le lien de connexion'}
        </button>
        <div class="mo-btns" style="margin-top:10px"><button id="close-modal" class="mo-cancel">Annuler</button></div>
      </div>
    </div>`
  }

  if (m.type === 'auth-sent') {
    return `
    <div class="ov" id="modal-overlay">
      <div class="mo" style="max-width:380px;text-align:center">
        <div style="font-size:32px;margin-bottom:8px">📬</div>
        <h3>Lien envoyé !</h3>
        <p style="font-size:12px;color:var(--t2);margin-top:8px">
          Vérifiez votre boîte mail <strong style="color:var(--t1)">${m.email}</strong><br>
          et cliquez sur le lien pour vous connecter.<br>
          <span style="color:var(--t3);font-size:11px">Le lien est valable 1 heure.</span>
        </p>
        <div class="mo-btns" style="margin-top:14px"><button id="close-modal" class="mo-cancel" style="flex:1">Fermer</button></div>
      </div>
    </div>`
  }

  if (m.type === 'save') {
    const isFree = S.user?.plan === 'free'
    const defaultName = S.userConfigs.length > 0 ? S.userConfigs[0].name : 'Ma configuration'
    return `
    <div class="ov" id="modal-overlay">
      <div class="mo" style="max-width:380px">
        <h3><i class="ti ti-device-floppy"></i> Sauvegarder la configuration</h3>
        ${isFree && S.userConfigs.length >= 1
          ? `<div style="font-size:11px;color:var(--am);background:rgba(240,160,48,.07);border:1px solid var(--am3);border-radius:var(--r);padding:7px 10px;margin-bottom:10px">
              <i class="ti ti-info-circle"></i> Plan gratuit : la configuration existante sera remplacée.
             </div>`
          : ''}
        <input id="save-name" type="text" placeholder="Nom de la configuration" value="${defaultName}"
          style="width:100%;margin-bottom:8px;background:var(--s2);border:1px solid var(--b1);border-radius:var(--r);color:var(--t1);font-size:12px;padding:8px 10px">
        <div class="mo-btns">
          <button id="close-modal" class="mo-cancel">Annuler</button>
          <button id="confirm-save" class="mo-ok" ${S.saveLoading ? 'disabled' : ''}>
            ${S.saveLoading ? 'Sauvegarde…' : '<i class="ti ti-check" style="font-size:11px"></i> Sauvegarder'}
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
        <h3><i class="ti ti-bookmark"></i> Mes configurations</h3>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <span style="font-size:11px;color:var(--t3)">${S.user?.email}</span>
          <span class="plan-pill ${isFree ? 'free' : 'pro'}">${isFree ? 'Plan Gratuit' : 'Pro'}</span>
          <button id="auth-signout" style="margin-left:auto;font-size:10px;background:none;border:1px solid var(--b1);color:var(--t3);border-radius:var(--r);padding:3px 8px;cursor:pointer">
            <i class="ti ti-logout"></i> Déconnexion
          </button>
        </div>
        ${isFree ? `<div style="font-size:11px;color:var(--t2);background:var(--s2);border:1px solid var(--b1);border-radius:var(--r);padding:8px 10px;margin-bottom:10px">
          Plan gratuit — 1 config sauvegardée · Recherches IA : ${AI_LIMIT_FREE}/jour
        </div>` : ''}
        ${S.userConfigs.length === 0
          ? `<div style="text-align:center;padding:20px;color:var(--t3);font-size:12px">
              Aucune configuration sauvegardée.<br>Retournez au Dashboard et cliquez "Sauvegarder ma config".
             </div>`
          : S.userConfigs.map(c => `
            <div class="config-item">
              <div>
                <div class="ci-name">${c.name}</div>
                <div class="ci-date">Modifié le ${new Date(c.updated_at).toLocaleDateString('fr-FR')}</div>
              </div>
              <div style="display:flex;gap:5px;align-items:center">
                <button class="mo-ok" style="padding:4px 10px;font-size:10px" data-load-config="${c.id}">
                  <i class="ti ti-upload" style="font-size:10px"></i> Charger
                </button>
                <button class="mo-cancel" style="padding:4px 8px;font-size:10px" data-del-config="${c.id}">
                  <i class="ti ti-trash" style="font-size:10px"></i>
                </button>
              </div>
            </div>`).join('')}
        <div class="mo-btns" style="margin-top:12px">
          <button id="close-modal" class="mo-cancel">Fermer</button>
          <button class="mo-ok" id="open-save-from-configs"><i class="ti ti-plus" style="font-size:10px"></i> Nouvelle sauvegarde</button>
        </div>
      </div>
    </div>`
  }

  if (m.type === 'catalog') {
    const cf = m.catFilter || 'Cuisine'
    const localItems = CATALOG.filter(c => c.cat === cf)

    // Mapper le champ `type` Supabase vers une catégorie locale
    const sbItems = (_catalogCache || []).filter(item => sbTypeToCat(item.type) === cf)

    const totalCount = localItems.length + sbItems.length

    return `
    <div class="ov" id="modal-overlay">
      <div class="mo">
        <h3><i class="ti ti-book"></i> Catalogue d'appareils <span style="font-size:10px;color:var(--t3);font-family:var(--mono);font-weight:400;margin-left:4px">${totalCount} appareils</span></h3>
        <div class="catcatalog">
          ${['Cuisine','Confort','Tech','Eau','Éclairage','Système'].map(c => `
            <div class="cf${cf === c ? ' on' : ''}" data-modal-cat="${c}">${c}</div>`).join('')}
        </div>
        <div class="catgrid">
          ${localItems.map(item => `
            <div class="catitem" data-catalog="${CATALOG.indexOf(item)}">
              <div>
                <div class="cin">${item.n}</div>
                <div class="cim"><span class="ciw">${item.w}W</span><span>${item.h}h/j</span></div>
              </div>
              <i class="ti ti-plus" style="font-size:14px;color:var(--t3)"></i>
            </div>`).join('')}
          ${sbItems.length ? `
            ${localItems.length ? `<div class="catgrid-sep" style="grid-column:1/-1"><span><i class="ti ti-database" style="font-size:10px"></i> Catalogue IA (${sbItems.length})</span></div>` : ''}
            ${sbItems.map((item, i) => {
              const watts = item.modes?.[0]?.watts ?? 0
              const hasModes = item.modes && item.modes.length > 1
              return `
              <div class="catitem catitem-ai" data-sb-catalog="${_catalogCache.indexOf(item)}">
                <div>
                  <div class="cin">${item.name}${item.brand ? ` <span style="font-size:10px;color:var(--t3)">${item.brand}</span>` : ''}</div>
                  <div class="cim">
                    <span class="ciw">${hasModes ? item.modes.map(m => m.watts + 'W').join(' / ') : watts + 'W'}</span>
                    ${item.price_eur ? `<span style="color:var(--te)">~${item.price_eur}€</span>` : ''}
                  </div>
                </div>
                <i class="ti ti-plus" style="font-size:14px;color:var(--t3)"></i>
              </div>`
            }).join('')}` : ''}
          ${totalCount === 0 ? `<div style="grid-column:1/-1;padding:20px;text-align:center;color:var(--t3);font-size:11px">Aucun appareil dans cette catégorie</div>` : ''}
        </div>
        <div class="mo-btns"><button id="close-modal" class="mo-cancel">Fermer</button></div>
      </div>
    </div>`
  }
  return `
  <div class="ov" id="modal-overlay">
    <div class="mo">
      <h3><i class="ti ti-plus"></i> Appareil personnalisé</h3>
      <input id="mn" type="text" placeholder="Nom de l'appareil" style="width:100%;margin-bottom:7px">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-bottom:7px">
        <div><label style="font-size:11px;color:var(--t2);display:block;margin-bottom:3px">Watts</label><input id="mw" type="number" placeholder="W" min="0" max="5000" style="width:100%"></div>
        <div><label style="font-size:11px;color:var(--t2);display:block;margin-bottom:3px">Heures/jour</label><input id="mh" type="number" placeholder="h" min="0" max="24" step="0.5" value="4" style="width:100%"></div>
        <div><label style="font-size:11px;color:var(--t2);display:block;margin-bottom:3px">Catégorie</label>
          <select id="mc" style="width:100%">${['Cuisine','Confort','Tech','Eau','Éclairage','Système'].map(c => `<option>${c}</option>`).join('')}</select>
        </div>
      </div>
      <div class="mo-btns">
        <button id="close-modal" class="mo-cancel">Annuler</button>
        <button id="confirm-custom" class="mo-ok">Ajouter</button>
      </div>
    </div>
  </div>`
}

// ─── EVENTS ──────────────────────────────────────────────────────────────────

function bindEvents() {
  // Vtypes
  document.querySelectorAll('[data-vtype]').forEach(el => el.addEventListener('click', () => set({ vtype: el.dataset.vtype })))
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
  // Battery options
  document.querySelectorAll('[data-bat]').forEach(el => el.addEventListener('click', () => {
    const b = BATS[parseInt(el.dataset.bat)]
    set({ bat: b, dod: DOD[b.type] })
  }))
  // Parallel count
  document.querySelectorAll('[data-nb]').forEach(el => el.addEventListener('click', () => set({ batNb: parseInt(el.dataset.nb) })))
  // DoD slider
  document.getElementById('dod-range')?.addEventListener('input', e => set({ dod: parseFloat(e.target.value) }))
  // Solar panels
  document.querySelectorAll('[data-panel]').forEach(el => el.addEventListener('click', () => set({ solW: parseInt(el.dataset.panel) })))
  document.getElementById('sol-nb')?.addEventListener('change', e => set({ solNb: Math.max(1, parseInt(e.target.value) || 1) }))
  document.getElementById('sol-eff')?.addEventListener('change', e => set({ solEff: Math.min(0.98, Math.max(0.6, (parseInt(e.target.value) || 85) / 100)) }))
  document.getElementById('sun-zone')?.addEventListener('change', e => set({ sunIdx: parseInt(e.target.value) }))
  document.getElementById('custom-sun')?.addEventListener('input', e => { S.customSunH = e.target.value; render() })
  // AI search
  document.getElementById('aiq')?.addEventListener('input', e => { S.aiQuery = e.target.value })
  document.getElementById('ai-search')?.addEventListener('click', () => {
    const q = document.getElementById('aiq')?.value?.trim()
    if (q) { S.aiQuery = q; searchAI(q) }
  })
  // Mode switch on appliance card
  document.querySelectorAll('[data-mode-id]').forEach(el => el.addEventListener('click', () => {
    const id = parseInt(el.dataset.modeId), mi = parseInt(el.dataset.modeIdx)
    set({ apps: S.apps.map(a => {
      if (a.id !== id) return a
      const newW = a.modes[mi]?.watts ?? a.w
      return { ...a, activeMode: mi, w: newW }
    })})
  }))
  // Add from AI results
  document.querySelectorAll('[data-ai]').forEach(el => el.addEventListener('click', () => addFromAI(parseInt(el.dataset.ai))))
  // Open modals
  document.getElementById('open-custom')?.addEventListener('click', () => set({ modal: { type: 'custom' } }))
  // Modal overlay close
  document.getElementById('modal-overlay')?.addEventListener('click', e => { if (e.target.id === 'modal-overlay') set({ modal: null }) })
  document.getElementById('close-modal')?.addEventListener('click', () => set({ modal: null }))
  document.getElementById('confirm-custom')?.addEventListener('click', confirmCustom)
  // Catalog category filter inside modal
  document.querySelectorAll('[data-modal-cat]').forEach(el => el.addEventListener('click', () => set({ modal: { ...S.modal, catFilter: el.dataset.modalCat } })))
  // Add from local catalog presets
  document.querySelectorAll('[data-catalog]').forEach(el => el.addEventListener('click', () => {
    const item = CATALOG[parseInt(el.dataset.catalog)]
    set({ apps: [...S.apps, { id: Date.now(), n: item.n, icon: item.icon, w: item.w, h: item.h, on: true, cat: item.cat }], modal: null, tab: 'energy' })
  }))
  // Add from Supabase AI catalog
  document.querySelectorAll('[data-sb-catalog]').forEach(el => el.addEventListener('click', () => {
    const item = _catalogCache?.[parseInt(el.dataset.sbCatalog)]
    if (!item) return
    const modes = item.modes && item.modes.length > 1 ? item.modes : null
    const watts = modes ? (modes[0]?.watts ?? 0) : (item.modes?.[0]?.watts ?? 0)
    const cat = sbTypeToCat(item.type) || 'Tech'
    const iconMap = { Cuisine: 'ti-bowl-spoon', Confort: 'ti-temperature', Éclairage: 'ti-bulb', Eau: 'ti-droplet', Tech: 'ti-cpu', Système: 'ti-plug' }
    const name = item.name + (item.brand ? ` (${item.brand})` : '')
    set({ apps: [...S.apps, { id: Date.now(), n: name, icon: iconMap[cat] || 'ti-plug', w: watts, h: 4, on: true, cat, modes, activeMode: 0 }], modal: null, tab: 'energy' })
  }))
  // Add catalog
  document.getElementById('open-catalog')?.addEventListener('click', () => set({ modal: { type: 'catalog', catFilter: 'Cuisine' } }))

  // Comparateur
  document.getElementById('capture-a')?.addEventListener('click', () => captureScenario('A'))
  document.getElementById('capture-b')?.addEventListener('click', () => captureScenario('B'))
  document.getElementById('goto-dashboard')?.addEventListener('click', () => set({ tab: 'energy' }))
  document.querySelectorAll('[data-clear-scenario]').forEach(el => el.addEventListener('click', () => {
    set({ scenarios: { ...S.scenarios, [el.dataset.clearScenario]: null } })
  }))
  document.getElementById('hookup-cost')?.addEventListener('change', e => set({ hookupCost: Math.max(0, parseFloat(e.target.value) || 0) }))

  // Auth
  document.getElementById('open-auth')?.addEventListener('click', () => set({ modal: { type: 'auth' } }))
  document.getElementById('open-auth-quota')?.addEventListener('click', () => set({ modal: { type: 'auth' } }))
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
    if (confirm('Supprimer cette configuration ?')) deleteConfig(el.dataset.delConfig)
  }))
}

function confirmCustom() {
  const n = document.getElementById('mn')?.value?.trim()
  const w = parseFloat(document.getElementById('mw')?.value) || 0
  const h = parseFloat(document.getElementById('mh')?.value) || 0
  const cat = document.getElementById('mc')?.value || 'Tech'
  if (!n) return
  const icons = { Cuisine: 'ti-bowl-spoon', Confort: 'ti-armchair', Éclairage: 'ti-bulb', Eau: 'ti-droplet', Tech: 'ti-cpu', Système: 'ti-plug' }
  set({ apps: [...S.apps, { id: Date.now(), n, icon: icons[cat] || 'ti-plug', w, h, on: true, cat }], modal: null })
}

function addFromAI(i) {
  const r = S.aiResults[i]
  const modes = r.modes && r.modes.length > 1 ? r.modes : null
  const watts = modes ? (modes[0]?.watts ?? 0) : (r.watts ?? 0)
  const name = r.name + (r.brand ? ` (${r.brand})` : '')
  const cats = { réfrigérateur: 'Cuisine', frigo: 'Cuisine', chauffage: 'Confort', clim: 'Confort', éclairage: 'Éclairage', pompe: 'Eau', tv: 'Tech', laptop: 'Tech', micro: 'Cuisine', convertisseur: 'Système', régulateur: 'Système' }
  const cat = Object.entries(cats).find(([k]) => r.type?.toLowerCase().includes(k))?.[1] || 'Tech'
  const icons = { Cuisine: 'ti-bowl-spoon', Confort: 'ti-temperature', Éclairage: 'ti-bulb', Eau: 'ti-droplet', Tech: 'ti-cpu', Système: 'ti-plug' }
  set({ apps: [...S.apps, { id: Date.now(), n: name, icon: icons[cat] || 'ti-plug', w: watts, h: 4, on: true, cat, modes, activeMode: 0 }], tab: 'energy' })
}

// ─── AI SEARCH ───────────────────────────────────────────────────────────────

async function searchAI(q) {
  // Vérification rate limit (free: 5/jour)
  const left = getAiSearchesLeft()
  if (left <= 0) {
    set({ aiError: 'Limite de 5 recherches IA par jour atteinte. Créez un compte Pro pour des recherches illimitées.' })
    return
  }

  // 1. Recherche dans Supabase (instantanée)
  set({ aiLoading: true, aiError: null, aiCatalogResults: [], aiOnlineResults: [], aiResults: [] })
  const catalogHits = await searchCatalog(q)
  if (catalogHits.length) {
    set({ aiCatalogResults: catalogHits, aiResults: catalogHits })
  }

  // 2. Appel API en streaming
  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `HTTP ${res.status}`)
    }

    // Lire le flux progressivement
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let accumulated = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      accumulated += decoder.decode(value, { stream: true })
    }

    // Consommer une recherche du quota
    consumeAiSearch()

    // Parser le JSON complet une fois le flux terminé
    const cleaned = accumulated.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Réponse IA non parsable.')
    const data = JSON.parse(jsonMatch[0])
    const onlineResults = data.results || []

    // Ne garder que les résultats nouveaux (absents du catalogue)
    const catalogKeys = new Set(catalogHits.map(r => (r.name + (r.brand || '')).toLowerCase().replace(/\s/g, '')))
    const newResults = onlineResults.filter(r => {
      const k = (r.name + (r.brand || '')).toLowerCase().replace(/\s/g, '')
      return !catalogKeys.has(k)
    })

    // Sauvegarder en base
    mergeIntoCatalog(onlineResults)

    set({
      aiLoading: false,
      aiOnlineResults: newResults,
      aiCatalogResults: catalogHits,
      aiResults: [...catalogHits, ...newResults],
      aiError: (!catalogHits.length && !onlineResults.length) ? 'Aucun résultat trouvé.' : null,
    })
  } catch (e) {
    set({
      aiLoading: false,
      aiError: catalogHits.length ? null : (e.message || 'Erreur de recherche en ligne'),
      aiOnlineResults: [],
    })
  }
}

// ─── BOOT ────────────────────────────────────────────────────────────────────
loadPersistedState()
render()
loadCatalogFromDB().then(() => render())
initAuth()
