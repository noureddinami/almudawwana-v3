/**
 * Generates /public/og-image.png (1200x630) from the logo system SVG design
 * Run: node generate-og-image.mjs
 */
import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));

const LOGO_PATHS = `
  <path d="M28 68 L28 132 L70 162 L70 38 Z" fill="rgba(255,255,255,0.2)"/>
  <path d="M172 68 L172 132 L130 162 L130 38 Z" fill="rgba(255,255,255,0.2)"/>
  <path d="M28 68 L70 38 L100 22 L70 38 Z" fill="rgba(255,255,255,0.2)"/>
  <path d="M172 68 L130 38 L100 22 L130 38 Z" fill="rgba(255,255,255,0.2)"/>
  <path d="M28 132 L70 162 L100 178 L70 162 Z" fill="rgba(255,255,255,0.2)"/>
  <path d="M172 132 L130 162 L100 178 L130 162 Z" fill="rgba(255,255,255,0.2)"/>
  <path d="M70 36 L100 20 L130 36 L130 164 L100 180 L70 164 Z" fill="rgba(255,255,255,0.32)"/>
  <ellipse cx="100" cy="152" rx="13" ry="4.5" fill="white" opacity="0.9"/>
  <rect x="98" y="72" width="4" height="80" rx="2" fill="white"/>
  <ellipse cx="100" cy="72" rx="4.5" ry="3" fill="white"/>
  <path d="M96.5 72 Q100 63 103.5 72" fill="white"/>
  <path d="M50 94 Q100 87 150 94" stroke="white" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  <circle cx="54" cy="94" r="3.5" fill="white"/>
  <circle cx="146" cy="94" r="3.5" fill="white"/>
  <line x1="54" y1="97" x2="48" y2="116" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
  <line x1="66" y1="97" x2="72" y2="116" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M46 116 Q59 112 74 116" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M46 116 Q59 128 74 116" stroke="white" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.5"/>
  <line x1="146" y1="97" x2="140" y2="116" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
  <line x1="134" y1="97" x2="128" y2="116" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M126 116 Q139 112 154 116" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M126 116 Q139 128 154 116" stroke="white" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.5"/>
`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0d2260"/>
      <stop offset="50%" stop-color="#2152cc"/>
      <stop offset="100%" stop-color="#1a3fa0"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#grad)"/>

  <!-- Watermark logo (large, faded) -->
  <g transform="translate(780,140) scale(3.2)" opacity="0.07">
    <path d="M28 68 L28 132 L70 162 L70 38 Z" fill="white"/>
    <path d="M172 68 L172 132 L130 162 L130 38 Z" fill="white"/>
    <path d="M28 68 L70 38 L100 22 L70 38 Z" fill="white"/>
    <path d="M172 68 L130 38 L100 22 L130 38 Z" fill="white"/>
    <path d="M28 132 L70 162 L100 178 L70 162 Z" fill="white"/>
    <path d="M172 132 L130 162 L100 178 L130 162 Z" fill="white"/>
    <path d="M70 36 L100 20 L130 36 L130 164 L100 180 L70 164 Z" fill="white"/>
  </g>

  <!-- Logo icon (left) -->
  <g transform="translate(90,185) scale(1.3)">
    ${LOGO_PATHS}
  </g>

  <!-- Arabic title -->
  <text x="420" y="270"
    font-family="'Amiri', 'Times New Roman', serif"
    font-size="110" font-weight="700"
    fill="white" text-anchor="start">المدوّنة</text>

  <!-- Latin subtitle -->
  <text x="422" y="322"
    font-family="'Courier New', monospace"
    font-size="24" fill="rgba(255,255,255,0.5)"
    text-anchor="start" letter-spacing="6">AL-MUDAWWANA</text>

  <!-- Description -->
  <text x="422" y="390"
    font-family="'Amiri', 'Times New Roman', serif"
    font-size="32" fill="rgba(255,255,255,0.75)"
    text-anchor="start">الموسوعة القانونية المغربية الشاملة</text>

  <!-- Divider -->
  <rect x="0" y="598" width="1200" height="32" fill="rgba(255,255,255,0.07)"/>
  <text x="600" y="620"
    font-family="'Courier New', monospace"
    font-size="16" fill="rgba(255,255,255,0.4)"
    text-anchor="middle" letter-spacing="2">modawana.app</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(join(__dir, 'public', 'og-image.png'));
console.log('✓ public/og-image.png generated (1200×630)');
