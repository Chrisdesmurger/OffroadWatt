# OffroadWatt — Brand & visual system

Single source of truth for every visual (site, app, blog, social, Canva, ads).
**Goal: visual coherence across all platforms.** Derived from the live vitrine
(`landing/index.html`) and the app — these are the real, in-use tokens.

## Logo / wordmark
- Wordmark: **Offroad**`Watt` — "Offroad" in amber (`#f0a030`), "Watt" in muted green-grey (`#4a6455`).
- Mark / motif: lightning bolt (Tabler `ti-bolt`). Use as the recurring brand symbol.
- Always on a dark background. Keep clear space ≈ the height of the "O" around it.

## Color palette
| Role | Hex | Usage |
|------|-----|-------|
| Background (primary) | `#090b0a` | Main canvas — almost-black charcoal |
| Background 2 / cards | `#0f1310` / `#141a16` | Panels, cards |
| Border | `#1e2820` / `#2a3830` | Hairlines, dividers |
| **Amber (primary accent)** | `#f0a030` (hover `#e08820`) | Headlines highlight, CTAs, logo "Offroad", energy |
| **Teal (secondary accent)** | `#2dd4bf` (deep `#0f9985`) | Solar, secondary highlights, badges |
| Green (success) | `#4ade80` | "all good" / positive states only |
| Text high | `#ddeedd` | Headlines & body on dark |
| Text mid | `#7a9985` | Sub-text |
| Text low | `#4a6455` | Captions, logo "Watt", muted |

**Rule:** dark charcoal base, amber as the hero accent, teal as the support accent.
Never put the brand on a white/light background for primary marketing visuals.

## Typography
- **Space Mono** (700/400) — headings, numbers, labels, eyebrows, anything "technical/precise".
- **DM Sans** (400–700) — body copy, descriptions, UI.
- Tight letter-spacing on big headlines (≈ -0.5px). Eyebrows: uppercase, mono, letter-spacing ~1.5px.

## Voice & aesthetic
- Practical, expert, reassuring. No hype. "Plan. Optimize. Travel."
- Theme: off-grid / van-life / overlanding — campervans, vans, caravans; solar panels,
  leisure batteries, lightning/energy, MPPT, mountains & open road at dusk.
- Editorial and clean, high contrast, lots of dark negative space. Avoid clutter and clip-art.

## Canva
- Brand kit id: _see `marketing/BRAND.canva.json` (auto-written by the pipeline if a kit exists)._
  If a brand kit is available, ALWAYS pass its `brand_kit_id` to `generate-design`.
- If no brand kit exists, every Canva `query` MUST embed: the hex palette above, the
  Space Mono + DM Sans fonts, the dark-charcoal/amber/teal look, the OffroadWatt wordmark,
  and the van-life motif — so output stays on-brand without a kit.

## Per-platform sizes (export targets)
| Asset | Size | Notes |
|-------|------|-------|
| Blog hero / `og:image` | 1280×720 (16:9) | Also used for Open Graph & Twitter card |
| Instagram post | 1080×1350 (4:5) | Feed |
| Instagram / FB story | 1080×1920 (9:16) | Stories/Reels cover |
| Facebook post | 1080×1080 (1:1) | Feed |
| X / Twitter | 1200×675 (16:9) | Link card |

## Consistency checklist (every new visual)
- [ ] Dark charcoal `#090b0a` base
- [ ] Amber `#f0a030` primary accent + teal `#2dd4bf` support accent
- [ ] OffroadWatt wordmark present, bottom or top
- [ ] Space Mono headline / DM Sans body feel
- [ ] Real URL `app.offroadwatt.com` (never Canva's `reallygreatsite.com` placeholder)
- [ ] Van-life / battery / solar / lightning motif
- [ ] Same headline & key message as the article it promotes
