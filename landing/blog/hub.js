/* OffroadWatt blog hub — shared data + renderer for the EN/FR/ES hub pages.
 * Each hub HTML sets window.OW_HUB_LANG ('en' | 'fr' | 'es') before loading this,
 * so the page renders in its own language and stays a distinct, canonical URL.
 * Language buttons are real links that navigate between the three hub URLs. */
const DICT = {
  en: {
    'nav.blog':'Blog','nav.features':'Features','nav.cta':'Try free',
    'hub.badge':'The OffroadWatt blog','hub.title':'Power your journey with confidence',
    'hub.sub':'Practical guides on battery autonomy, solar and electrical consumption for campervans, motorhomes and vans.',
    'foot.home':'Home','foot.app':'Open the app','foot.copy':'© 2026 OffroadWatt. The electrical autonomy calculator for motorhomes, caravans and vans.'
  },
  fr: {
    'nav.blog':'Blog','nav.features':'Fonctionnalités','nav.cta':'Essayer',
    'hub.badge':'Le blog OffroadWatt','hub.title':'Voyagez l’esprit tranquille',
    'hub.sub':'Des guides pratiques sur l’autonomie batterie, le solaire et la consommation électrique en camping-car, van et fourgon.',
    'foot.home':'Accueil','foot.app':'Ouvrir l’app','foot.copy':'© 2026 OffroadWatt. Le calculateur d’autonomie électrique pour camping-car, caravane et van.'
  },
  es: {
    'nav.blog':'Blog','nav.features':'Características','nav.cta':'Probar',
    'hub.badge':'El blog de OffroadWatt','hub.title':'Viaja con total confianza',
    'hub.sub':'Guías prácticas sobre autonomía de batería, solar y consumo eléctrico en autocaravana, furgoneta y camper.',
    'foot.home':'Inicio','foot.app':'Abrir la app','foot.copy':'© 2026 OffroadWatt. La calculadora de autonomía eléctrica para autocaravanas, caravanas y furgonetas.'
  }
};

// One entry per article, with per-language metadata + URL.
const POSTS = [
  {
    img: { en:'/blog/assets/evotrex-pg5-hero.png', fr:'/blog/assets/evotrex-pg5-hero-fr.png', es:'/blog/assets/evotrex-pg5-hero-es.png' },
    tag: { en:'New gear', fr:'Nouveauté', es:'Novedad' },
    date: { en:'July 2, 2026', fr:'2 juillet 2026', es:'2 de julio de 2026' },
    title: {
      en:'Evotrex PG5: the first power-generating RV trailer',
      fr:'Evotrex PG5 : la première remorque camping-car qui produit son énergie',
      es:'Evotrex PG5: el primer remolque de autocaravana que genera su energía'
    },
    excerpt: {
      en:'A trailer that makes its own electricity — 43 kWh battery, 1.5 kW solar and an onboard generator for 270+ kWh per cycle, plus V2L and EV charging. Full breakdown.',
      fr:'Une remorque qui fabrique son électricité — batterie 43 kWh, 1,5 kW solaire et générateur embarqué pour 270+ kWh par cycle, plus V2L et recharge VE. Analyse complète.',
      es:'Un remolque que fabrica su electricidad — batería de 43 kWh, 1,5 kW solar y generador a bordo para 270+ kWh por ciclo, más V2L y carga de VE. Análisis completo.'
    },
    url: {
      en:'/blog/evotrex-pg5-power-generating-rv-trailer',
      fr:'/blog/fr/evotrex-pg5-remorque-camping-car-autonome',
      es:'/blog/es/evotrex-pg5-remolque-autocaravana-autonomo'
    }
  },
  {
    img: { en:'/blog/assets/lithium-sizing-hero.png', fr:'/blog/assets/lithium-sizing-hero-fr.png', es:'/blog/assets/lithium-sizing-hero-es.png' },
    tag: { en:'Battery guide', fr:'Guide batterie', es:'Guia de baterias' },
    date: { en:'July 1, 2026', fr:'1er juillet 2026', es:'1 de julio de 2026' },
    title: {
      en:'Lithium battery sizing for full-time van life: 200Ah vs 300Ah',
      fr:'Dimensionnement batterie lithium pour le van life : 200Ah vs 300Ah',
      es:'Dimensionamiento de bateria de litio para vivir en furgoneta: 200Ah vs 300Ah'
    },
    excerpt: {
      en:'How to choose between 200Ah and 300Ah LiFePO4 for full-time van life. Daily consumption tables, real-world autonomy scenarios and a sizing formula.',
      fr:'Choisir entre 200Ah et 300Ah LiFePO4 pour la vie en van. Tableaux de consommation, scenarios d\'autonomie et formule de dimensionnement.',
      es:'Como elegir entre 200Ah y 300Ah LiFePO4 para vivir en furgoneta. Tablas de consumo, escenarios de autonomia y formula de dimensionamiento.'
    },
    url: {
      en:'/blog/lithium-battery-sizing-van-life-200ah-300ah',
      fr:'/blog/fr/dimensionnement-batterie-lithium-van-life-200ah-300ah',
      es:'/blog/es/dimensionamiento-bateria-litio-vida-furgoneta-200ah-300ah'
    }
  },
  {
    img: { en:'/blog/assets/sodium-ion-hero.png', fr:'/blog/assets/sodium-ion-hero-fr.png', es:'/blog/assets/sodium-ion-hero-es.png' },
    tag: { en:'Battery technology', fr:'Technologie batterie', es:'Tecnologia de baterias' },
    date: { en:'June 29, 2026', fr:'29 juin 2026', es:'29 de junio de 2026' },
    title: {
      en:'Sodium-ion batteries for campervans: Ective NaC BT review and comparison',
      fr:'Batteries sodium-ion pour camping-car : test Ective NaC BT et comparatif',
      es:'Baterias de sodio-ion para autocaravanas: analisis Ective NaC BT y comparativa'
    },
    excerpt: {
      en:'The first sodium-ion leisure batteries are here. We review the Ective NaC BT range — specs, pricing, cold-weather performance — and compare Na-ion vs LiFePO4 vs AGM.',
      fr:'Les premieres batteries auxiliaires sodium-ion sont la. Test de la gamme Ective NaC BT — specs, prix, performances par grand froid — et comparatif Na-ion vs LiFePO4 vs AGM.',
      es:'Las primeras baterias auxiliares de sodio-ion ya estan aqui. Analizamos la gama Ective NaC BT — specs, precios, rendimiento en frio — y comparamos Na-ion vs LiFePO4 vs AGM.'
    },
    url: {
      en:'/blog/sodium-ion-battery-campervan-ective-nac-bt',
      fr:'/blog/fr/batterie-sodium-ion-camping-car-ective-nac-bt',
      es:'/blog/es/bateria-sodio-ion-autocaravana-ective-nac-bt'
    }
  },
  {
    img: { en:'/blog/assets/winter-battery-hero.png', fr:'/blog/assets/winter-battery-hero-fr.png', es:'/blog/assets/winter-battery-hero-es.png' },
    tag: { en:'Battery guide', fr:'Guide batterie', es:'Guia de baterias' },
    date: { en:'June 23, 2026', fr:'23 juin 2026', es:'23 de junio de 2026' },
    title: {
      en:'How to keep your leisure battery charged in winter',
      fr:'Recharger sa batterie auxiliaire en hiver : le guide complet',
      es:'Mantener la batería auxiliar cargada en invierno: guía completa'
    },
    excerpt: {
      en:'Solar, alternator and mains strategies to keep your campervan battery healthy through cold weather — plus capacity loss tables and a winter maintenance checklist.',
      fr:'Stratégies solaire, alternateur et secteur pour garder votre batterie en bonne santé par temps froid — tableaux de perte de capacité et checklist d\'entretien hivernal.',
      es:'Estrategias solar, alternador y red para mantener tu batería en buen estado con frío — tablas de pérdida de capacidad y lista de verificación invernal.'
    },
    url: {
      en:'/blog/leisure-battery-charged-winter',
      fr:'/blog/fr/recharger-batterie-auxiliaire-hiver',
      es:'/blog/es/mantener-bateria-auxiliar-cargada-invierno'
    }
  },
  {
    img: { en:'/blog/assets/fridge-power-hero.png', fr:'/blog/assets/fridge-power-hero-fr.png', es:'/blog/assets/fridge-power-hero-es.png' },
    tag: { en:'Appliance guide', fr:'Guide équipement', es:'Guia de equipamiento' },
    date: { en:'June 22, 2026', fr:'22 juin 2026', es:'22 de junio de 2026' },
    title: {
      en:'Campervan fridge power consumption: compressor vs absorption',
      fr:'Consommation frigo camping-car : compresseur vs absorption',
      es:'Consumo frigorífico autocaravana: compresor vs absorción'
    },
    excerpt: {
      en:'Real power draw of compressor and absorption fridges compared — plus battery sizing, solar tips and daily Ah consumption tables.',
      fr:'Consommation réelle des frigos compresseur et absorption comparée — dimensionnement batterie, solaire et tableaux de consommation en Ah.',
      es:'Consumo real de frigoríficos compresor y absorción comparados — dimensionamiento de batería, solar y tablas de consumo en Ah.'
    },
    url: {
      en:'/blog/campervan-fridge-power-consumption',
      fr:'/blog/fr/consommation-frigo-camping-car',
      es:'/blog/es/consumo-frigorifico-autocaravana'
    }
  },
  {
    img: { en:'/blog/assets/electrical-cost-hero.png', fr:'/blog/assets/electrical-cost-hero-fr.png', es:'/blog/assets/electrical-cost-hero-es.png' },
    tag: { en:'Budget guide', fr:'Guide budget', es:'Guia de presupuesto' },
    date: { en:'June 20, 2026', fr:'20 juin 2026', es:'20 de junio de 2026' },
    title: {
      en:'How much does a campervan electrical system cost?',
      fr:'Coût d\'une installation électrique camping-car : budget complet',
      es:'Instalación eléctrica autocaravana: presupuesto completo'
    },
    excerpt: {
      en:'Full budget breakdown for batteries, solar, wiring and chargers — from basic weekend setups to premium full-time builds.',
      fr:'Budget détaillé poste par poste : batterie, solaire, câblage et chargeur, de l\'entrée de gamme au haut de gamme.',
      es:'Presupuesto detallado componente a componente: batería, solar, cableado y cargador, de la gama básica a la premium.'
    },
    url: {
      en:'/blog/campervan-electrical-system-cost',
      fr:'/blog/fr/cout-installation-electrique-camping-car',
      es:'/blog/es/cuanto-cuesta-instalacion-electrica-autocaravana'
    }
  },
  {
    img: { en:'/blog/assets/mppt-vs-pwm-hero.png', fr:'/blog/assets/mppt-vs-pwm-hero-fr.png', es:'/blog/assets/mppt-vs-pwm-hero-es.png' },
    tag: { en:'Solar & energy', fr:'Solaire & énergie', es:'Solar & energía' },
    date: { en:'June 19, 2026', fr:'19 juin 2026', es:'19 de junio de 2026' },
    title: {
      en:'MPPT vs PWM solar controller: which one for your campervan?',
      fr:'MPPT vs PWM : quel régulateur solaire pour camping-car ?',
      es:'MPPT vs PWM: ¿qué regulador solar para tu autocaravana?'
    },
    excerpt: {
      en:'Efficiency, cost and sizing compared side by side — plus a controller sizing table and the most popular models for campervans.',
      fr:'Rendement, prix et dimensionnement comparés — avec un tableau de dimensionnement et les modèles les plus populaires.',
      es:'Rendimiento, precio y dimensionamiento comparados — con tabla de dimensionamiento y los modelos más populares.'
    },
    url: {
      en:'/blog/mppt-vs-pwm-solar-controller-campervan',
      fr:'/blog/fr/regulateur-solaire-mppt-vs-pwm-camping-car',
      es:'/blog/es/regulador-solar-mppt-vs-pwm-autocaravana'
    }
  },
  {
    img: { en:'/blog/assets/inverter-sizing-hero.png', fr:'/blog/assets/inverter-sizing-hero-fr.png', es:'/blog/assets/inverter-sizing-hero-es.png' },
    tag: { en:'Electrical guide', fr:'Guide technique', es:'Guia tecnica' },
    date: { en:'June 17, 2026', fr:'17 juin 2026', es:'17 de junio de 2026' },
    title: {
      en:'What size inverter do I need for my campervan?',
      fr:'Quelle puissance de convertisseur pour un camping-car ?',
      es:'¿Qué tamaño de inversor necesito para mi autocaravana?'
    },
    excerpt: {
      en:'Pure sine vs modified, wattage sizing by appliance, battery impact formula and a comparison of popular 12V inverters.',
      fr:'Onde pure vs modifiée, dimensionnement par appareil, impact sur la batterie et comparatif des convertisseurs 12V populaires.',
      es:'Onda pura vs modificada, dimensionamiento por electrodoméstico, impacto en la batería y comparativa de inversores 12V populares.'
    },
    url: {
      en:'/blog/what-size-inverter-campervan',
      fr:'/blog/fr/quelle-puissance-convertisseur-camping-car',
      es:'/blog/es/que-tamano-inversor-autocaravana'
    }
  },
  {
    img: { en:'/blog/assets/dc-dc-charger-hero.png', fr:'/blog/assets/dc-dc-charger-hero-fr.png', es:'/blog/assets/dc-dc-charger-hero-es.png' },
    tag: { en:'Installation guide', fr:'Guide d\'installation', es:'Guia de instalacion' },
    date: { en:'June 14, 2026', fr:'14 juin 2026', es:'14 de junio de 2026' },
    title: {
      en:'How to wire a DC-DC (B2B) alternator charger in a van',
      fr:'Brancher un chargeur DC-DC (B2B) dans un camping-car ou van',
      es:'Como instalar un cargador DC-DC (B2B) en una furgoneta camper'
    },
    excerpt: {
      en:'Step-by-step wiring guide with cable sizing table, fuse placement, install sequence and common mistakes to avoid.',
      fr:'Guide de cablage complet avec tableau des sections, fusibles, etapes d\'installation et erreurs a eviter.',
      es:'Guia completa de cableado con tabla de secciones, fusibles, pasos de instalacion y errores comunes a evitar.'
    },
    url: {
      en:'/blog/how-to-wire-dc-dc-charger-campervan',
      fr:'/blog/fr/brancher-chargeur-dc-dc-camping-car',
      es:'/blog/es/instalar-cargador-dc-dc-furgoneta-camper'
    }
  },
  {
    img: { en:'/blog/assets/agm-gel-lithium-hero.png', fr:'/blog/assets/agm-gel-lithium-hero-fr.png', es:'/blog/assets/agm-gel-lithium-hero-es.png' },
    tag: { en:'Battery comparison', fr:'Comparatif batteries', es:'Comparativa baterias' },
    date: { en:'June 10, 2026', fr:'10 juin 2026', es:'10 de junio de 2026' },
    title: {
      en:'AGM vs GEL vs Lithium: which leisure battery for a campervan?',
      fr:'AGM, GEL ou Lithium : quelle batterie pour camping-car ?',
      es:'AGM vs GEL vs Litio: mejor bateria auxiliar para autocaravana'
    },
    excerpt: {
      en:'Side-by-side specs, cost per cycle, lifespan and a decision framework to pick the right chemistry for your setup.',
      fr:'Tableau comparatif, prix au cycle, duree de vie et guide de decision pour choisir la bonne technologie.',
      es:'Tabla comparativa, coste por ciclo, vida util y guia de decision para elegir la tecnologia adecuada.'
    },
    url: {
      en:'/blog/agm-vs-gel-vs-lithium-campervan-battery',
      fr:'/blog/fr/agm-gel-lithium-batterie-camping-car',
      es:'/blog/es/agm-gel-litio-bateria-autocaravana'
    }
  },
  {
    img: { en:'/blog/assets/solar-panels-hero.png', fr:'/blog/assets/solar-panels-hero-fr.png', es:'/blog/assets/solar-panels-hero-es.png' },
    tag: { en:'Solar & energy', fr:'Solaire & énergie', es:'Solar & energía' },
    date: { en:'June 8, 2026', fr:'8 juin 2026', es:'8 de junio de 2026' },
    title: {
      en:'How many solar panels do you need for a campervan?',
      fr:'Combien de panneaux solaires pour un camping-car ?',
      es:'¿Cuántos paneles solares necesita una autocaravana?'
    },
    excerpt: {
      en:'The real wattage formula, a sizing table by use case and the battery-to-solar ratio — with a worked example.',
      fr:'La vraie formule de puissance, un tableau par usage et le ratio batterie/solaire — exemple chiffré inclus.',
      es:'La fórmula real de potencia, una tabla por uso y el ratio batería/solar — con ejemplo práctico.'
    },
    url: {
      en:'/blog/how-many-solar-panels-campervan',
      fr:'/blog/fr/combien-panneaux-solaires-camping-car',
      es:'/blog/es/cuantos-paneles-solares-autocaravana'
    }
  },
  {
    img: { en:'/blog/assets/battery-autonomy-hero.png', fr:'/og-image.png', es:'/og-image-es.png' },
    tag: { en:'Battery & energy', fr:'Batterie & énergie', es:'Batería & energía' },
    date: { en:'June 8, 2026', fr:'8 juin 2026', es:'8 de junio de 2026' },
    title: {
      en:'How to calculate your campervan battery autonomy',
      fr:'Calculer l’autonomie batterie de son camping-car',
      es:'Calcular la autonomía de batería de tu autocaravana'
    },
    excerpt: {
      en:'The exact 4-step formula to size your battery, solar and alternator — with a worked example.',
      fr:'La formule exacte en 4 étapes pour dimensionner batterie, solaire et alternateur — exemple chiffré inclus.',
      es:'La fórmula exacta en 4 pasos para dimensionar batería, solar y alternador — con ejemplo práctico.'
    },
    url: {
      en:'/blog/how-to-calculate-campervan-battery-autonomy',
      fr:'/blog/fr/calculer-autonomie-batterie-camping-car',
      es:'/blog/es/calcular-autonomia-bateria-autocaravana'
    }
  }
];

let _lang = window.OW_HUB_LANG;
if (!['fr', 'en', 'es'].includes(_lang)) _lang = 'en';
const t = (k) => (DICT[_lang] && DICT[_lang][k]) || DICT.en[k] || k;

function render() {
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('.lang-btn').forEach((b) => b.classList.toggle('on', b.dataset.lang === _lang));
  document.documentElement.lang = _lang;
  document.getElementById('posts').innerHTML = POSTS.map((p, i) => `
    <a class="post-card" href="${p.url[_lang]}">
      <img src="${p.img[_lang]}" alt="${p.title[_lang]}" ${i === 0 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy" decoding="async"'} width="1200" height="630">
      <div class="post-body">
        <span class="post-tag">${p.tag[_lang]}</span>
        <h2>${p.title[_lang]}</h2>
        <p>${p.excerpt[_lang]}</p>
        <div class="post-date">${p.date[_lang]}</div>
      </div>
    </a>`).join('');
}

// Language buttons are real links to the three hub URLs; persist the choice so the
// rest of the marketing site keeps the same language preference.
document.querySelectorAll('.lang-btn').forEach((b) => b.addEventListener('click', () => {
  try { localStorage.setItem('ow_land_lang', b.dataset.lang); } catch (_) {}
}));

render();
