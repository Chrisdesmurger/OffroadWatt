// OffroadWatt — Calculateur d'autonomie électrique
// Vanilla JS / Vite

// ─── DATA ────────────────────────────────────────────────────────────────────

const BATS = [
  { ah: 60,  v: 12, label: '60 Ah 12V',  type: 'AGM' },
  { ah: 100, v: 12, label: '100 Ah 12V', type: 'AGM' },
  { ah: 120, v: 12, label: '120 Ah 12V', type: 'AGM' },
  { ah: 150, v: 12, label: '150 Ah 12V', type: 'GEL' },
  { ah: 200, v: 12, label: '200 Ah 12V', type: 'LI'  },
  { ah: 300, v: 12, label: '300 Ah 12V', type: 'LI'  },
  { ah: 400, v: 12, label: '400 Ah 12V', type: 'LI'  },
  { ah: 200, v: 24, label: '200 Ah 24V', type: 'LI'  },
  { ah: 400, v: 24, label: '400 Ah 24V', type: 'LI'  },
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
// Utilisé uniquement si pas de proxy serverless disponible (dev local sans api/)
const API_KEY = import.meta.env.VITE_ANTHROPIC_KEY || ''

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
  aiQuery: '', aiResults: [], aiLoading: false, aiError: null,
  modal: null, tab: 'energy', catFilter: 'Tout',
}

// ─── CORE ────────────────────────────────────────────────────────────────────

const set = (u) => { Object.assign(S, u); render() }
const sunH = () => S.sunIdx === SUN_ZONES.length - 1 ? (parseFloat(S.customSunH) || 4.5) : SUN_ZONES[S.sunIdx].h

function calc() {
  const active = S.apps.filter(a => a.on)
  const cons = active.reduce((s, a) => s + a.w * a.h, 0)
  const solar = S.solW * S.solNb * sunH() * S.solEff
  const net = Math.max(0, cons - solar)
  const batWhUnit = S.bat.ah * S.bat.v
  const batWhTotal = batWhUnit * S.batNb
  const usable = batWhTotal * S.dod
  const autDays = net > 0 ? usable / net : Infinity
  const solCovPct = cons > 0 ? Math.min(100, solar / cons * 100) : 100
  return { cons, solar, net, batWhUnit, batWhTotal, usable, autDays, solCovPct, breakdown: active.map(a => ({ ...a, wh: Math.round(a.w * a.h) })) }
}

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
    ${S.tab === 'apps'   ? buildAppsTab()   : ''}
    ${S.tab === 'energy' ? buildEnergyTab() : ''}
    ${S.tab === 'ai'     ? buildAITab()     : ''}
    ${S.tab === 'deploy' ? buildDeployTab() : ''}
  `
}

function buildHeader() {
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
    </div>
  </div>`
}

function buildTabs() {
  return `
  <div class="tabs">
    ${[['energy','ti-bolt','Dashboard'],['apps','ti-plug','Appareils'],['ai','ti-sparkles','Recherche IA'],['deploy','ti-rocket','Déploiement']].map(([k,ic,lb]) => `
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
  return `
  <div class="arow${!a.on ? ' off' : ''}${hasModes ? ' has-modes' : ''}">
    <button class="tog${a.on ? ' on' : ''}" data-toggle="${a.id}"></button>
    <i class="${a.icon} ai"></i>
    <span class="an" title="${a.n}">${a.n}</span>
    ${hasModes ? `
      <div class="mode-btns" style="grid-column:span 2">
        ${a.modes.map((m, mi) => `
          <button class="modebtn${a.activeMode === mi ? ' on' : ''}" data-mode-id="${a.id}" data-mode-idx="${mi}" title="${m.label}">
            ${m.label.length > 14 ? m.label.slice(0, 13) + '…' : m.label}
            <span class="modew">${m.watts} W</span>
          </button>`).join('')}
      </div>` : `
      <div class="wf"><input type="number" min="0" max="5000" value="${a.w}" data-id="${a.id}" data-field="w" class="fi"><span>W</span></div>
      <div class="hf"><input type="number" min="0" max="24" step="0.5" value="${a.h}" data-id="${a.id}" data-field="h" class="fi"><span>h/j</span></div>`}
    <span class="wh">${a.on ? Math.round(a.w * a.h) : 0} Wh</span>
    <button class="delbtn" data-del="${a.id}"><i class="ti ti-trash" style="font-size:12px"></i></button>
  </div>`
}

function buildAppsCard() {
  const filtered = S.catFilter === 'Tout' ? S.apps : S.apps.filter(a => a.cat === S.catFilter)
  const total = S.apps.filter(a => a.on).reduce((s, a) => s + a.w * a.h, 0)
  const active = S.apps.filter(a => a.on)
  return `
  <div class="card">
    <div class="ct"><i class="ti ti-plug"></i>Appareils consommateurs</div>
    <div class="catf">
      ${CATS.map(c => `<div class="cf${S.catFilter === c ? ' on' : ''}" data-cat="${c}"><i class="ti ${CATICONS[c]}" style="font-size:10px;margin-right:3px"></i>${c}</div>`).join('')}
    </div>
    <div class="applist">
      ${filtered.map(a => buildAppRow(a)).join('')}
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
  const { cons, solar, net, batWhUnit, batWhTotal, usable, autDays, solCovPct, breakdown } = calc()
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
        <div class="ef-grid">
          <div class="ef sol"><div class="en">${Math.round(solar)}</div><div class="el">Wh produits / jour</div></div>
          <div class="ef bat"><div class="en">${Math.round(usable)}</div><div class="el">Wh utilisables</div></div>
          <div class="ef net ${isDanger ? 'bad' : 'ok'}"><div class="en">${Math.round(net)}</div><div class="el">Wh déficit / jour</div></div>
        </div>
        <div style="font-size:10px;color:var(--t3);display:flex;justify-content:space-between;margin-top:6px;margin-bottom:2px">
          <span>Couverture solaire</span>
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
            <div class="abn">Sans soleil (batterie seule)</div>
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

    </div>
  </div>`
}

// ── AI TAB ───────────────────────────────────────────────────────────────────

function buildAIResultCard(r, i) {
  const modes = r.modes && r.modes.length > 1 ? r.modes : null
  const mainWatts = modes ? modes[0]?.watts : (r.watts ?? null)
  const canAdd = mainWatts != null || modes

  return `
  <div class="ai-item">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
      <div class="ain">${r.name}${r.brand ? ` <span style="font-size:10px;color:var(--t3)">— ${r.brand}</span>` : ''}</div>
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
  return `
  <div class="card">
    <div class="ct"><i class="ti ti-sparkles"></i>Recherche d'équipements par IA</div>
    <p style="font-size:12px;color:var(--t2);margin-bottom:8px">L'IA cherche des équipements réels sur le web — consommation 12V, prix, modèles. Supporte les appareils multi-modes (ex: chauffage diesel + ventilateur 12V).</p>
    <div class="ai-row">
      <input class="ai-in" id="aiq" type="text" placeholder="Ex: chauffage diesel Webasto, réfrigérateur 12V Dometic, pompe eau Shurflo…" value="${S.aiQuery}">
      <button class="aibtn" id="ai-search" ${S.aiLoading ? 'disabled' : ''}>
        ${S.aiLoading ? '<div class="loading"><span></span><span></span><span></span></div>' : '<i class="ti ti-search"></i> Chercher'}
      </button>
    </div>
    ${S.aiError ? `
      <div class="api-warn" style="margin-top:8px">
        <strong>⚠️ Erreur</strong> — ${S.aiError}
        ${S.aiError.includes('key') || S.aiError.includes('configured') ? `<br><small>Ajoutez <code>ANTHROPIC_KEY</code> dans les variables d'environnement Vercel.</small>` : ''}
      </div>` : ''}
    ${S.aiResults.length
      ? S.aiResults.map((r, i) => buildAIResultCard(r, i)).join('')
      : S.aiLoading
        ? `<div style="text-align:center;padding:20px;color:var(--t3)">
            <div class="loading" style="justify-content:center"><span></span><span></span><span></span></div>
            <div style="margin-top:6px;font-size:11px">Recherche web en cours, 10-20 secondes…</div>
           </div>`
        : !S.aiError ? `<div style="text-align:center;padding:28px;color:var(--t3)">
            <i class="ti ti-search" style="font-size:26px;opacity:.3;display:block;margin-bottom:5px"></i>
            <div style="font-size:11px">Tapez un équipement pour lancer la recherche web IA</div>
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
  if (m.type === 'catalog') {
    const cf = m.catFilter || 'Cuisine'
    const filtered = CATALOG.filter(c => c.cat === cf)
    return `
    <div class="ov" id="modal-overlay">
      <div class="mo">
        <h3><i class="ti ti-book"></i> Catalogue d'appareils</h3>
        <div class="catcatalog">
          ${['Cuisine','Confort','Tech','Eau','Éclairage','Système'].map(c => `
            <div class="cf${cf === c ? ' on' : ''}" data-modal-cat="${c}">${c}</div>`).join('')}
        </div>
        <div class="catgrid">
          ${filtered.map(item => `
            <div class="catitem" data-catalog="${CATALOG.indexOf(item)}">
              <div><div class="cin">${item.n}</div><div class="cim"><span class="ciw">${item.w}W</span><span>${item.h}h/j</span></div></div>
              <i class="ti ti-plus" style="font-size:14px;color:var(--t3)"></i>
            </div>`).join('')}
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
  document.getElementById('open-catalog')?.addEventListener('click', () => set({ modal: { type: 'catalog', catFilter: 'Cuisine' } }))
  document.getElementById('open-custom')?.addEventListener('click', () => set({ modal: { type: 'custom' } }))
  // Modal overlay close
  document.getElementById('modal-overlay')?.addEventListener('click', e => { if (e.target.id === 'modal-overlay') set({ modal: null }) })
  document.getElementById('close-modal')?.addEventListener('click', () => set({ modal: null }))
  document.getElementById('confirm-custom')?.addEventListener('click', confirmCustom)
  // Catalog category filter inside modal
  document.querySelectorAll('[data-modal-cat]').forEach(el => el.addEventListener('click', () => set({ modal: { ...S.modal, catFilter: el.dataset.modalCat } })))
  // Add from catalog
  document.querySelectorAll('[data-catalog]').forEach(el => el.addEventListener('click', () => {
    const item = CATALOG[parseInt(el.dataset.catalog)]
    set({ apps: [...S.apps, { id: Date.now(), n: item.n, icon: item.icon, w: item.w, h: item.h, on: true, cat: item.cat }], modal: null, tab: 'energy' })
  }))
  // Add catalog
  document.getElementById('open-catalog')?.addEventListener('click', () => set({ modal: { type: 'catalog', catFilter: 'Cuisine' } }))
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
  set({ aiLoading: true, aiResults: [], aiError: null })

  // Try serverless proxy first (production), fall back to direct call (dev)
  const useProxy = !window.location.hostname.includes('localhost') || true
  try {
    let data
    if (useProxy) {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    } else {
      if (!API_KEY || API_KEY.length < 10) throw new Error('Clé API manquante')
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 2048,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          system: 'Retourne UNIQUEMENT un JSON valide: {"results":[{"name":"...","brand":"...","watts":0,"voltage":12,"price_eur":0,"description":"...","type":"...","efficiency":"..."}]}',
          messages: [{ role: 'user', content: `Recherche équipements camping-car/van: ${q}` }],
        }),
      })
      const raw = await res.json()
      const text = raw.content?.find(b => b.type === 'text')?.text || ''
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Réponse non parsable')
      data = JSON.parse(match[0])
    }
    set({ aiResults: data.results || [], aiLoading: false, aiError: (data.results?.length ? null : 'Aucun résultat trouvé.') })
  } catch (e) {
    set({ aiLoading: false, aiResults: [], aiError: e.message || 'Erreur de recherche' })
  }
}

// ─── BOOT ────────────────────────────────────────────────────────────────────
render()
