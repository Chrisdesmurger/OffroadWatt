/* ─── Google Analytics 4 (landing + blog) ──────────────────────────────────────
 *
 * GA4 + Consent Mode v2 pour le site vitrine et le blog OffroadWatt.
 *
 * ⚙️  CONFIGURATION : remplace la valeur de GA_ID ci-dessous par le Measurement
 *     ID de ta propriété GA4 (même propriété que l'app), ex : "G-XXXXXXXXXX".
 *     Tant que la valeur reste le placeholder, le script est inerte.
 *
 * Inclus automatiquement dans chaque page via <script src="/analytics.js" defer>.
 * Suit : pages vues (auto), clics CTA blog→app, intention d'inscription.
 * ────────────────────────────────────────────────────────────────────────────── */
(function () {
  var GA_ID = 'G-N42S3VLH9W'
  if (!GA_ID || GA_ID === 'G-XXXXXXXXXX') return // pas encore configuré

  var CONSENT_KEY = 'ow_consent' // partagé avec l'app ('granted' | 'denied')

  window.dataLayer = window.dataLayer || []
  function gtag() { window.dataLayer.push(arguments) }
  window.gtag = gtag

  var stored = null
  try { stored = localStorage.getItem(CONSENT_KEY) } catch (e) {}

  // Consent Mode v2 — refus par défaut (RGPD) jusqu'à l'opt-in.
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: stored === 'granted' ? 'granted' : 'denied',
    wait_for_update: 500,
  })

  gtag('js', new Date())
  gtag('config', GA_ID, { anonymize_ip: true })

  var s = document.createElement('script')
  s.async = true
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID
  document.head.appendChild(s)

  function event(name, params) { gtag('event', name, params || {}) }

  // ── Tracking CTA blog/landing → app, et intention d'inscription ──────────────
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a, button')
    if (!a) return
    var href = (a.getAttribute('href') || '').toLowerCase()
    var id = a.id || ''
    if (id === 'signup-btn' || href === '#signup') {
      event('signup_intent', { location: id || 'cta', page: location.pathname })
    } else if (/offroad-?watt\.(vercel\.app|com)/.test(href) && /(^https?:|\/app)/.test(href) && href.indexOf('/blog') === -1) {
      event('blog_to_app_click', { href: href, page: location.pathname })
    }
  }, true)

  // ── Bandeau de consentement ─────────────────────────────────────────────────
  function setConsent(granted) {
    try { localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied') } catch (e) {}
    gtag('consent', 'update', { analytics_storage: granted ? 'granted' : 'denied' })
  }

  if (!stored) {
    var lang = (document.documentElement.lang || 'en').slice(0, 2)
    try { lang = (localStorage.getItem('ow_lang') || lang).slice(0, 2) } catch (e) {}
    var T = {
      en: { txt: 'We use cookies to measure audience and improve OffroadWatt.', ok: 'Accept', no: 'Decline' },
      es: { txt: 'Usamos cookies para medir la audiencia y mejorar OffroadWatt.', ok: 'Aceptar', no: 'Rechazar' },
      fr: { txt: 'Nous utilisons des cookies pour mesurer l’audience et améliorer OffroadWatt.', ok: 'Accepter', no: 'Refuser' },
    }
    var L = T[lang] || T.en

    function banner() {
      var el = document.createElement('div')
      el.id = 'ow-consent'
      el.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;max-width:560px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:14px 16px;background:#141a16;border:1px solid #2a3830;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.5);font-family:"DM Sans",sans-serif;font-size:13px;color:#ddeedd'
      el.innerHTML = '<span style="flex:1;min-width:200px;line-height:1.5;color:#7a9985">' + L.txt + '</span>' +
        '<button id="ow-consent-no" style="cursor:pointer;border:1px solid #2a3830;background:none;color:#7a9985;border-radius:8px;padding:8px 14px;font:inherit">' + L.no + '</button>' +
        '<button id="ow-consent-ok" style="cursor:pointer;border:none;background:#f0a030;color:#090b0a;border-radius:8px;padding:8px 16px;font:inherit;font-weight:600">' + L.ok + '</button>'
      document.body.appendChild(el)
      el.querySelector('#ow-consent-ok').onclick = function () { setConsent(true); el.remove() }
      el.querySelector('#ow-consent-no').onclick = function () { setConsent(false); el.remove() }
    }
    if (document.body) banner()
    else document.addEventListener('DOMContentLoaded', banner)
  }
})();
