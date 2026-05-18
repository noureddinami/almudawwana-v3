-- Create code_requests table for user-submitted legal code addition requests
CREATE TABLE IF NOT EXISTS code_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  code_title TEXT NOT NULL,
  code_link TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'added', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_code_requests_status ON code_requests(status);

-- Index for ordering by creation date
CREATE INDEX IF NOT EXISTS idx_code_requests_created_at ON code_requests(created_at DESC);

-- RLS: Allow public inserts (no auth needed to submit a request)
ALTER TABLE code_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can insert
CREATE POLICY "Anyone can submit code requests"
  ON code_requests FOR INSERT
  WITH CHECK (true);

-- Only service_role can select/update/delete (admin API uses service client)
-- The anon key won't be able to read requests
CREATE POLICY "Service role can manage code requests"
  ON code_requests FOR ALL
  USING (auth.role() = 'service_role');
