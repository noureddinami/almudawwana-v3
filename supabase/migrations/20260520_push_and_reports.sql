-- ============================================================
-- Migration: Push Subscriptions + Article Reports
-- ============================================================

-- ── 1. Push Subscriptions ────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id        uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint  text        UNIQUE NOT NULL,
  p256dh    text        NOT NULL,
  auth      text        NOT NULL,
  user_id   uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (INSERT their own subscription)
CREATE POLICY "push_subscribe_insert"
  ON push_subscriptions FOR INSERT
  WITH CHECK (true);

-- Anyone can unsubscribe by endpoint
CREATE POLICY "push_subscribe_delete"
  ON push_subscriptions FOR DELETE
  USING (true);

-- Service role reads all (used server-side by /api/admin/push/send)
-- No SELECT policy → only service role bypasses RLS

-- ── 2. Article Reports ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS article_reports (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id  uuid        REFERENCES articles(id) ON DELETE CASCADE NOT NULL,
  user_id     uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  reason      text        NOT NULL
    CHECK (reason IN ('spelling_error','outdated','numbering_error','incomplete','conflict','other')),
  description text,
  status      text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','reviewed','resolved','dismissed')),
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE article_reports ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a report
CREATE POLICY "reports_insert"
  ON article_reports FOR INSERT
  WITH CHECK (true);

-- Admins and moderators can view all reports
CREATE POLICY "reports_select_admin"
  ON article_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'moderator')
        AND status = 'active'
    )
  );

-- Admins and moderators can update report status
CREATE POLICY "reports_update_admin"
  ON article_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'moderator')
        AND status = 'active'
    )
  );

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_article_reports_status ON article_reports(status);
CREATE INDEX IF NOT EXISTS idx_article_reports_article_id ON article_reports(article_id);
