-- Contact messages table (replaces email-based contact form)
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for rate limiting (email + created_at)
CREATE INDEX IF NOT EXISTS idx_contact_messages_email_created
  ON contact_messages (email, created_at DESC);

-- Index for admin listing
CREATE INDEX IF NOT EXISTS idx_contact_messages_status
  ON contact_messages (status, created_at DESC);

-- RLS: allow anonymous inserts, only authenticated admins can read
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (contact form is public)
CREATE POLICY "Anyone can submit contact messages"
  ON contact_messages FOR INSERT
  WITH CHECK (true);

-- Only service role / authenticated users can read (admin dashboard)
CREATE POLICY "Authenticated users can read contact messages"
  ON contact_messages FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only authenticated users can update (admin marking as read/replied)
CREATE POLICY "Authenticated users can update contact messages"
  ON contact_messages FOR UPDATE
  USING (auth.role() = 'authenticated');
