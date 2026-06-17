/**
 * Generate PWA icon PNGs from the SVG source.
 *
 * Usage:  node scripts/gen-icons.js
 *
 * Requires: sharp (npm install --save-dev sharp)
 * Input:    public/icon.svg
 * Output:   public/icon-192.png, public/icon-512.png
 */

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const svgPath = resolve(root, 'public/icon.svg');
const svg = readFileSync(svgPath);

const sizes = [192, 512];

for (const size of sizes) {
  const outPath = resolve(root, `public/icon-${size}.png`);
  await sharp(svg, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`Created ${outPath}  (${size}x${size})`);
}

console.log('Done.');
