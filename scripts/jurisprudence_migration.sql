-- ══════════════════════════════════════════════════════════════════════════════
-- Migration : Tables Jurisprudence
-- Projet    : Al-Mudawwana (المدوّنة) — modawana.app
-- Date      : 2026-05-26
-- ▶ Exécuter dans : Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Table principale ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS jurisprudence (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number      TEXT        NOT NULL UNIQUE,
  chamber          TEXT,                          -- brut : civil / criminal / vide…
  chamber_slug     TEXT,                          -- normalisé : civil/criminal/social/commercial/administrative/other
  decision_nature  TEXT,
  subject          TEXT,
  subject_short    TEXT,                          -- 150 chars nettoyés (affichage)
  decision_date    DATE,
  pdf_url          TEXT,                          -- URL R2 Cloudflare directe
  keywords         TEXT[],
  summary_ar       TEXT,
  source           TEXT        NOT NULL DEFAULT 'huquqai.ma',
  import_batch     TEXT,                          -- ex: "2026-05-26"
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Table tags (liens jurisprudence ↔ articles المدوّنة) ──────────────────────

CREATE TABLE IF NOT EXISTS jurisprudence_tags (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisprudence_id  UUID        NOT NULL REFERENCES jurisprudence(id) ON DELETE CASCADE,
  article_id        UUID        REFERENCES articles(id) ON DELETE SET NULL,
  code_slug         TEXT        NOT NULL,
  article_number    TEXT        NOT NULL,
  display_label     TEXT        NOT NULL,         -- "م.32 — مدونة الشغل"
  extraction_method TEXT        NOT NULL DEFAULT 'regex',
  confidence        FLOAT       NOT NULL DEFAULT 1.0,
  context_snippet   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(jurisprudence_id, code_slug, article_number)
);

-- ── Index ─────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_juris_case    ON jurisprudence(case_number);
CREATE INDEX IF NOT EXISTS idx_juris_chamber ON jurisprudence(chamber_slug);
CREATE INDEX IF NOT EXISTS idx_juris_date    ON jurisprudence(decision_date DESC);
CREATE INDEX IF NOT EXISTS idx_juris_batch   ON jurisprudence(import_batch);
CREATE INDEX IF NOT EXISTS idx_juris_fts     ON jurisprudence
  USING GIN(to_tsvector('arabic',
    coalesce(subject,'') || ' ' || coalesce(subject_short,'')
  ));

CREATE INDEX IF NOT EXISTS idx_tags_article ON jurisprudence_tags(article_id);
CREATE INDEX IF NOT EXISTS idx_tags_code    ON jurisprudence_tags(code_slug, article_number);
CREATE INDEX IF NOT EXISTS idx_tags_juris   ON jurisprudence_tags(jurisprudence_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE jurisprudence      ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurisprudence_tags ENABLE ROW LEVEL SECURITY;

-- Lecture publique (anon)
DROP POLICY IF EXISTS "public read jurisprudence"      ON jurisprudence;
DROP POLICY IF EXISTS "public read jurisprudence_tags" ON jurisprudence_tags;

CREATE POLICY "public read jurisprudence"
  ON jurisprudence FOR SELECT USING (true);

CREATE POLICY "public read jurisprudence_tags"
  ON jurisprudence_tags FOR SELECT USING (true);

-- Écriture service_role uniquement (script Python)
DROP POLICY IF EXISTS "service insert jurisprudence"  ON jurisprudence;
DROP POLICY IF EXISTS "service upsert jurisprudence"  ON jurisprudence;
DROP POLICY IF EXISTS "service delete jurisprudence"  ON jurisprudence;
DROP POLICY IF EXISTS "service insert tags"           ON jurisprudence_tags;
DROP POLICY IF EXISTS "service delete tags"           ON jurisprudence_tags;

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
