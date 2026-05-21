-- ============================================================
-- Migration: SEO fields for codes and articles
-- ============================================================

-- ── codes ────────────────────────────────────────────────────
ALTER TABLE codes
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS keywords         TEXT[];

-- ── articles ─────────────────────────────────────────────────
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS keywords         TEXT[];
