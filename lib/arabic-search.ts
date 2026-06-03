// lib/arabic-search.ts
// Extraction de mots-clés arabes — safe for client AND server components

const STOPWORDS = new Set([
  'في','من','إلى','على','عن','مع','هذا','هذه','التي','الذي',
  'وهو','وهي','أن','إن','كان','كانت','قد','لم','لا','ما',
  'هو','هي','كل','بعض','حيث','لأن','لكن','بل','أو','ثم',
  'و','ب','ل','ك','ف','عند','بين','بعد','قبل','خلال',
  'حول','نحو','وفق','طبق','هذين','هاتين','هؤلاء','أولئك',
  'التي','اللذان','اللتان','الذين','تلك','ذلك','ذا','تا',
  'أي','أيا','كيف','متى','أين','لماذا','ماذا','من','ما',
  'إذا','إذ','حين','عندما','بينما','ريثما','كلما','حتى',
  'إلا','غير','سوى','رغم','بدون','دون','ضد','نحن','أنتم',
  'أنا','أنت','هم','هن','نفس','ذات','أيضا','أيضاً','جدا',
  'جداً','فقط','قليلا','كثيرا','جميع','كافة','سائر','عامة',
  'أول','ثاني','ثالث','آخر','يكون','تكون','يجب','ينبغي',
  'يمكن','لعل','ليس','ليست','ولا','فلا','وما','فما','أما',
  'أيا','كذلك','وكذا','هكذا','بذلك','لذلك','لذا','وبذلك',
])

// ── Préfixes arabes à supprimer (ordre : plus long en premier) ──────────────
// Après normalisation des hamzat, "للأ" devient "للا" — on garde les deux
// pour couvrir les deux cas (avant et après normalisation)
const PREFIXES = ['للأ', 'للا', 'لل', 'بال', 'وال', 'فال', 'كال', 'ال']

function stripPrefixes(word: string): string {
  for (const prefix of PREFIXES) {
    if (word.startsWith(prefix) && word.length > prefix.length + 2) {
      return word.slice(prefix.length)
    }
  }
  return word
}

/** Normalise les hamzat et alef madda → alef simple */
function normalizeArabic(text: string): string {
  return text
    .replace(/[ً-ٟ]/g, '')        // strip tashkeel (U+064B–U+065F)
    .replace(/[أإآ]/g, 'ا')        // normalise alef variants → ا
    .replace(/ى/g, 'ي')            // alef maqsoura → ya
    .replace(/ة/g, 'ه')            // ta marbuta → ha
    .replace(/ئ|ؤ/g, '')           // drop weak hamzas (optional)
}

export function extractKeywords(text: string): string[] {
  return normalizeArabic(text)
    .replace(/[^ا-يa-zA-Z0-9\s]/g, ' ')   // keep Arabic + Latin + digits
    .split(/\s+/)
    .map(w => w.trim())
    // Strip Arabic prefixes before stop-word check
    .map(stripPrefixes)
    // Keep words with length >= 3 AND not a stop word
    .filter(w => w.length >= 3 && !STOPWORDS.has(w))
    .filter((w, i, arr) => arr.indexOf(w) === i) // dedupe
}

/** Score a subject text against an array of keywords (0–1) */
export function scoreText(subject: string, keywords: string[]): number {
  if (!keywords.length) return 0
  const norm = normalizeArabic(subject).toLowerCase()
  const matched = keywords.filter(k => norm.includes(normalizeArabic(k).toLowerCase()))
  return matched.length / keywords.length
}
