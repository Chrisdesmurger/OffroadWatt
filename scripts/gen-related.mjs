#!/usr/bin/env node
/**
 * OffroadWatt — internal-linking generator.
 * Injects a localized "Related guides" module (hub-and-spoke internal links)
 * before the closing CTA of every blog article, in all three languages.
 *
 * Idempotent: a <nav class="related"> block is delimited by HTML markers and
 * regenerated in place on each run, so re-running never duplicates it and
 * always reflects the current TOPICS/RELATED maps below.
 *
 * Usage: node scripts/gen-related.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BLOG = join(ROOT, 'landing', 'blog');

// Canonical topic model. slug = per-language URL segment, label = anchor text.
const TOPICS = {
  solar:    { en:['how-many-solar-panels-campervan','How many solar panels for a campervan'], fr:['fr/combien-panneaux-solaires-camping-car','Combien de panneaux solaires pour un camping-car'], es:['es/cuantos-paneles-solares-autocaravana','Cuántas placas solares para una autocaravana'] },
  autonomy: { en:['how-to-calculate-campervan-battery-autonomy','How to calculate campervan battery autonomy'], fr:['fr/calculer-autonomie-batterie-camping-car',"Calculer l'autonomie batterie d'un camping-car"], es:['es/calcular-autonomia-bateria-autocaravana','Calcular la autonomía de la batería'] },
  agm:      { en:['agm-vs-gel-vs-lithium-campervan-battery','AGM vs GEL vs Lithium campervan batteries'], fr:['fr/agm-gel-lithium-batterie-camping-car','Batterie AGM, GEL ou lithium'], es:['es/agm-gel-litio-bateria-autocaravana','Batería AGM, GEL o litio'] },
  dcdc:     { en:['how-to-wire-dc-dc-charger-campervan','How to wire a DC-DC charger'], fr:['fr/brancher-chargeur-dc-dc-camping-car','Brancher un chargeur DC-DC'], es:['es/instalar-cargador-dc-dc-furgoneta-camper','Instalar un cargador DC-DC'] },
  mppt:     { en:['mppt-vs-pwm-solar-controller-campervan','MPPT vs PWM solar controllers'], fr:['fr/regulateur-solaire-mppt-vs-pwm-camping-car','Régulateur solaire MPPT vs PWM'], es:['es/regulador-solar-mppt-vs-pwm-autocaravana','Regulador solar MPPT vs PWM'] },
  lithium:  { en:['lithium-battery-sizing-van-life-200ah-300ah','Lithium battery sizing (200Ah vs 300Ah)'], fr:['fr/dimensionnement-batterie-lithium-van-life-200ah-300ah','Dimensionner une batterie lithium (200Ah/300Ah)'], es:['es/dimensionamiento-bateria-litio-vida-furgoneta-200ah-300ah','Dimensionar una batería de litio (200Ah/300Ah)'] },
  sodium:   { en:['sodium-ion-battery-campervan-ective-nac-bt','Sodium-ion campervan batteries (Ective NaC BT)'], fr:['fr/batterie-sodium-ion-camping-car-ective-nac-bt','Batteries sodium-ion (Ective NaC BT)'], es:['es/bateria-sodio-ion-autocaravana-ective-nac-bt','Baterías de sodio-ion (Ective NaC BT)'] },
  winter:   { en:['leisure-battery-charged-winter','Keeping a leisure battery charged in winter'], fr:['fr/recharger-batterie-auxiliaire-hiver','Recharger sa batterie auxiliaire en hiver'], es:['es/mantener-bateria-auxiliar-cargada-invierno','Mantener la batería auxiliar cargada en invierno'] },
  fridge:   { en:['campervan-fridge-power-consumption','Campervan fridge power consumption'], fr:['fr/consommation-frigo-camping-car','Consommation du frigo de camping-car'], es:['es/consumo-frigorifico-autocaravana','Consumo del frigorífico'] },
  cost:     { en:['campervan-electrical-system-cost','Campervan electrical system cost'], fr:['fr/cout-installation-electrique-camping-car',"Coût d'une installation électrique de camping-car"], es:['es/cuanto-cuesta-instalacion-electrica-autocaravana','Cuánto cuesta la instalación eléctrica'] },
  inverter: { en:['what-size-inverter-campervan','What size inverter for a campervan'], fr:['fr/quelle-puissance-convertisseur-camping-car','Quelle puissance de convertisseur'], es:['es/que-tamano-inversor-autocaravana','Qué tamaño de inversor'] },
  evotrex:  { en:['evotrex-pg5-power-generating-rv-trailer','Evotrex PG5 power-generating trailer'], fr:['fr/evotrex-pg5-remorque-camping-car-autonome','Remorque autonome Evotrex PG5'], es:['es/evotrex-pg5-remolque-autocaravana-autonomo','Remolque autónomo Evotrex PG5'] },
};

// Hub-and-spoke: each topic points to 3–4 topically related siblings.
const RELATED = {
  solar:    ['mppt','autonomy','agm','cost'],
  autonomy: ['solar','lithium','fridge','inverter'],
  agm:      ['lithium','autonomy','sodium','cost'],
  dcdc:     ['lithium','winter','autonomy','cost'],
  mppt:     ['solar','cost','autonomy'],
  lithium:  ['agm','solar','dcdc','cost'],
  sodium:   ['agm','lithium','winter'],
  winter:   ['dcdc','agm','autonomy'],
  fridge:   ['autonomy','lithium','solar'],
  cost:     ['lithium','solar','agm','inverter'],
  inverter: ['cost','lithium','autonomy'],
  evotrex:  ['autonomy','solar','cost'],
};

const HEADING = { en: 'Related guides', fr: 'Guides liés', es: 'Guías relacionadas' };
const START = '<!-- related:start -->';
const END = '<!-- related:end -->';

function block(topicId, lang) {
  const items = RELATED[topicId].map((rid) => {
    const [slug, label] = TOPICS[rid][lang];
    return `      <li><a href="/blog/${slug}">${label}</a></li>`;
  }).join('\n');
  return `${START}
    <nav class="related" aria-label="${HEADING[lang]}">
      <h2>${HEADING[lang]}</h2>
      <ul>
${items}
      </ul>
    </nav>
    ${END}`;
}

let changed = 0, skipped = 0;
for (const [topicId, langs] of Object.entries(TOPICS)) {
  for (const lang of ['en', 'fr', 'es']) {
    const file = join(BLOG, langs[lang][0] + '.html');
    if (!existsSync(file)) { console.warn('missing', file); continue; }
    let html = readFileSync(file, 'utf8');
    const nav = block(topicId, lang);
    const marker = new RegExp(`${START}[\\s\\S]*?${END}`);
    let next;
    if (marker.test(html)) {
      next = html.replace(marker, nav); // regenerate in place
    } else {
      // Insert before the first closing CTA box.
      next = html.replace(/(\n\s*)(<div class="cta-box">)/, `$1${nav}$1$2`);
    }
    if (next !== html) { writeFileSync(file, next); changed++; } else skipped++;
  }
}
console.log(`related: ${changed} file(s) updated, ${skipped} unchanged.`);
