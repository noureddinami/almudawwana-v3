// ── lib/jurisprudence-types.ts ────────────────────────────────────────────────
// Types et constantes partagés — AUCUN import supabase/server
// Utilisable dans les Server Components ET les Client Components

export interface JurisTag {
  id:             string
  code_slug:      string
  article_number: string
  display_label:  string
  article_id:     string | null
}

export interface Decision {
  id:              string
  case_number:     string
  chamber:         string | null
  chamber_slug:    string | null
  decision_nature: string | null
  subject:         string | null
  subject_short:   string | null
  decision_date:   string | null
  pdf_url:         string | null
  keywords:        string[] | null
  summary_ar:      string | null
  source:          string
  created_at:      string
  tags?:           JurisTag[]
}

export interface DecisionsPage {
  data:         Decision[]
  total:        number
  current_page: number
  last_page:    number
  per_page:     number
}

export const CHAMBER_LABELS: Record<string, string> = {
  civil:          'الغرفة المدنية',
  criminal:       'الغرفة الجنائية',
  social:         'الغرفة الاجتماعية',
  commercial:     'الغرفة التجارية',
  administrative: 'الغرفة الإدارية',
  other:          'غير محدد',
}

export const CHAMBER_COLORS: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  civil:          { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   bar: 'bg-blue-500'   },
  criminal:       { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    bar: 'bg-red-500'    },
  social:         { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  bar: 'bg-green-500'  },
  commercial:     { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  bar: 'bg-amber-500'  },
  administrative: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', bar: 'bg-purple-500' },
  other:          { bg: 'bg-slate-50',  text: 'text-slate-600',  border: 'border-slate-200',  bar: 'bg-slate-400'  },
}

export function chamberColor(slug: string | null) {
  return CHAMBER_COLORS[slug ?? ''] ?? CHAMBER_COLORS.other
}
