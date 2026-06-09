# Routine blog SEO — OffroadWatt (Claude Desktop)

Copie-colle ce texte dans Claude Desktop pour lancer une publication complète.

---

## Texte de la routine

```
Publie le prochain article de blog SEO pour le site vitrine OffroadWatt (prends le premier sujet non coché dans marketing/TOPICS.md). Suis exactement ces étapes :

1. ARTICLE (EN + FR + ES)
   - Rédige l'article EN complet avec toutes les best practices SEO on-page.
   - Traduis en FR et ES (contenu adapté, pas juste traduit).
   - Ajoute canonical, 4 hreflang (en/fr/es + x-default), og:image, twitter:card, JSON-LD Article + BreadcrumbList + FAQPage.
   - ⚠️ IMPORTANT : N'intègre PAS d'image <img> dans le corps de l'article. Le hero reste uniquement dans le <head> (og:image), dans la card du hub et dans les visuels sociaux — jamais dans le <article> de la page vitrine.
   - Ajoute l'article dans landing/blog/index.html (POSTS) et dans sitemap.xml.
   - Coche le sujet dans marketing/TOPICS.md.

2. AUDIT SEO
   - Lance node scripts/seo-audit.mjs et corrige jusqu'à ALL GREEN.

3. VISUELS CANVA
   - Utilise toujours le brand kit OffroadWatt (kAHL9oO58mY).
   - Génère 4 candidats pour chaque format : hero (1280×720), Instagram (1080×1350), Facebook (1080×1080).
   - ⚠️ AVANT de choisir : envoie les vignettes des 4 candidats sur Slack pour chaque format et demande-moi lequel je préfère. Attends ma réponse avant de continuer.
   - Convertis le candidat choisi, déplace dans un dossier Canva dédié, exporte en PNG aux bonnes dimensions.
   - Committe les PNG dans le repo (landing/blog/assets/ et marketing/social/).

4. COPY SOCIALE (prêt à copier-coller)
   - Rédige les textes Instagram + Facebook en EN/FR/ES avec URLs et hashtags.
   - Consigne tout dans marketing/<slug>.md.

5. GOOGLE DRIVE (si connecteur actif)
   - Crée un dossier Drive "OffroadWatt — [Titre article]".
   - Upload les 3 PNG dans ce dossier et partage le lien dans le récap.

6. COMMIT & PR
   - Committe tous les fichiers et pousse sur la branche de développement.
   - Ouvre ou mets à jour la PR GitHub.
```

---

## Notes importantes

- **Hero dans l'article** : l'image hero ne doit JAMAIS apparaître dans le `<article>` de la page vitrine. Elle est réservée à `og:image`, aux cards du hub et aux posts sociaux.
- **Slack avant Canva** : toujours présenter les 4 candidats Canva sur Slack et attendre le choix avant de finaliser. Ne pas choisir automatiquement.
- **Brand kit Canva** : `kAHL9oO58mY` (OffroadWatt) — voir `marketing/BRAND.canva.json`.
- **Google Drive** : nécessite une nouvelle session Claude Code si le connecteur vient d'être ajouté.
