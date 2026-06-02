// ── lib/jurisprudence-types.ts ────────────────────────────────────────────────
// Types et utilitaires partagés — AUCUN import supabase/server
// Utilisable dans les Server Components ET les Client Components

export interface Decision {
  id:            string
  case_number:   string          // رقم القرار
  file_number:   string          // رقم الملف
  decision_date: string | null   // تاريخ القرار
  case_type:     string | null   // نوع القضية
  subject:       string | null   // الموضوع - القاعدة
  result:        string | null   // النتيجة
  pdf_url:       string | null   // الرابط
  import_batch:  string | null
  created_at:    string
}

export interface DecisionsPage {
  data:         Decision[]
  total:        number
  current_page: number
  last_page:    number
  per_page:     number
}

// ── Keyword extraction ────────────────────────────────────────────────────────
// Removes: stopwords, short words (<5 chars), diacritics, ال prefix

const STOPWORDS = new Set([
  'و','في','من','على','إلى','الى','عن','مع','أن','ان','إن','ما','لا',
  'هذا','هذه','ذلك','تلك','هو','هي','هم','هن','أو','او','بين','كان',
  'كانت','يكون','تكون','قد','لم','لن','لي','لك','له','لها','لهم',
  'كل','بعض','أي','اي','حيث','إذ','إذا','اذا','فإن','فان','ثم','بل',
  'لكن','لكنه','غير','دون','حول','خلال','نحو','بعد','قبل','أمام','حتى',
  'فقط','أيضا','كما','بما','مما','عند','منذ','وفق','وفقا','طبقا',
  'الذي','الذين','التي','اللتي','به','بها','بهم','منه','منها','عليه',
  'عليها','فيه','فيها','إليه','إليها','لأن','لان','الت','هذان',
  'هؤلاء','أولئك','ليس','ليست','كذلك','وقد','وهو','وهي','وهم',
  'وكان','وكانت','وفي','ومن','وعلى','وإن','وان','أما','اما','إما',
  'بينما','عندما','لما','حين','رغم','مثل','نعم','بموجب','طبق',
  'إطار','اطار','ذات','غير','كون','إذن','أثناء','اثناء','تاريخ',
  'قرار','محكمة','ملف','فصل','مادة','نقض','الملك',
])

export function extractKeywords(text: string): string[] {
  return (
    text
      .replace(/[ً-ٟ]/g, '')           // strip tashkeel
      .replace(/[^؀-ۿa-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .map(w => w.replace(/^ال/, ''))             // strip leading ال
      .filter(w =>
        w.length >= 5 &&
        !STOPWORDS.has(w) &&
        !STOPWORDS.has('ال' + w)
      )
      .filter((w, i, arr) => arr.indexOf(w) === i) // dedupe
  )
}

// ── Couleurs par نوع القضية ──────────────────────────────────────────────────
export const CASE_TYPE_COLORS: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  'مدني':     { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   bar: 'bg-blue-500'   },
  'جنائي':    { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    bar: 'bg-red-500'    },
  'تجاري':    { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  bar: 'bg-amber-500'  },
  'إداري':    { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', bar: 'bg-purple-500' },
  'اجتماعي':  { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  bar: 'bg-green-500'  },
}
const DEFAULT_COLOR = { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', bar: 'bg-slate-400' }

export function caseTypeColor(type: string | null) {
  return CASE_TYPE_COLORS[type ?? ''] ?? DEFAULT_COLOR
}

// ── Couleurs par النتيجة ─────────────────────────────────────────────────────
export const RESULT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'رفض':        { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200'    },
  'عدم قبول':   { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'نقض':        { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'   },
  'تأييد':      { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200'  },
  'إلغاء':      { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
}
const DEFAULT_RESULT_COLOR = { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' }

export function resultColor(result: string | null) {
  return RESULT_COLORS[result ?? ''] ?? DEFAULT_RESULT_COLOR
}
