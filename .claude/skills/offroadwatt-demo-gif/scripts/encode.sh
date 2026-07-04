#!/usr/bin/env bash
# OffroadWatt demo encoder — turns a PNG frame sequence (from record.mjs) into
# landing videos (mp4/webm), a poster, and a downscaled GIF.
#
#   bash encode.sh <SEQ_DIR> <OUT_PREFIX> [MODE] [HOLD_SECONDS]
#     SEQ_DIR      dir of f%05d.png frames (e.g. .demo-tmp/seq_desktop)
#     OUT_PREFIX   output path prefix    (e.g. .demo-tmp/demo  ->  demo.mp4/.webm/.gif/-poster.png)
#     MODE         desktop (default) | mobile
#     HOLD_SECONDS freeze on the final frame (default 6 for desktop, 20 for mobile)
#
# Needs full ffmpeg: apt-get install -y --no-install-recommends ffmpeg
set -euo pipefail

SEQ="${1:?seq dir}"; OUT="${2:?out prefix}"; MODE="${3:-desktop}"; HOLD="${4:-}"
IN="$SEQ/f%05d.png"
LAST="$SEQ/$(ls "$SEQ" | tail -1)"

if [ "$MODE" = "mobile" ]; then
  HOLD="${HOLD:-20}"; GIF_W=430; GIF_FPS=12; FRATE=22
else
  HOLD="${HOLD:-6}";  GIF_W=760; GIF_FPS=14; FRATE=28
fi

# ── Landing videos (desktop) ────────────────────────────────────────────────
if [ "$MODE" != "mobile" ]; then
  ffmpeg -v error -framerate "$FRATE" -i "$IN" \
    -vf "tpad=stop_mode=clone:stop_duration=${HOLD},scale=1280:720:flags=lanczos" \
    -c:v libx264 -crf 20 -preset slow -pix_fmt yuv420p -movflags +faststart "${OUT}.mp4" -y
  ffmpeg -v error -framerate "$FRATE" -i "$IN" \
    -vf "tpad=stop_mode=clone:stop_duration=${HOLD},scale=1280:720:flags=lanczos" \
    -c:v libvpx-vp9 -crf 34 -b:v 0 -pix_fmt yuv420p -deadline good -cpu-used 4 "${OUT}.webm" -y
fi

# ── GIF (any mode) — freeze final frame HOLD seconds, downscale, palette ─────
ffmpeg -v error -framerate "$FRATE" -i "$IN" -vf "tpad=stop_mode=clone:stop_duration=${HOLD}" \
  -c:v libx264 -crf 18 -pix_fmt yuv420p "${OUT}.full.mp4" -y
ffmpeg -v error -i "${OUT}.full.mp4" \
  -vf "fps=${GIF_FPS},scale=${GIF_W}:-1:flags=lanczos,palettegen=stats_mode=diff" "${OUT}.pal.png" -y
ffmpeg -v error -i "${OUT}.full.mp4" -i "${OUT}.pal.png" \
  -lavfi "fps=${GIF_FPS},scale=${GIF_W}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3" "${OUT}.gif" -y
rm -f "${OUT}.full.mp4" "${OUT}.pal.png"

# ── Poster (final frame) ─────────────────────────────────────────────────────
cp "$LAST" "${OUT}-poster.png"

echo "== outputs =="; ls -la "${OUT}".* "${OUT}-poster.png" 2>/dev/null | awk '{print $5, $9}'
