# OffroadWatt — Roadmap & Tâches

## 🚀 Trafic gratuit (SEO & Communauté)

### Court terme
- [x] Google Search Console — sitemap soumis (`https://www.offroadwatt.com/sitemap.xml`)
- [x] Section FAQ sur le site vitrine (FR/EN/ES, questions à fort volume)
- [ ] Bing Webmaster Tools — soumettre le sitemap
- [ ] Vérifier domaine `offroadwatt.com` dans Resend (DNS SPF/DKIM)
- [ ] Posts dans les communautés ciblées :
  - [ ] Reddit : r/vandwellers, r/overlanding, r/campervans
  - [ ] Forums francophones : caravaning.fr, campingcar-infos.com
  - [ ] Groupes Facebook "Aménagement van / camping-car"

### Moyen terme
- [ ] Lancement Product Hunt (créer page, planifier la date)
- [ ] Lister l'app sur AlternativeTo.net
- [ ] Lister sur BetaList
- [ ] Vidéo démo 60s (YouTube / TikTok / Reels)
- [ ] Ajouter FAQ à la nav du site vitrine (ancre `#faq`)

### Long terme (SEO organique)
- [ ] Article : "Guide complet autonomie électrique camping-car 2025"
- [ ] Article : "Batterie AGM vs Lithium : quel choix pour votre van ?"
- [ ] Article : "Combien de panneaux solaires pour un camping-car ?"
- [ ] Configurer Google Analytics / Plausible

---

## ⚙️ Fonctionnalités produit

### Court terme
- [x] Barre d'autonomie mobile sticky (temps réel)
- [x] Comparateur sans coûts
- [x] Export email récapitulatif (Resend)
- [x] Auth Supabase (Magic Link + Google OAuth)
- [x] Sauvegarde / chargement de configurations
- [ ] Ajouter `RESEND_API_KEY` dans Vercel (env var)
- [ ] Configurer SMTP custom Supabase (noreply@offroadwatt.com)
- [ ] Stripe — paiement plan Pro (~4,99€/mois)

### Moyen terme
- [ ] `vtype` actif — ajuster presets selon camping-car / van / caravane
- [ ] Partage de configuration — URL avec state encodé en base64
- [ ] Rate limit IA server-side (Supabase Edge Function)
- [ ] PWA — installable mobile (vite-plugin-pwa)

---

## 🔧 Infrastructure
- [x] Déploiement Vercel — `app.offroadwatt.com`
- [x] Site vitrine — `www.offroadwatt.com`
- [x] Supabase Auth configuré (Redirect URLs)
- [x] Email personnalisé Resend (config Supabase SMTP — manuel)
- [ ] Monitoring BLE Victron Connect (long terme)
