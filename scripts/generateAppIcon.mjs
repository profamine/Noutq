// One-off script to rasterize the Noutq app icon (from the Claude Design
// handoff) into the Android launcher assets and web favicons.
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";

const BG = "#F8F5EE"; // oklch(0.97 0.01 85)
const FG = "#006465"; // oklch(0.45 0.09 195)

const glyph = `
    <circle cx="310" cy="120" r="26" fill="${FG}"/>
    <path d="M 130 300 C 130 430 230 500 340 500 C 430 500 480 440 480 380" fill="none" stroke="${FG}" stroke-width="54" stroke-linecap="round"/>
    <path d="M 500 250 A 150 150 0 0 1 500 460" fill="none" stroke="${FG}" stroke-width="30" stroke-linecap="round" opacity="0.85"/>
    <path d="M 560 285 A 100 100 0 0 1 560 425" fill="none" stroke="${FG}" stroke-width="26" stroke-linecap="round" opacity="0.55"/>
`;

// Full square icon: cream rounded-square background + glyph (matches the
// Claude Design mockup 1:1 — 1024 canvas, 620 glyph centered, rx 224).
const fullSquareSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" rx="224" ry="224" fill="${BG}"/>
  <g transform="translate(202,202)">${glyph}</g>
</svg>`;

// Round variant: same design, clipped to a circle (legacy pre-adaptive-icon
// round launcher icons).
const fullRoundSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs><clipPath id="c"><circle cx="512" cy="512" r="512"/></clipPath></defs>
  <g clip-path="url(#c)">
    <rect width="1024" height="1024" fill="${BG}"/>
    <g transform="translate(202,202)">${glyph}</g>
  </g>
</svg>`;

// Foreground-only layer (transparent bg) for the Android adaptive icon,
// same relative scale/position as the full design so it sits in the safe zone.
const foregroundSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <g transform="translate(202,202)">${glyph}</g>
</svg>`;

const androidRes = "android/app/src/main/res";
const legacySizes = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
const foregroundSizes = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };

async function render(svg, size, outPath) {
  mkdirSync(path.dirname(outPath), { recursive: true });
  await sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log("wrote", outPath, `${size}x${size}`);
}

const tasks = [];
for (const [dpi, size] of Object.entries(legacySizes)) {
  tasks.push(render(fullSquareSvg, size, `${androidRes}/mipmap-${dpi}/ic_launcher.png`));
  tasks.push(render(fullRoundSvg, size, `${androidRes}/mipmap-${dpi}/ic_launcher_round.png`));
}
for (const [dpi, size] of Object.entries(foregroundSizes)) {
  tasks.push(render(foregroundSvg, size, `${androidRes}/mipmap-${dpi}/ic_launcher_foreground.png`));
}

// Web favicons
tasks.push(render(fullSquareSvg, 512, "public/icon-512.png"));
tasks.push(render(fullSquareSvg, 192, "public/icon-192.png"));
tasks.push(render(fullSquareSvg, 180, "public/apple-touch-icon.png"));
tasks.push(render(fullSquareSvg, 32, "public/favicon-32.png"));
tasks.push(render(fullSquareSvg, 16, "public/favicon-16.png"));

writeFileSync("public/favicon.svg", fullSquareSvg.trim() + "\n");
console.log("wrote public/favicon.svg");

await Promise.all(tasks);
console.log("done");
