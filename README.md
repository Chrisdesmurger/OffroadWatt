# ⚡ OffroadWatt

**Calculateur d'autonomie électrique pour camping-car, caravane et van.**

Planifiez votre installation électrique : batteries, panneaux solaires, appareils consommateurs — tout en un.

## Fonctionnalités

- 🔌 **Gestion des appareils** — catalogue de 30+ équipements, filtres par catégorie, activation/désactivation
- 🔋 **Batteries en parallèle** — de 1 à 10 batteries, AGM / GEL / LiPo, calcul Wh exact (Ah × V)
- ☀️ **Panneaux solaires** — 40+ zones géographiques mondiales, rendement MPPT configurable
- 📊 **Bilan énergétique** — déficit journalier, couverture solaire, autonomie en jours
- 🤖 **Recherche IA** — trouve les caractéristiques réelles des équipements du marché

## Déploiement

Ce projet est une application HTML/JS statique, sans dépendances à installer.

### Vercel (recommandé)

1. Connectez votre repo GitHub à [vercel.com](https://vercel.com)
2. Importez le projet — Vercel détecte automatiquement le fichier `index.html`
3. Déployez — l'URL sera disponible en ~2 minutes

### Configuration de la clé API Anthropic (optionnel)

Pour activer la recherche IA, modifiez la variable dans `index.html` :

```js
const API_KEY = 'sk-ant-api03-...';
```

> ⚠️ En production, utilisez une API Route serverless pour ne pas exposer la clé.

## Stack

- HTML / CSS / Vanilla JS (aucune dépendance)
- Polices : Google Fonts (Space Mono + DM Sans)
- Icônes : Tabler Icons
- IA : Anthropic Claude API (optionnel)

## Roadmap

Voir l'onglet **Déploiement** dans l'application pour le plan de développement complet vers une app React + Supabase + Vercel.

---

*Construit avec ❤️ pour les nomades et les passionnés de van life.*
