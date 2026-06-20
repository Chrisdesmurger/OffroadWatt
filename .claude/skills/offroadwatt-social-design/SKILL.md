---
name: offroadwatt-social-design
description: >-
  Create OffroadWatt blog hero + social media images in the off-road house
  style, always FEATURING a real photo of the device the article is about (a
  battery, MPPT/solar controller, DC-DC charger, inverter, etc.). Use this
  skill whenever the user wants visuals/images/artwork/og:image/thumbnails or
  Instagram/Facebook/X/story graphics for an OffroadWatt blog article or
  marketing post, OR mentions making a Canva design for the blog — even if they
  only say "make an image for the latest article" without naming a format. The
  core idea the user cares about: identify the highlighted device, find a real
  product image of it online, and put it front-and-center on the dark
  charcoal/amber/teal van-life design.
---

# OffroadWatt — blog & social visual designer

This skill turns a blog article into a coherent set of on-brand visuals. The
non-negotiable creative rule, and the thing the user repeats: **every visual
features a real photo of the single device the article is about**, placed
prominently on the dark off-road design. If the article is about batteries,
show a real battery; about MPPT controllers, show a real MPPT controller.

The full visual system (palette, fonts, sizes, checklist) lives in
`marketing/BRAND.md` — treat it as the source of truth. Key tokens: charcoal
`#090b0a` base, amber `#f0a030` primary accent, teal `#2dd4bf` support accent,
Space Mono headings + DM Sans body, OffroadWatt wordmark, `app.offroadwatt.com`.

## Workflow

### 1. Identify the highlighted device

Read the article (or the topic in `marketing/TOPICS.md`) and name the **one**
device it centers on. Articles compare or explain things, but there is almost
always a single hero object that reads instantly at thumbnail size. Examples:

| Article topic | Hero device to show |
|---|---|
| MPPT vs PWM solar controller | an MPPT solar charge controller (e.g. Victron SmartSolar) |
| AGM vs GEL vs Lithium | a leisure battery |
| DC-DC / B2B alternator charger | a DC-DC charger |
| What size inverter | an inverter |
| How many solar panels | a solar panel |

Pick the most iconic, recognizable real product for that category — a unit a
van-lifer would know on sight reads as credible and expert.

### 2. Find a real product image

Search the web and download a clean product shot. Strongly prefer:

- **A transparent PNG** (alpha channel) so it drops onto the dark background
  cleanly. Manufacturer sites (e.g. `victronenergy.com/upload/...`) often serve
  high-res transparent PNGs — the best source.
- A straight-on or slight 3/4 angle, well-lit, no busy background, no watermark.

Process it with `sharp` (already a dev dependency): trim the transparent edges
and resize to ~1100px wide so it stays crisp but light:

```js
require('sharp')(input).trim({ threshold: 10 })
  .resize({ width: 1100, withoutEnlargement: true }).png().toFile(output);
```

Save the processed file into the article folder at
`marketing/social/<slug>/_src/<name>.png` and commit it — keeping the source
asset in the repo is what makes regeneration reproducible. If you can't find a
transparent PNG, a clean white-background shot also works (the design's dark
gradient and glow hide hard edges reasonably well), but transparent is better.

### 3. Generate every format in one run

All layouts are produced by a single config-driven script so the output stays
identical and reproducible across articles. Write a config and run it:

1. Create `marketing/social/<slug>/visuals.config.json` (copy the MPPT one as a
   template — see `marketing/social/mppt-vs-pwm/visuals.config.json`). Fields:
   `slug`, `product`, `heroBase`, `socialDir`, and per-language `eyebrow`,
   `tag`, `title` (EN/FR/ES). Titles use `\n` for line breaks; keep 3 short
   lines so the green panel stays compact. HTML entities like `&middot;` and
   `&middot;` are fine in eyebrow/tag.
2. Run it (installs once, then generates):

```bash
npm install >/dev/null 2>&1
npm install --no-save puppeteer-core >/dev/null 2>&1   # uses the sandbox Chromium
node .claude/skills/offroadwatt-social-design/scripts/generate-visuals.mjs \
  marketing/social/<slug>/visuals.config.json
```

The script needs a Chromium binary. It defaults to the Playwright path
(`/opt/pw-browsers/chromium-*/chrome-linux/chrome`); override with
`CHROME_PATH=/path/to/chrome` if needed.

Outputs per article:

| File | Size | Use |
|---|---|---|
| `landing/blog/assets/<slug>-hero{,-fr,-es}.png` | 1280×720 | Blog hero + `og:image` (EN/FR/ES) |
| `marketing/social/<slug>/og-1280x720.png` | 1280×720 | Open Graph / Twitter card |
| `marketing/social/<slug>/x-1200x675.png` | 1200×675 | X / Twitter link card |
| `marketing/social/<slug>/instagram-1080x1350.png` | 1080×1350 | Instagram feed (4:5) |
| `marketing/social/<slug>/story-1080x1920.png` | 1080×1920 | IG / FB story (9:16) |

### 4. Review before committing

Always look at the result, don't just trust the run. Generate small previews
with `sharp` and inspect them (Read the PNG). Check: device readable at small
size, headline not colliding with the product, wordmark legible, nothing
clipped. The horizontal layout puts the headline left / product right; the
vertical layouts put the headline top / product centered below. Tweak the
config (titles, eyebrow) and re-run; tweak the script's layout percentages only
if a format genuinely needs it.

## Design rules (why the layout is the way it is)

- **Dark negative space sells the product.** The left gradient (horizontal) and
  top/bottom fades (vertical) anchor text and let the device float on charcoal.
- **Green panel for the headline** is the established house style across the
  existing heroes — keep it for series consistency, not because green is a
  brand color (amber/teal are). White Space Mono on `#4abe4f` reads strongly.
- **Teal glow behind the device** ties to the "solar/energy" support accent and
  separates the product from the background without a hard cutout edge.
- **No floating geometric blocks.** Earlier heroes had small green rectangles
  bottom-right; they clipped the product, so this skill omits them.
- Amber is reserved for the accent line, the tag, and the "Offroad" wordmark —
  small, high-value hits, never large fills.

## Optional: editable Canva version

When the user wants something they can hand-edit, also make a Canva design via
the Canva MCP tools:

1. `upload-asset-from-url` with the real product image URL → asset id.
2. `list-brand-kits` → use the **OffroadWatt** kit id so fonts/colors are on
   brand.
3. `generate-design` (e.g. `design_type: instagram_post` or `your_story`) with
   `asset_ids: [<asset>]`, the brand kit, and a query describing this exact
   layout (charcoal bg, teal eyebrow, green headline panel, product on a teal
   glow, amber tag + wordmark, `app.offroadwatt.com`). It returns candidates.
4. `create-design-from-candidate` to make one editable, `create-folder` +
   `move-item-to-folder` to keep all of an article's designs together, and
   `export-design` (PNG) to preview. Give the user the `edit_url`.

Canva's generator is creative and won't match the script pixel-for-pixel (it
may rewrite the headline) — that's fine; it's a starting point the user refines
in Canva. The script outputs are the deterministic, ship-ready assets.

## Folder convention

Everything for one article lives together:

```
marketing/social/<slug>/
├── _src/<device>.png          # processed real product image (committed)
├── visuals.config.json        # inputs for the generator
├── og-1280x720.png
├── x-1200x675.png
├── instagram-1080x1350.png
└── story-1080x1920.png
landing/blog/assets/<slug>-hero{,-fr,-es}.png   # blog heroes (referenced by the HTML)
```
