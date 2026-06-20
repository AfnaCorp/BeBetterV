// Génère les icônes PWA (192, 512, maskable 512) à partir d'un SVG inline.
// Logo haltère blanc sur dégradé orange→violet, aligné sur la marque BeBetter.
// Lancer : node scripts/gen-icons.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

// `radius` = rayon des coins (0 = pleine surface, pour le maskable).
function svg(radius) {
  return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff8a3d"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${radius}" fill="url(#g)"/>
  <g fill="#ffffff">
    <!-- barre centrale -->
    <rect x="170" y="238" width="172" height="36" rx="18"/>
    <!-- poids gauche -->
    <rect x="120" y="196" width="34" height="120" rx="14"/>
    <rect x="86" y="214" width="30" height="84" rx="12"/>
    <!-- poids droite -->
    <rect x="358" y="196" width="34" height="120" rx="14"/>
    <rect x="396" y="214" width="30" height="84" rx="12"/>
  </g>
</svg>`;
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const rounded = Buffer.from(svg(112)); // coins arrondis pour l'icône "any"
  const full = Buffer.from(svg(0)); // pleine surface pour le "maskable" (safe area)

  await sharp(rounded).resize(192, 192).png().toFile(join(outDir, "icon-192.png"));
  await sharp(rounded).resize(512, 512).png().toFile(join(outDir, "icon-512.png"));
  await sharp(full).resize(512, 512).png().toFile(join(outDir, "icon-maskable-512.png"));
  console.log("Icônes générées dans public/icons/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
