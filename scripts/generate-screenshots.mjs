import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotsDir = join(__dirname, '..', 'public', 'screenshots');

async function convertSvgToPng(svgFile, outputFile, width, height) {
  const svgPath = join(screenshotsDir, svgFile);
  const outputPath = join(screenshotsDir, outputFile);

  const svg = readFileSync(svgPath);
  await sharp(svg)
    .resize(width, height, { fit: 'fill', background: { r: 248, g: 250, b: 252, alpha: 1 } })
    .png()
    .toFile(outputPath);

  console.log(`✓ Created ${outputFile} (${width}x${height})`);
}

async function main() {
  try {
    await convertSvgToPng('home-desktop.svg', 'home-desktop.png', 1280, 720);
    await convertSvgToPng('home-mobile.svg', 'home-mobile.png', 750, 1334);
    console.log('Done! PWA screenshots generated.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
