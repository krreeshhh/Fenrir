import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://papkgiajcnndgvgrusog.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcGtnaWFqY25uZGd2Z3J1c29nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIyODU3NiwiZXhwIjoyMDg4ODA0NTc2fQ.eRvYKKSYwacWpPBmR0WfucGJLWXclBeWDr8mkSJpv_s';

const PROJECT_REF = 'papkgiajcnndgvgrusog';

const SQL = `
ALTER TABLE meeting_participants ADD COLUMN IF NOT EXISTS is_synced BOOLEAN DEFAULT FALSE;
`;

async function updateSchema() {
  console.log('Updating meeting_participants schema...');
  
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: SQL }),
  });

  if (res.ok) {
    console.log('✅ Schema updated with is_synced column!');
  } else {
    const err = await res.text();
    console.error('❌ Failed to update schema:', res.status, err);
  }
}

updateSchema();
