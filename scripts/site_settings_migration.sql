-- ══════════════════════════════════════════════════════════════════════════════
-- Migration : Table site_settings (paramètres globaux du site)
-- ▶ Exécuter dans : Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS site_settings (
  id         TEXT        PRIMARY KEY,
  value      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Valeur par défaut : tous les liens visibles (hidden = [])
INSERT INTO site_settings (id, value)
VALUES ('nav_links', '{"hidden": []}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- RLS : lecture publique, écriture service_role
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read site_settings" ON site_settings;
CREATE POLICY "public read site_settings"
  ON site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "service write site_settings" ON site_settings;
CREATE POLICY "service write site_settings"
  ON site_settings FOR ALL USING (auth.role() = 'service_role');
