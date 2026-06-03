-- ══════════════════════════════════════════════════════════════════════════════
-- Fonctions Supabase pour la recherche jurisprudence
-- ▶ Exécuter dans : Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Recherche par mots-clés avec score ────────────────────────────────────
CREATE OR REPLACE FUNCTION search_jurisprudence(
  keywords    text[],
  min_score   float    DEFAULT 0.5,
  p_case_type text     DEFAULT NULL,
  p_result    text     DEFAULT NULL,
  p_date_from date     DEFAULT NULL,
  p_date_to   date     DEFAULT NULL,
  p_limit     int      DEFAULT 20,
  p_offset    int      DEFAULT 0
)
RETURNS TABLE (
  id            uuid,
  case_number   text,
  file_number   text,
  decision_date date,
  case_type     text,
  subject       text,
  result        text,
  pdf_url       text,
  import_batch  text,
  created_at    timestamptz,
  matched_count int,
  total_keywords int,
  score         float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.id, j.case_number, j.file_number, j.decision_date,
    j.case_type, j.subject, j.result, j.pdf_url,
    j.import_batch, j.created_at,
    (
      SELECT COUNT(*)::int FROM unnest(keywords) k
      WHERE j.subject ILIKE '%' || k || '%'
    ) AS matched_count,
    array_length(keywords, 1) AS total_keywords,
    (
      SELECT COUNT(*)::float FROM unnest(keywords) k
      WHERE j.subject ILIKE '%' || k || '%'
    ) / NULLIF(array_length(keywords, 1)::float, 0) AS score
  FROM jurisprudence j
  WHERE
    -- case_type filter: include exact match OR NULL/empty (unclassified decisions)
    (p_case_type IS NULL OR j.case_type = p_case_type OR j.case_type IS NULL OR j.case_type = '')
    AND
    -- result filter: same logic
    (p_result IS NULL OR j.result = p_result OR j.result IS NULL OR j.result = '')
    AND
    (p_date_from IS NULL OR j.decision_date >= p_date_from)
    AND
    (p_date_to   IS NULL OR j.decision_date <= p_date_to)
  HAVING
    (
      SELECT COUNT(*)::float FROM unnest(keywords) k
      WHERE j.subject ILIKE '%' || k || '%'
    ) / NULLIF(array_length(keywords, 1)::float, 0) >= min_score
  ORDER BY score DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- ── 2. 50 décisions aléatoires (affichage initial sans recherche) ─────────────
CREATE OR REPLACE FUNCTION get_random_jurisprudence(p_limit int DEFAULT 50)
RETURNS SETOF jurisprudence AS $$
  SELECT * FROM jurisprudence
  ORDER BY random()
  LIMIT p_limit;
$$ LANGUAGE sql STABLE;

-- ── Grants ───────────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION search_jurisprudence TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_random_jurisprudence TO anon, authenticated, service_role;
