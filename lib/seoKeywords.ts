/**
 * Auto-extract Arabic SEO keywords from legal article content.
 * Strips tashkeel, removes stop words, returns top-N frequent terms.
 */

const STOP_WORDS = new Set([
  'من','في','على','إلى','عن','مع','هذا','هذه','ذلك','تلك','هؤلاء',
  'التي','الذي','الذين','اللتين','اللذان','اللواتي','وفي','وعلى',
  'أو','إذا','كان','كانت','يكون','تكون','لا','لم','لن','قد','ما',
  'هو','هي','هم','هن','نحن','أنت','أنتم','أنا','كل','بعض','غير',
  'عند','حتى','أن','إن','لأن','بعد','قبل','خلال','وفق','وفقا','وفقاً',
  'طبقا','طبقاً','طبق','بموجب','حكم','أحكام','يجب','يجوز','تسري',
  'الفقرة','البند','المادة','المواد','القانون','القوانين','الفصل',
  'الفصول','الباب','الأبواب','والتي','والذي','ولا','وأن','وإن',
  'كذلك','أيضا','أيضاً','دون','بدون','عدم','ذات','نفس','حيث',
  'بين','لدى','إلا','بل','ثم','حين','منذ','خلاف','سواء','إما',
  'كما','مما','عما','فيما','وكذا','أي','ايضا','اذا','الا','ان',
])

/**
 * Extract keywords from Arabic article content.
 * @param content   Arabic text (content_ar)
 * @param extras    Extra keywords to prepend (e.g. code title, article number)
 * @param topN      Max number of extracted words (default 8)
 */
export function extractKeywords(
  content: string,
  extras: string[] = [],
  topN = 8,
): string[] {
  // Strip tashkeel (U+064B – U+065F)
  const clean = content
    .replace(/[ً-ٟ]/g, '')
    // Keep only Arabic letters + spaces
    .replace(/[^ء-ي\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const words = clean
    .split(' ')
    .filter(w => w.length > 3 && !STOP_WORDS.has(w))

  // Count frequency
  const freq: Record<string, number> = {}
  for (const w of words) freq[w] = (freq[w] || 0) + 1

  const top = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([w]) => w)

  // Extras first (structured tags), then content-derived
  return [...new Set([...extras.filter(Boolean), ...top])]
}

/**
 * Generate meta description from article content (first 155 chars, clean).
 */
export function autoDescription(content: string, prefix = ''): string {
  const clean = content
    .replace(/[ً-ٟ]/g, '')  // strip tashkeel
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const text = prefix ? `${prefix}. ${clean}` : clean
  return text.length > 155 ? text.slice(0, 152) + '...' : text
}
