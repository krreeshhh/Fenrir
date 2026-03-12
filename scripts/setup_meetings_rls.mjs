import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://papkgiajcnndgvgrusog.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcGtnaWFqY25uZGd2Z3J1c29nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIyODU3NiwiZXhwIjoyMDg4ODA0NTc2fQ.eRvYKKSYwacWpPBmR0WfucGJLWXclBeWDr8mkSJpv_s';

const PROJECT_REF = 'papkgiajcnndgvgrusog';

const SQL = `
-- 1. Meetings table RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants can view meetings" ON meetings;
CREATE POLICY "Participants can view meetings" ON meetings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM meeting_participants 
    WHERE meeting_participants.meeting_id = id 
    AND meeting_participants.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Anyone can insert meeting" ON meetings;
CREATE POLICY "Anyone can insert meeting" ON meetings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update meeting" ON meetings;
CREATE POLICY "Anyone can update meeting" ON meetings FOR UPDATE USING (true);

-- 2. Meeting Participants RLS
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can access participants" ON meeting_participants;
CREATE POLICY "Anyone can access participants" ON meeting_participants FOR ALL USING (true);

-- 3. Users Metadata RLS
ALTER TABLE users_metadata ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public lookup" ON users_metadata;
CREATE POLICY "Public lookup" ON users_metadata FOR SELECT USING (true);

-- 4. Messages RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Message access" ON messages;
CREATE POLICY "Message access" ON messages FOR ALL USING (true);
`;

async function applyRLS() {
  console.log('Applying Nodal Permissions (RLS)...');
  
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: SQL }),
  });

  if (res.ok) {
    console.log('✅ Permissions alignment successful!');
  } else {
    const err = await res.text();
    console.error('❌ Failed to align permissions:', res.status, err);
  }
}

applyRLS();
