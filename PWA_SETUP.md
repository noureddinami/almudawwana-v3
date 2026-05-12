# PWA Setup Guide — Al-Mudawwana v3

## ✅ Configuration Complétée

Les fichiers suivants ont été configurés pour le PWA:

### 1. `next.config.ts`
- ✅ Static export (`output: 'export'`)
- ✅ next-pwa intégré
- ✅ Images unoptimized (pour DreamHost Shared)
- ✅ Runtime caching strategy pour API + assets
- ✅ NEXT_PUBLIC_API_URL env variable

### 2. `app/layout.tsx`
- ✅ PWA metadata ajouté (manifest, apple-web-app, icons)
- ✅ Meta tags dans `<head>` (theme-color, mobile-capable)
- ✅ Liens manifest et icon

### 3. `public/manifest.json`
- ✅ Créé avec configuration complète
- ✅ Icons, screenshots, shortcuts, share_target
- ✅ Arabe + Anglais support

### 4. `package.json`
- ✅ `next-pwa: ^5.6.0` ajouté

---

## ⚠️ Action Requise: Générer les PNG Icons

### Option A: Utiliser Figma ou Illustrator (Recommandé)
1. Télécharger `public/icon.svg`
2. Ouvrir dans Figma / Adobe XD / Illustrator
3. Exporter comme PNG:
   - `icon-192x192.png` (192x192 px)
   - `icon-512x512.png` (512x512 px)
   - `icon-maskable.png` (192x192 px, avec padding pour border-radius)

### Option B: Utiliser ImageMagick (CLI)
```bash
cd almudawwana-web/public

# Installer ImageMagick si nécessaire
# Windows: https://imagemagick.org/script/download.php
# macOS: brew install imagemagick
# Linux: sudo apt install imagemagick

# Convertir SVG en PNG
convert -size 192x192 xc:white -font "DejaVu-Serif-Bold" -pointsize 120 -gravity center -fill '#1f2937' -annotate +0+0 'ا' icon-192x192.png

convert -size 512x512 xc:white -font "DejaVu-Serif-Bold" -pointsize 300 -gravity center -fill '#1f2937' -annotate +0+0 'ا' icon-512x512.png

convert -size 192x192 xc:white -font "DejaVu-Serif-Bold" -pointsize 120 -gravity center -fill '#1f2937' -annotate +0+0 'ا' -background none -gravity center -extent 200x200 icon-maskable.png
```

### Option C: Utiliser Online Tools
1. https://svgtopng.com/ ou https://cloudconvert.com/
2. Télécharger `icon.svg`
3. Convertir vers PNG
4. Redimensionner à 192x192, 512x512, maskable

### Option D: Utiliser Node.js Script
Créer `generate-icons.js`:
```javascript
const sharp = require('sharp');
const fs = require('fs');

(async () => {
  const iconSvg = fs.readFileSync('public/icon.svg');

  // 192x192
  await sharp(iconSvg).resize(192, 192).png().toFile('public/icon-192x192.png');

  // 512x512
  await sharp(iconSvg).resize(512, 512).png().toFile('public/icon-512x512.png');

  // Maskable (avec padding)
  await sharp(iconSvg)
    .resize(160, 160)
    .extend({
      top: 16,
      bottom: 16,
      left: 16,
      right: 16,
      background: { r: 255, g: 255, b: 255 }
    })
    .png()
    .toFile('public/icon-maskable.png');

  console.log('✅ Icons générées avec succès!');
})();
```

Puis exécuter:
```bash
npm install sharp
node generate-icons.js
```

---

## 📱 Screenshot PWA (540x720)

Pour une meilleure installation, créez des screenshots:

1. `public/screenshot-1.png` (540x720) — Homepage
2. `public/screenshot-2.png` (540x720) — Article page

Les screenshots doivent montrer:
- L'interface responsive
- La navigation principale
- Exemple de contenu

---

## 🚀 Étapes Suivantes

### 1. Installer next-pwa
```bash
cd almudawwana-web
npm install
```

### 2. Générer les PNG icons
Utiliser l'une des options ci-dessus.

### 3. Build statique
```bash
npm run build
```

**Résultat:** Dossier `out/` avec tous les fichiers statiques + `.next/cache/` et `sw.js` (service worker)

### 4. Tester localement
```bash
npm install -g serve
serve -s out

# Ouvrir http://localhost:3000
# Chrome: Cliquer sur l'icône "+" en haut
# Installer l'app
```

### 5. Tester offline
- DevTools → Network → Offline
- Recharger la page
- Doit fonctionner en cache

### 6. Déployer sur DreamHost
```bash
scp -r out/* username@almodawana.dreamhosters.com:~/public_html/
scp public/manifest.json username@almodawana.dreamhosters.com:~/public_html/
scp public/icon-*.png username@almodawana.dreamhosters.com:~/public_html/
```

---

## 🔍 Vérification

### Vérifier la PWA localement
```bash
# 1. Build
npm run build

# 2. Servir
serve -s out

# 3. Dans Chrome DevTools:
# - Application → Manifest
# - Service Workers → Registered
# - Cache Storage → Vérifier les caches
```

### Vérifier sur DreamHost
```
https://almodawana.dreamhosters.com/
```

- [ ] Icône "+" apparaît en haut du navigateur
- [ ] Cliquer → "Installer Al-Mudawwana"
- [ ] App s'installe sur l'écran d'accueil
- [ ] Fonctionne en offline (DevTools → Network → Offline)

---

## 📊 Troubleshooting

### Service Worker ne s'enregistre pas
```
❌ Vérifier:
- manifest.json existe dans public/
- next.config.ts a `disable: process.env.NODE_ENV === 'development'`
- En production (build, pas dev)
```

### Icons ne s'affichent pas
```
❌ Vérifier:
- icon-192x192.png, icon-512x512.png existent dans public/
- manifest.json pointe vers les bons chemins
- Nom des fichiers correspond à manifest.json
```

### "Cannot find module 'next-pwa'"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Build échoue avec "output: 'export'"
```
❌ Vérifier que vous n'utilisez pas:
- `getServerSideProps` (rem: v3 is SSR capable but export mode needs static)
- `revalidateTag` ou `revalidatePath`
- API routes dynamiques
```

---

## 🎯 Résumé

✅ **Complété:**
- next-pwa configuré
- manifest.json créé
- app/layout.tsx mis à jour
- Static export activé

⏳ **À faire:**
1. Générer PNG icons (192x192, 512x512, maskable)
2. Ajouter screenshots PWA (optionnel)
3. `npm install`
4. `npm run build`
5. Tester localement avec `serve -s out`
6. Déployer sur DreamHost

**Temps estimé:** 30-60 minutes (génération des icons comprise)

