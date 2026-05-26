-- ══════════════════════════════════════════════════════════════════════════════
-- Migration Jurisprudence — compatible création ET mise à jour
-- ▶ Exécuter dans : Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Table principale (création si elle n'existe pas) ───────────────────────

CREATE TABLE IF NOT EXISTS jurisprudence (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number      TEXT        NOT NULL,
  chamber          TEXT,
  decision_nature  TEXT,
  subject          TEXT,
  decision_date    DATE,
  pdf_url          TEXT,
  keywords         TEXT[],
  summary_ar       TEXT,
  source           TEXT        NOT NULL DEFAULT 'huquqai.ma',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. Ajouter les colonnes manquantes (idempotent) ───────────────────────────

ALTER TABLE jurisprudence ADD COLUMN IF NOT EXISTS chamber_slug    TEXT;
ALTER TABLE jurisprudence ADD COLUMN IF NOT EXISTS subject_short   TEXT;
ALTER TABLE jurisprudence ADD COLUMN IF NOT EXISTS import_batch    TEXT;

-- Contrainte UNIQUE sur case_number (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'jurisprudence_case_number_unique'
  ) THEN
    ALTER TABLE jurisprudence ADD CONSTRAINT jurisprudence_case_number_unique UNIQUE (case_number);
  END IF;
END $$;

-- ── 3. Table tags ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS jurisprudence_tags (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisprudence_id  UUID        NOT NULL REFERENCES jurisprudence(id) ON DELETE CASCADE,
  article_id        UUID        REFERENCES articles(id) ON DELETE SET NULL,
  code_slug         TEXT        NOT NULL,
  article_number    TEXT        NOT NULL,
  display_label     TEXT        NOT NULL,
  extraction_method TEXT        NOT NULL DEFAULT 'regex',
  confidence        FLOAT       NOT NULL DEFAULT 1.0,
  context_snippet   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(jurisprudence_id, code_slug, article_number)
);

-- ── 4. Index ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_juris_case    ON jurisprudence(case_number);
CREATE INDEX IF NOT EXISTS idx_juris_chamber ON jurisprudence(chamber_slug);
CREATE INDEX IF NOT EXISTS idx_juris_date    ON jurisprudence(decision_date DESC);
CREATE INDEX IF NOT EXISTS idx_juris_batch   ON jurisprudence(import_batch);

-- Full-text search arabe (utilise subject_short si subject vide)
CREATE INDEX IF NOT EXISTS idx_juris_fts ON jurisprudence
  USING GIN(to_tsvector('arabic',
    coalesce(subject,'') || ' ' || coalesce(subject_short,'')
  ));

CREATE INDEX IF NOT EXISTS idx_tags_article ON jurisprudence_tags(article_id);
CREATE INDEX IF NOT EXISTS idx_tags_code    ON jurisprudence_tags(code_slug, article_number);
CREATE INDEX IF NOT EXISTS idx_tags_juris   ON jurisprudence_tags(jurisprudence_id);

-- ── 5. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE jurisprudence      ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurisprudence_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read jurisprudence"      ON jurisprudence;
DROP POLICY IF EXISTS "public read jurisprudence_tags" ON jurisprudence_tags;
DROP POLICY IF EXISTS "service insert jurisprudence"   ON jurisprudence;
DROP POLICY IF EXISTS "service upsert jurisprudence"   ON jurisprudence;
DROP POLICY IF EXISTS "service delete jurisprudence"   ON jurisprudence;
DROP POLICY IF EXISTS "service insert tags"            ON jurisprudence_tags;
DROP POLICY IF EXISTS "service delete tags"            ON jurisprudence_tags;

CREATE POLICY "public read jurisprudence"
  ON jurisprudence FOR SELECT USING (true);

CREATE POLICY "public read jurisprudence_tags"
  ON jurisprudence_tags FOR SELECT USING (true);

CREATE POLICY "service insert jurisprudence"
  ON jurisprudence FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service upsert jurisprudence"
  ON jurisprudence FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "service delete jurisprudence"
  ON jurisprudence FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "service insert tags"
  ON jurisprudence_tags FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service delete tags"
  ON jurisprudence_tags FOR DELETE USING (auth.role() = 'service_role');
