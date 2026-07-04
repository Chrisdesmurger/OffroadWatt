---
name: offroadwatt-demo-gif
description: >-
  Generate demo GIFs / videos of the OffroadWatt calculator app by driving the
  REAL app in a headless browser (Playwright + Chromium), recording a scripted
  end-to-end session, and encoding it to MP4/WebM/GIF for both desktop and
  mobile (iPhone) formats. Use this skill whenever the user wants to create,
  improve, or re-record the landing-page demo clip, produce a marketing GIF of
  the app in action, show the app being used step by step, or automatically
  "test"/drive the app through a scenario (add appliances, pick a battery,
  configure solar/alternator, read the result). It also documents every
  selector, gotcha, and encoding recipe so a fresh session can reproduce or
  tweak the clip without rediscovering anything.
---

# OffroadWatt — demo GIF / video generator

This skill drives the **actual OffroadWatt app** (not a mockup) with Playwright,
captures a deterministic frame sequence, and encodes it. It is how the landing
hero demo (`landing/demo.webm` / `demo.mp4` / `demo-poster.png`) is produced,
and how to make ad-hoc GIFs of any scenario (desktop or iPhone-portrait).

The two ready-to-run helpers live next to this file:

- `scripts/record.mjs` — parameterized recorder (MODE=desktop|mobile). Edit the
  `SCENARIO` section for a new storyline.
- `scripts/encode.sh` — ffmpeg recipes (mp4 / webm / gif, hold + speed).

## 0. Golden rules (learned the hard way)

1. **Do NOT use Playwright's built-in `recordVideo`.** Its webm timeline gets
   warped by the app's render-blocking CDN CSS, producing a ~12 s blank white
   lead-in and a mangled timeline. Instead capture **one screenshot per
   micro-step** (the `snap()` approach) and assemble frames with ffmpeg. This
   gives exact pacing and zero blank frames.
2. **The APP records fine offline; the LANDING page does not.** The Vite app
   bundles `@supabase/supabase-js`, so `localhost:4173` renders with no network.
   The landing page (`landing/index.html`) loads Supabase from a **CDN
   `<script>`** which is blocked in the sandbox → the inline init script throws
   (`Cannot read properties of undefined (reading 'createClient')`) → every
   `.reveal` element stays `opacity:0` → blank hero in screenshots. To screenshot
   the landing locally, stub it (see §7). To record the *app demo*, no stub is
   needed.
3. **The Supabase catalog is unreachable in the sandbox** (ERR_CONNECTION_RESET).
   Always **mock** the `equipment_catalog` route (see §3) — this both fixes the
   sandbox AND lets you inject appliances with *exact* watts/hours so the totals
   match a target screenshot.
4. **ffmpeg**: the bundled Playwright ffmpeg (`/opt/pw-browsers/ffmpeg-*/`) only
   does webm/VP8. Install the full one: `apt-get install -y --no-install-recommends ffmpeg`
   (gives libx264 + gif). It's already used by `scripts/encode.sh`.

## 1. Environment setup

```bash
cd /home/user/OffroadWatt
node -e "require.resolve('playwright-core')" 2>/dev/null || npm install -D playwright-core
command -v ffmpeg >/dev/null || apt-get update && apt-get install -y --no-install-recommends ffmpeg
npm run build                      # produces dist/ (the app)
npm run preview -- --port 4173 --host 127.0.0.1 &   # serve the app at :4173
```

Chromium executable (do NOT run `playwright install`, it's preinstalled):
`/opt/pw-browsers/chromium-1194/chrome-linux/chrome` — launch with `--no-sandbox`.
(If the `chromium-1194` build number changed, `ls /opt/pw-browsers`.)

**Cleanup afterwards**: `git checkout -- package.json package-lock.json` (the
`playwright-core` dev-dep must not be committed) and remove any scratch dirs.

## 2. Recording model (frame-by-frame)

`scripts/record.mjs` opens the app, dismisses the onboarding wizard + cookie
banner, injects a fake cursor (desktop) or tap ripples (mobile), then runs a
`SCENARIO` where every mouse move / click / keystroke calls `snap()` to write a
numbered PNG (`fNNNNN.png`). Playback FPS is chosen at encode time, so pacing is
fully controllable. Viewports: desktop `1280×720`, mobile `390×844` (dSF 2,
`isMobile:true`).

Run:

```bash
MODE=desktop OUTDIR=.demo-tmp/seq_desktop node .claude/skills/offroadwatt-demo-gif/scripts/record.mjs
MODE=mobile  OUTDIR=.demo-tmp/seq_mobile  node .claude/skills/offroadwatt-demo-gif/scripts/record.mjs
```

## 3. Mocking the appliance catalog (exact values)

The catalog modal fetches `…/rest/v1/equipment_catalog?select=name,icon,watts,hours,category,brand`.
Intercept it and return your own list — the "add from catalog" flow then inserts
appliances with your exact watts/hours (so you can hit a target total, e.g.
134 Ah/j). Note the select has **no `modes` column**, so catalog-added items are
single-wattage (no mode buttons) — use the appliance's *effective* wattage.

```js
await p.route(/equipment_catalog/i, r => r.fulfill({
  status: 200, contentType: 'application/json',
  headers: { 'access-control-allow-origin': '*' },
  body: JSON.stringify([{ name:'Laptop', icon:'💻', watts:65, hours:4, category:'Tech', brand:'Dell' }, /* … */]),
}));
```

## 4. Key selectors & flows (verified)

| Goal | Selector / action |
|---|---|
| Skip onboarding wizard | `#wiz-skip` |
| Accept cookie banner | `text=Accept` |
| Empty the appliance list | loop: `while ($('.delbtn')) click it` (do it off-camera in setup) |
| Open catalog modal | `#open-catalog` (Custom entry: `#open-custom`) |
| A catalog item card (by name) | `.cin` with `hasText:'<name>'` (brand label = `.cib`) |
| Confirm catalog add | `getByText(/Add \d+ item/i)` |
| Battery type tabs | `.btf` `hasText:'AGM'|'Gel'|'Lithium'` |
| Battery model | `.bah` `hasText:'140Ah'` (AGM has **no 150 Ah**: 60/70/80/100/105/110/120/130/140/180/200) |
| Batteries in parallel | `.nb-btns` → `getByText('2', {exact:true})` |
| Depth-of-discharge slider | `#dod-range` |
| Alternator amps / hours | `#alt-amps` / `#alt-hours` (toggle `#alt-toggle`) |
| Solar panel wattage | `.spo` `hasText:'200'` (`.spo.on` = selected) |
| Solar nb panels / MPPT eff | `#sol-nb` / `#sol-eff` (toggle `#sol-toggle`) |
| Geographic zone | `select#sun-zone` (`selectOption({index})`) |
| Season | `text=Winter|Summer|Year` |
| Consumption-detail card | `.card` filtered by `hasText:'Total consumed'` |
| Vehicle type | header buttons `MOTORHOME` / `CARAVAN` / `VAN` |
| Language | `.lang-opt` `hasText:'FR'` (EN/ES/FR/DE/IT/PT) |
| Tabs | `.tab` (Dashboard / Appareils / Comparer) |

Number fields: click → `Control+A` → type char-by-char (fires the app's `input`
listeners) → `Tab`.

## 5. Zoom-on-a-card (for the "show the result" ending)

Center the card, dim the rest with a fixed backdrop, translate the card to the
viewport centre and scale it:

```js
await card.evaluate((el, vw) => {
  const bb = el.getBoundingClientRect();
  const dx = Math.round(vw/2 - (bb.x + bb.width/2));
  const bd = document.createElement('div');
  bd.style.cssText = 'position:fixed;inset:0;background:rgba(5,7,6,.62);z-index:55;opacity:0;transition:opacity .45s';
  document.body.appendChild(bd);
  el.style.transition='transform .5s ease'; el.style.zIndex='60'; el.style.position='relative';
  el.style.outline='2px solid var(--amber)'; el.style.borderRadius='14px';
  requestAnimationFrame(() => { bd.style.opacity='1'; el.style.transform=`translateX(${dx}px) scale(1.18)`; });
}, VIEWPORT_WIDTH);
```

Then capture a few frames. The long "hold N seconds" is added at **encode time**
with `tpad` (freeze the last frame) — never by capturing hundreds of identical
screenshots.

## 6. Encoding (`scripts/encode.sh`)

Design system colours to keep in mind: bg `#090b0a`, amber `#f0a030`, teal `#2dd4bf`.

```bash
# Landing video: snappier motion (input framerate) + short hold for a good loop
ffmpeg -framerate 38 -i "$SEQ/f%05d.png" \
  -vf "tpad=stop_mode=clone:stop_duration=6,scale=1280:720:flags=lanczos" \
  -c:v libx264 -crf 20 -preset slow -pix_fmt yuv420p -movflags +faststart demo.mp4
ffmpeg -framerate 38 -i "$SEQ/f%05d.png" \
  -vf "tpad=stop_mode=clone:stop_duration=6,scale=1280:720:flags=lanczos" \
  -c:v libvpx-vp9 -crf 34 -b:v 0 -pix_fmt yuv420p -deadline good -cpu-used 4 demo.webm

# GIF (shown to the user) — freeze the result e.g. 20s, downscale, palette-optimise
ffmpeg -framerate 30 -i "$SEQ/f%05d.png" -vf "tpad=stop_mode=clone:stop_duration=20" -c:v libx264 -crf 18 -pix_fmt yuv420p full.mp4
ffmpeg -i full.mp4 -vf "fps=12,scale=430:-1:flags=lanczos,palettegen=stats_mode=diff" pal.png
ffmpeg -i full.mp4 -i pal.png -lavfi "fps=12,scale=430:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3" demo.gif
```

Tune GIF size with `fps` (10–14), `scale` (400–500 px wide), and hold length.
Poster = the final zoom frame: `cp "$SEQ/$(ls "$SEQ" | tail -1)" demo-poster.png`.

## 7. Landing integration + local preview

The hero `<video>` in `landing/index.html` already points at `/demo.webm`,
`/demo.mp4`, `poster="/demo-poster.png"`. To update the clip, just overwrite
those three files in `landing/`. A `.demo-play` overlay auto-hides on the video's
`playing` event.

To **screenshot the landing locally** (CDN blocked → blank otherwise), stub
Supabase before load:

```js
await p.addInitScript(() => {
  const chain = new Proxy(function(){}, { get:(t,k)=> k==='then'?undefined
    : (['getSession','getUser'].includes(k) ? () => Promise.resolve({data:{session:null,user:null},error:null})
    : (k==='onAuthStateChange' ? () => ({data:{subscription:{unsubscribe(){}}}}) : () => chain)), apply:()=>chain });
  window.supabase = { createClient: () => chain };
});
```

## 8. Checklist for a new/updated demo

- [ ] `npm run build && npm run preview` on :4173.
- [ ] Edit the `SCENARIO` block in `scripts/record.mjs` (+ the mock `CATALOG`).
- [ ] Record desktop and (if asked) mobile sequences.
- [ ] Spot-check `f00000.png` (start) and the last frame (result) with Read.
- [ ] Encode; verify durations & sizes; poster = final frame.
- [ ] Copy desktop assets into `landing/`; keep the GIF for the user.
- [ ] `git checkout -- package.json package-lock.json`; remove scratch dirs.
