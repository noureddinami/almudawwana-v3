import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const iconSvg = readFileSync(join(publicDir, 'icon.svg'));

const sizes = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'icon-maskable.png', size: 512 },
];

for (const { name, size } of sizes) {
  await sharp(iconSvg)
    .resize(size, size)
    .png()
    .toFile(join(publicDir, name));
  console.log(`Generated ${name} (${size}x${size})`);
}

// Apple touch icon (180x180)
await sharp(iconSvg)
  .resize(180, 180)
  .png()
  .toFile(join(publicDir, 'apple-touch-icon.png'));
console.log('Generated apple-touch-icon.png (180x180)');

console.log('Done!');
