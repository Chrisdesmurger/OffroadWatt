// ─── Google Analytics 4 (app) ───────────────────────────────────────────────
//
// GA4 + Consent Mode v2 pour l'application OffroadWatt.
//
// Le Measurement ID se configure via la variable d'environnement Vercel
// `VITE_GA_ID` (Settings → Environment Variables), ex : "G-XXXXXXXXXX".
// Tant qu'elle n'est pas définie, ce module est inerte (aucun appel réseau).
//
// Ce module est branché sur la fonction `track()` de main.js : tous les events
// produit déjà instrumentés (config_saved, export_opened, wizard_completed…)
// sont automatiquement renvoyés vers GA4 en plus de la table Supabase.

import { getLang } from './i18n.js'

const GA_ID = import.meta.env.VITE_GA_ID || 'G-N42S3VLH9W'
const CONSENT_KEY = 'ow_consent' // 'granted' | 'denied'

window.dataLayer = window.dataLayer || []
export function gtag() { window.dataLayer.push(arguments) }

let _ready = false

export function initGA() {
  if (_ready || !GA_ID) return
  _ready = true

  const stored = localStorage.getItem(CONSENT_KEY)

  // Consent Mode v2 — refus par défaut (RGPD) jusqu'à l'opt-in explicite.
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: stored === 'granted' ? 'granted' : 'denied',
    wait_for_update: 500,
  })

  gtag('js', new Date())
  gtag('config', GA_ID, { anonymize_ip: true })

  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(s)

  if (!stored) showConsentBanner()
}

// Forwarde un event vers GA4. Appelé par track() dans main.js.
export function gaEvent(name, params = {}) {
  if (!GA_ID) return
  // GA4 n'accepte que des paramètres scalaires : on aplatit/filtre le reste.
  const clean = {}
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue
    clean[k] = Array.isArray(v) ? v.join(',') : (typeof v === 'object' ? JSON.stringify(v) : v)
  }
  gtag('event', name, clean)
}

// Associe les events à l'utilisateur connecté (Supabase user id).
export function gaIdentify(userId) {
  if (!GA_ID || !userId) return
  gtag('set', { user_id: userId })
}

function setConsent(granted) {
  localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied')
  gtag('consent', 'update', { analytics_storage: granted ? 'granted' : 'denied' })
}

// ─── Bandeau de consentement ─────────────────────────────────────────────────

const BANNER = {
  en: { txt: 'We use cookies to measure audience and improve OffroadWatt.', ok: 'Accept', no: 'Decline' },
  es: { txt: 'Usamos cookies para medir la audiencia y mejorar OffroadWatt.', ok: 'Aceptar', no: 'Rechazar' },
  fr: { txt: 'Nous utilisons des cookies pour mesurer l’audience et améliorer OffroadWatt.', ok: 'Accepter', no: 'Refuser' },
}

function showConsentBanner() {
  const L = BANNER[getLang()] || BANNER.en
  const el = document.createElement('div')
  el.id = 'ow-consent'
  el.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;max-width:560px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:14px 16px;background:#141a16;border:1px solid #2a3830;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.5);font-family:"DM Sans",sans-serif;font-size:13px;color:#ddeedd'
  el.innerHTML = `<span style="flex:1;min-width:200px;line-height:1.5;color:#7a9985">${L.txt}</span>` +
    `<button id="ow-consent-no" style="cursor:pointer;border:1px solid #2a3830;background:none;color:#7a9985;border-radius:8px;padding:8px 14px;font:inherit">${L.no}</button>` +
    `<button id="ow-consent-ok" style="cursor:pointer;border:none;background:#f0a030;color:#090b0a;border-radius:8px;padding:8px 16px;font:inherit;font-weight:600">${L.ok}</button>`
  document.body.appendChild(el)
  el.querySelector('#ow-consent-ok').onclick = () => { setConsent(true); el.remove() }
  el.querySelector('#ow-consent-no').onclick = () => { setConsent(false); el.remove() }
}
