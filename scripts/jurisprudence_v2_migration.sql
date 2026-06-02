-- ══════════════════════════════════════════════════════════════════════════════
-- Migration v2 : Table jurisprudence — schéma basé sur le fichier Excel
-- Colonnes : رقم القرار, رقم الملف (unique), تاريخ القرار,
--            نوع القضية, الموضوع - القاعدة, النتيجة, الرابط
-- ▶ Exécuter dans : Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS jurisprudence_tags CASCADE;
DROP TABLE IF EXISTS jurisprudence CASCADE;

CREATE TABLE jurisprudence (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number   TEXT        NOT NULL,              -- رقم القرار
  file_number   TEXT        NOT NULL,              -- رقم الملف  (unique key)
  decision_date DATE,                              -- تاريخ القرار
  case_type     TEXT,                              -- نوع القضية
  subject       TEXT,                              -- الموضوع - القاعدة
  result        TEXT,                              -- النتيجة
  pdf_url       TEXT,                              -- الرابط
  import_batch  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- file_number est la clé unique (رقم الملف est unique dans le CSV)
CREATE UNIQUE INDEX idx_juris_file_number ON jurisprudence(file_number);
CREATE INDEX idx_juris_date      ON jurisprudence(decision_date DESC);
CREATE INDEX idx_juris_case_type ON jurisprudence(case_type);
CREATE INDEX idx_juris_result    ON jurisprudence(result);
CREATE INDEX idx_juris_fts       ON jurisprudence USING GIN(
  to_tsvector('simple', coalesce(subject, ''))
);

-- RLS
ALTER TABLE jurisprudence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read jurisprudence"  ON jurisprudence;
CREATE POLICY "public read jurisprudence"
  ON jurisprudence FOR SELECT USING (true);

DROP POLICY IF EXISTS "service write jurisprudence" ON jurisprudence;
CREATE POLICY "service write jurisprudence"
  ON jurisprudence FOR ALL USING (auth.role() = 'service_role');
