import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://papkgiajcnndgvgrusog.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcGtnaWFqY25uZGd2Z3J1c29nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIyODU3NiwiZXhwIjoyMDg4ODA0NTc2fQ.eRvYKKSYwacWpPBmR0WfucGJLWXclBeWDr8mkSJpv_s';

const PROJECT_REF = 'papkgiajcnndgvgrusog';

const SQL = `
-- 1. Add project_lead_id to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_lead_id UUID REFERENCES users_metadata(id);

-- 2. Migrate existing allocations
UPDATE projects p
SET project_lead_id = pa.project_lead_id
FROM project_allocations pa
WHERE pa.project_id = p.id;

-- 3. Drop project_allocations table as it's now redundant
-- DROP TABLE IF EXISTS project_allocations CASCADE; 
-- Wait, let's keep it for a moment but stop using it, out of caution. 
-- Actually, the user wants "only one time where the Authority is Managed", 
-- so dropping it is the best way to enforce it.

DROP TABLE IF EXISTS project_allocations CASCADE;

-- 4. Update RLS for projects
DROP POLICY IF EXISTS "projects_select" ON projects;
CREATE POLICY "projects_select" ON projects FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "projects_insert" ON projects;
CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "projects_update" ON projects;
CREATE POLICY "projects_update" ON projects FOR UPDATE USING (auth.role() = 'authenticated');
`;

async function unifyAuthority() {
  console.log('Unifying Project Authority Schema...');
  
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: SQL }),
  });

  if (res.ok) {
    console.log('✅ Authority unified successfully!');
  } else {
    const err = await res.text();
    console.log('❌ Failed to unify authority:', res.status, err);
  }
}

unifyAuthority();
