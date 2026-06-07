# OffroadWatt — Roadmap & Tâches

> **La gestion de projet est maintenant sur GitHub Issues.**
> Ce fichier est conservé comme référence rapide. Pour le détail complet, voir :
> 👉 [Issue #29 — ROADMAP complète](https://github.com/Chrisdesmurger/OffroadWatt/issues/29)
> 👉 [Toutes les issues ouvertes](https://github.com/Chrisdesmurger/OffroadWatt/issues)

---

## 🔴 Phase 1 — Revenue & Quick Wins (J+0 à J+60)

- [ ] [#9](https://github.com/Chrisdesmurger/OffroadWatt/issues/9) 💳 Stripe — paiement plan Pro (~4,99€/mois)
- [ ] [#10](https://github.com/Chrisdesmurger/OffroadWatt/issues/10) 🔗 Liens affiliés — Batteries (Amazon Associates)
- [ ] [#11](https://github.com/Chrisdesmurger/OffroadWatt/issues/11) 🔗 Liens affiliés — Panneaux solaires + MPPT
- [ ] [#12](https://github.com/Chrisdesmurger/OffroadWatt/issues/12) 🚐 `vtype` actif — presets selon camping-car / van / caravane
- [ ] [#13](https://github.com/Chrisdesmurger/OffroadWatt/issues/13) 🔗 Partage de configuration — URL avec state encodé en base64
- [ ] [#14](https://github.com/Chrisdesmurger/OffroadWatt/issues/14) 📧 Templates email multilingues — magic link EN/ES
- [ ] [#22](https://github.com/Chrisdesmurger/OffroadWatt/issues/22) 🔍 Bing Webmaster Tools — soumettre le sitemap
- [ ] [#23](https://github.com/Chrisdesmurger/OffroadWatt/issues/23) 📣 Posts dans les communautés ciblées (Reddit, forums, Facebook)

---

## 🟡 Phase 2 — Croissance (J+60 à J+120)

- [ ] [#15](https://github.com/Chrisdesmurger/OffroadWatt/issues/15) 🔒 Rate limit IA server-side (Supabase Edge Function)
- [ ] [#16](https://github.com/Chrisdesmurger/OffroadWatt/issues/16) 📱 PWA — installable mobile (vite-plugin-pwa)
- [ ] [#17](https://github.com/Chrisdesmurger/OffroadWatt/issues/17) 🧙 Wizard d'onboarding première visite
- [ ] [#18](https://github.com/Chrisdesmurger/OffroadWatt/issues/18) 📊 Graphiques — donut chart + courbe décharge
- [ ] [#19](https://github.com/Chrisdesmurger/OffroadWatt/issues/19) 🎯 Présets de scénarios (Weekend / Nomade / Hivernal)
- [ ] [#20](https://github.com/Chrisdesmurger/OffroadWatt/issues/20) 🛒 Liste de courses générée depuis la configuration
- [ ] [#21](https://github.com/Chrisdesmurger/OffroadWatt/issues/21) 📈 Configurer Google Analytics / Plausible
- [ ] [#24](https://github.com/Chrisdesmurger/OffroadWatt/issues/24) 🚀 Lancement Product Hunt (créer page, planifier la date)
- [ ] [#25](https://github.com/Chrisdesmurger/OffroadWatt/issues/25) 🎥 Vidéo démo 60s (YouTube / TikTok / Reels)
- [ ] [#30](https://github.com/Chrisdesmurger/OffroadWatt/issues/30) 📂 Lister l'app sur AlternativeTo.net
- [ ] [#31](https://github.com/Chrisdesmurger/OffroadWatt/issues/31) 📂 Lister sur BetaList

---

## 🟢 Phase 3 — SEO organique & Scalabilité (J+120+)

- [ ] [#26](https://github.com/Chrisdesmurger/OffroadWatt/issues/26) 📝 Article : "Guide complet autonomie électrique camping-car 2025"
- [ ] [#32](https://github.com/Chrisdesmurger/OffroadWatt/issues/32) 📝 Article : "Batterie AGM vs Lithium : quel choix pour votre van ?"
- [ ] [#33](https://github.com/Chrisdesmurger/OffroadWatt/issues/33) 📝 Article : "Combien de panneaux solaires pour un camping-car ?"
- [ ] [#27](https://github.com/Chrisdesmurger/OffroadWatt/issues/27) 🔧 Migration React + TypeScript
- [ ] [#28](https://github.com/Chrisdesmurger/OffroadWatt/issues/28) 📡 Monitoring BLE Victron Connect (long terme)

---

## ✅ Complété

- [x] Google Search Console — sitemap soumis (`https://www.offroadwatt.com/sitemap.xml`)
- [x] Section FAQ sur le site vitrine (FR/EN/ES, questions à fort volume)
- [x] Ajouter FAQ à la nav du site vitrine (ancre `#faq`)
- [x] Vérifier domaine `offroadwatt.com` dans Resend (DNS SPF/DKIM)
- [x] Barre d'autonomie mobile sticky (temps réel)
- [x] Comparateur sans coûts
- [x] Export email récapitulatif (Resend)
- [x] Auth Supabase (Magic Link + Google OAuth)
- [x] Sauvegarde / chargement de configurations
- [x] Ajouter `RESEND_API_KEY` dans Vercel (env var)
- [x] Configurer SMTP custom Supabase (noreply@offroadwatt.com)
- [x] Template email récapitulatif — design + i18n (FR/EN/ES)
- [x] Template email magic link — design OffroadWatt (FR)
- [x] Déploiement Vercel — `app.offroadwatt.com`
- [x] Site vitrine — `www.offroadwatt.com`
- [x] Supabase Auth configuré (Redirect URLs)
- [x] Email personnalisé Resend (config Supabase SMTP — manuel)
