/**
 * Generates all PWA assets (icons + screenshots) using sharp.
 * Run: node generate-pwa-assets.mjs
 */
import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, 'public');

// ─── Logo SVG paths (the scales/balance icon) ────────────────────────────────
const LOGO_PATHS = `
  <path d="M28 68 L28 132 L70 162 L70 38 Z" fill="#2152cc"/>
  <path d="M172 68 L172 132 L130 162 L130 38 Z" fill="#2152cc"/>
  <path d="M28 68 L70 38 L100 22 L70 38 Z" fill="#2152cc"/>
  <path d="M172 68 L130 38 L100 22 L130 38 Z" fill="#2152cc"/>
  <path d="M28 132 L70 162 L100 178 L70 162 Z" fill="#2152cc"/>
  <path d="M172 132 L130 162 L100 178 L130 162 Z" fill="#2152cc"/>
  <path d="M70 36 L100 20 L130 36 L130 164 L100 180 L70 164 Z" fill="#4a7fd4"/>
  <path d="M94 36 L106 30 L106 170 L94 176 Z" fill="#5a8fe0" opacity="0.5"/>
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

// Build icon SVG: blue rounded-rect bg + logo centered
function iconSvg(size, radius) {
  const r = radius ?? Math.round(size * 0.2);
  const pad = Math.round(size * 0.12);
  const inner = size - pad * 2;
  const scale = inner / 200;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#2152cc"/>
  <g transform="translate(${pad},${pad}) scale(${scale})">
    ${LOGO_PATHS}
  </g>
</svg>`;
}

// Maskable icon: smaller safe zone (logo takes 60% — rest is padding for stores)
function maskableSvg(size) {
  const pad = Math.round(size * 0.2);
  const inner = size - pad * 2;
  const scale = inner / 200;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#2152cc"/>
  <g transform="translate(${pad},${pad}) scale(${scale})">
    ${LOGO_PATHS}
  </g>
</svg>`;
}

async function svgToPng(svgStr, outPath) {
  await sharp(Buffer.from(svgStr)).png().toFile(outPath);
  console.log('✓', outPath.replace(__dir, '.'));
}

// ─── Screenshot wide 1280×720 mockup ─────────────────────────────────────────
function screenshotWideSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <!-- Navbar -->
  <rect width="1280" height="720" fill="#f8fafc"/>
  <rect width="1280" height="56" fill="white"/>
  <rect y="56" width="1280" height="1" fill="#e2e8f0"/>
  <!-- Logo in navbar -->
  <g transform="translate(1220,11) scale(0.17)">
    ${LOGO_PATHS}
  </g>
  <text x="1208" y="37" font-family="serif" font-size="22" font-weight="700" fill="#1a2f6e" text-anchor="end" direction="rtl">المدوّنة</text>
  <!-- Nav links -->
  <text x="820" y="35" font-family="sans-serif" font-size="13" fill="#64748b" text-anchor="middle">البحث</text>
  <text x="700" y="35" font-family="sans-serif" font-size="13" fill="#64748b" text-anchor="middle">النصوص القانونية</text>
  <text x="560" y="35" font-family="sans-serif" font-size="13" fill="#64748b" text-anchor="middle">آخر الإضافات</text>
  <!-- CTA button -->
  <rect x="30" y="14" width="120" height="30" rx="8" fill="#2152cc"/>
  <text x="90" y="33" font-family="sans-serif" font-size="12" fill="white" text-anchor="middle">أنشئ حسابك</text>

  <!-- Hero section -->
  <defs>
    <linearGradient id="heroGrad" x1="0" y1="0" x2="1280" y2="664" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1a3fa0"/>
      <stop offset="55%" stop-color="#2152cc"/>
      <stop offset="100%" stop-color="#3b6fd4"/>
    </linearGradient>
  </defs>
  <rect y="57" width="1280" height="440" fill="url(#heroGrad)"/>

  <!-- Big logo in hero -->
  <g transform="translate(574,95) scale(0.52)">
    <rect width="200" height="200" rx="36" fill="rgba(255,255,255,0.12)"/>
    ${LOGO_PATHS}
  </g>

  <!-- Hero text -->
  <text x="640" y="320" font-family="serif" font-size="46" font-weight="700" fill="white" text-anchor="middle">الوصول السهل إلى القانون المغربي</text>
  <text x="640" y="365" font-family="sans-serif" font-size="16" fill="rgba(255,255,255,0.75)" text-anchor="middle">ابحث وتصفح أكثر من 3,390 مادة قانونية</text>

  <!-- Search bar -->
  <rect x="330" y="390" width="620" height="48" rx="12" fill="white"/>
  <text x="610" y="421" font-family="sans-serif" font-size="14" fill="#94a3b8" text-anchor="end">ابحث في القوانين المغربية...</text>
  <rect x="340" y="400" width="80" height="28" rx="8" fill="#2152cc"/>
  <text x="380" y="419" font-family="sans-serif" font-size="12" fill="white" text-anchor="middle">ابحث الآن</text>

  <!-- Stats bar -->
  <rect x="430" y="455" width="100" height="70" rx="10" fill="rgba(255,255,255,0.12)"/>
  <text x="480" y="483" font-family="sans-serif" font-size="22" font-weight="700" fill="white" text-anchor="middle">6</text>
  <text x="480" y="502" font-family="sans-serif" font-size="11" fill="rgba(255,255,255,0.7)" text-anchor="middle">قانون ومدونة</text>
  <rect x="545" y="455" width="100" height="70" rx="10" fill="rgba(255,255,255,0.12)"/>
  <text x="595" y="483" font-family="sans-serif" font-size="22" font-weight="700" fill="white" text-anchor="middle">3,390</text>
  <text x="595" y="502" font-family="sans-serif" font-size="11" fill="rgba(255,255,255,0.7)" text-anchor="middle">مادة قانونية</text>
  <rect x="660" y="455" width="100" height="70" rx="10" fill="rgba(255,255,255,0.12)"/>
  <text x="710" y="483" font-family="sans-serif" font-size="22" font-weight="700" fill="white" text-anchor="middle">مجاني</text>
  <text x="710" y="502" font-family="sans-serif" font-size="11" fill="rgba(255,255,255,0.7)" text-anchor="middle">وصول حر للجميع</text>

  <!-- Codes section -->
  <text x="1230" y="570" font-family="serif" font-size="20" font-weight="700" fill="#1e293b" text-anchor="end">القوانين المتاحة</text>
  <!-- Code cards -->
  <rect x="30" y="545" width="220" height="90" rx="10" fill="white" stroke="#e2e8f0" stroke-width="1"/>
  <rect x="35" y="555" width="4" height="30" rx="2" fill="#2152cc"/>
  <text x="250" y="575" font-family="sans-serif" font-size="13" fill="#1e293b" text-anchor="end">المسطرة الجنائية</text>
  <text x="250" y="595" font-family="sans-serif" font-size="11" fill="#64748b" text-anchor="end">914 مادة</text>
  <rect x="270" y="545" width="220" height="90" rx="10" fill="white" stroke="#e2e8f0" stroke-width="1"/>
  <text x="490" y="575" font-family="sans-serif" font-size="13" fill="#1e293b" text-anchor="end">القانون الجنائي</text>
  <text x="490" y="595" font-family="sans-serif" font-size="11" fill="#64748b" text-anchor="end">618 مادة</text>
  <rect x="510" y="545" width="220" height="90" rx="10" fill="white" stroke="#e2e8f0" stroke-width="1"/>
  <text x="730" y="575" font-family="sans-serif" font-size="13" fill="#1e293b" text-anchor="end">مدونة الأسرة</text>
  <text x="730" y="595" font-family="sans-serif" font-size="11" fill="#64748b" text-anchor="end">400 مادة</text>
  <rect x="750" y="545" width="220" height="90" rx="10" fill="white" stroke="#e2e8f0" stroke-width="1"/>
  <text x="970" y="575" font-family="sans-serif" font-size="13" fill="#1e293b" text-anchor="end">مدونة الشغل</text>
  <text x="970" y="595" font-family="sans-serif" font-size="11" fill="#64748b" text-anchor="end">586 مادة</text>
</svg>`;
}

// ─── Screenshot narrow 540×960 mockup ────────────────────────────────────────
function screenshotNarrowSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="540" height="960" viewBox="0 0 540 960">
  <rect width="540" height="960" fill="#f8fafc"/>
  <!-- Navbar -->
  <rect width="540" height="52" fill="white"/>
  <rect y="52" width="540" height="1" fill="#e2e8f0"/>
  <g transform="translate(508,9) scale(0.17)">
    ${LOGO_PATHS}
  </g>
  <text x="494" y="34" font-family="serif" font-size="20" font-weight="700" fill="#1a2f6e" text-anchor="end" direction="rtl">المدوّنة</text>
  <!-- Hamburger menu -->
  <rect x="20" y="19" width="22" height="2.5" rx="1.5" fill="#64748b"/>
  <rect x="20" y="26" width="16" height="2.5" rx="1.5" fill="#64748b"/>
  <rect x="20" y="33" width="22" height="2.5" rx="1.5" fill="#64748b"/>

  <!-- Hero -->
  <defs>
    <linearGradient id="heroG" x1="0" y1="0" x2="540" y2="520" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1a3fa0"/>
      <stop offset="55%" stop-color="#2152cc"/>
      <stop offset="100%" stop-color="#3b6fd4"/>
    </linearGradient>
  </defs>
  <rect y="53" width="540" height="420" fill="url(#heroG)"/>

  <!-- Logo -->
  <g transform="translate(218,80) scale(0.52)">
    <rect width="200" height="200" rx="36" fill="rgba(255,255,255,0.12)"/>
    ${LOGO_PATHS}
  </g>
  <!-- Hero text -->
  <text x="270" y="308" font-family="serif" font-size="26" font-weight="700" fill="white" text-anchor="middle">الوصول السهل إلى القانون المغربي</text>
  <text x="270" y="340" font-family="sans-serif" font-size="13" fill="rgba(255,255,255,0.75)" text-anchor="middle">3,390 مادة قانونية</text>

  <!-- Search bar -->
  <rect x="30" y="362" width="480" height="44" rx="10" fill="white"/>
  <text x="490" y="389" font-family="sans-serif" font-size="13" fill="#94a3b8" text-anchor="end">ابحث في القوانين...</text>
  <rect x="38" y="370" width="70" height="28" rx="8" fill="#2152cc"/>
  <text x="73" y="389" font-family="sans-serif" font-size="11" fill="white" text-anchor="middle">بحث</text>

  <!-- Stats -->
  <rect x="40" y="418" width="136" height="60" rx="10" fill="rgba(255,255,255,0.12)"/>
  <text x="108" y="444" font-family="sans-serif" font-size="20" font-weight="700" fill="white" text-anchor="middle">6</text>
  <text x="108" y="462" font-family="sans-serif" font-size="10" fill="rgba(255,255,255,0.7)" text-anchor="middle">قانون</text>
  <rect x="192" y="418" width="136" height="60" rx="10" fill="rgba(255,255,255,0.12)"/>
  <text x="260" y="444" font-family="sans-serif" font-size="20" font-weight="700" fill="white" text-anchor="middle">3,390</text>
  <text x="260" y="462" font-family="sans-serif" font-size="10" fill="rgba(255,255,255,0.7)" text-anchor="middle">مادة قانونية</text>
  <rect x="344" y="418" width="136" height="60" rx="10" fill="rgba(255,255,255,0.12)"/>
  <text x="412" y="444" font-family="sans-serif" font-size="20" font-weight="700" fill="white" text-anchor="middle">مجاني</text>
  <text x="412" y="462" font-family="sans-serif" font-size="10" fill="rgba(255,255,255,0.7)" text-anchor="middle">وصول حر</text>

  <!-- Codes list -->
  <text x="510" y="510" font-family="serif" font-size="17" font-weight="700" fill="#1e293b" text-anchor="end">القوانين المتاحة</text>
  <!-- Cards -->
  <rect x="20" y="525" width="500" height="72" rx="10" fill="white" stroke="#e2e8f0" stroke-width="1"/>
  <rect x="25" y="535" width="4" height="28" rx="2" fill="#2152cc"/>
  <text x="510" y="553" font-family="sans-serif" font-size="14" fill="#1e293b" text-anchor="end">المسطرة الجنائية</text>
  <text x="510" y="573" font-family="sans-serif" font-size="12" fill="#64748b" text-anchor="end">914 مادة</text>
  <rect x="506" y="554" width="6" height="6" rx="3" fill="#2152cc" opacity="0.4"/>

  <rect x="20" y="609" width="500" height="72" rx="10" fill="white" stroke="#e2e8f0" stroke-width="1"/>
  <rect x="25" y="619" width="4" height="28" rx="2" fill="#7c3aed"/>
  <text x="510" y="637" font-family="sans-serif" font-size="14" fill="#1e293b" text-anchor="end">القانون الجنائي</text>
  <text x="510" y="657" font-family="sans-serif" font-size="12" fill="#64748b" text-anchor="end">618 مادة</text>

  <rect x="20" y="693" width="500" height="72" rx="10" fill="white" stroke="#e2e8f0" stroke-width="1"/>
  <rect x="25" y="703" width="4" height="28" rx="2" fill="#059669"/>
  <text x="510" y="721" font-family="sans-serif" font-size="14" fill="#1e293b" text-anchor="end">مدونة الأسرة</text>
  <text x="510" y="741" font-family="sans-serif" font-size="12" fill="#64748b" text-anchor="end">400 مادة</text>

  <rect x="20" y="777" width="500" height="72" rx="10" fill="white" stroke="#e2e8f0" stroke-width="1"/>
  <rect x="25" y="787" width="4" height="28" rx="2" fill="#d97706"/>
  <text x="510" y="805" font-family="sans-serif" font-size="14" fill="#1e293b" text-anchor="end">مدونة الشغل</text>
  <text x="510" y="825" font-family="sans-serif" font-size="12" fill="#64748b" text-anchor="end">586 مادة</text>

  <!-- Bottom nav bar -->
  <rect y="896" width="540" height="64" fill="white" stroke="#e2e8f0" stroke-width="1"/>
  <g transform="translate(44,908) scale(0.12)"> ${LOGO_PATHS} </g>
  <text x="64" y="944" font-family="sans-serif" font-size="10" fill="#2152cc" text-anchor="middle">الرئيسية</text>
  <text x="170" y="930" font-family="sans-serif" font-size="22" fill="#94a3b8" text-anchor="middle">⚖️</text>
  <text x="170" y="944" font-family="sans-serif" font-size="10" fill="#94a3b8" text-anchor="middle">القوانين</text>
  <text x="270" y="930" font-family="sans-serif" font-size="22" fill="#94a3b8" text-anchor="middle">🔍</text>
  <text x="270" y="944" font-family="sans-serif" font-size="10" fill="#94a3b8" text-anchor="middle">بحث</text>
  <text x="370" y="930" font-family="sans-serif" font-size="22" fill="#94a3b8" text-anchor="middle">🔔</text>
  <text x="370" y="944" font-family="sans-serif" font-size="10" fill="#94a3b8" text-anchor="middle">الإشعارات</text>
  <text x="476" y="930" font-family="sans-serif" font-size="22" fill="#94a3b8" text-anchor="middle">👤</text>
  <text x="476" y="944" font-family="sans-serif" font-size="10" fill="#94a3b8" text-anchor="middle">حسابي</text>
</svg>`;
}

// ─── Generate all assets ──────────────────────────────────────────────────────
async function main() {
  console.log('Generating PWA assets...\n');

  await svgToPng(iconSvg(192, 38),  join(OUT, 'icon-192x192.png'));
  await svgToPng(iconSvg(512, 96),  join(OUT, 'icon-512x512.png'));
  await svgToPng(maskableSvg(512),  join(OUT, 'icon-maskable.png'));
  await svgToPng(iconSvg(180, 40),  join(OUT, 'apple-touch-icon.png'));
  await svgToPng(screenshotWideSvg(),   join(OUT, 'screenshot-wide.png'));
  await svgToPng(screenshotNarrowSvg(), join(OUT, 'screenshot-narrow.png'));

  console.log('\nDone! All assets written to public/');
}

main().catch(console.error);
