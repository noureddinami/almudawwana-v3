-- ══════════════════════════════════════════════════════════════════════════════
-- Migration Jurisprudence — DROP + RECREATE (safe: pas encore de données)
-- ▶ Exécuter dans : Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Supprimer les tables existantes ───────────────────────────────────────

DROP TABLE IF EXISTS jurisprudence_tags CASCADE;
DROP TABLE IF EXISTS jurisprudence      CASCADE;

-- ── 2. Créer la table principale ─────────────────────────────────────────────

CREATE TABLE jurisprudence (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number      TEXT        NOT NULL,
  chamber          TEXT,
  chamber_slug     TEXT,
  decision_nature  TEXT,
  subject          TEXT,
  subject_short    TEXT,
  decision_date    DATE,
  pdf_url          TEXT,
  keywords         TEXT[],
  summary_ar       TEXT,
  source           TEXT        NOT NULL DEFAULT 'huquqai.ma',
  import_batch     TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. Créer la table tags ────────────────────────────────────────────────────

CREATE TABLE jurisprudence_tags (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisprudence_id  UUID        NOT NULL REFERENCES jurisprudence(id) ON DELETE CASCADE,
  article_id        UUID        REFERENCES articles(id) ON DELETE SET NULL,
  code_slug         TEXT        NOT NULL,
  article_number    TEXT        NOT NULL,
  display_label     TEXT        NOT NULL,
  extraction_method TEXT        NOT NULL DEFAULT 'regex',
  confidence        FLOAT       NOT NULL DEFAULT 1.0,
  context_snippet   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. Index ──────────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX idx_juris_case_unique ON jurisprudence(case_number);
CREATE INDEX idx_juris_chamber            ON jurisprudence(chamber_slug);
CREATE INDEX idx_juris_date               ON jurisprudence(decision_date DESC);
CREATE INDEX idx_juris_batch              ON jurisprudence(import_batch);
CREATE INDEX idx_juris_fts                ON jurisprudence
  USING GIN(to_tsvector('simple', coalesce(subject,'') || ' ' || coalesce(subject_short,'')));

CREATE UNIQUE INDEX idx_tags_unique ON jurisprudence_tags(jurisprudence_id, code_slug, article_number);
CREATE INDEX idx_tags_article       ON jurisprudence_tags(article_id);
CREATE INDEX idx_tags_juris         ON jurisprudence_tags(jurisprudence_id);

-- ── 5. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE jurisprudence      ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurisprudence_tags ENABLE ROW LEVEL SECURITY;

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
