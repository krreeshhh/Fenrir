import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://papkgiajcnndgvgrusog.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcGtnaWFqY25uZGd2Z3J1c29nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIyODU3NiwiZXhwIjoyMDg4ODA0NTc2fQ.eRvYKKSYwacWpPBmR0WfucGJLWXclBeWDr8mkSJpv_s';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Supabase JS client doesn't have a direct SQL executor for the anon/service keys.
// We use the PostgREST RPC approach — we need a stored procedure or the management API.
// The simplest fix: use the supabase-js admin to directly call the Management API REST endpoint.

const MANAGEMENT_TOKEN = SERVICE_KEY;
const PROJECT_REF = 'papkgiajcnndgvgrusog';

const SQL = `
-- Drop policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "users_metadata_select" ON users_metadata;
DROP POLICY IF EXISTS "users_metadata_update_own" ON users_metadata;
DROP POLICY IF EXISTS "users_metadata_insert_own" ON users_metadata;

-- Allow any authenticated user to SELECT all rows (needed for leaderboard, team pages etc.)
CREATE POLICY "users_metadata_select"
ON users_metadata
FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow users to UPDATE only their own row
CREATE POLICY "users_metadata_update_own"
ON users_metadata
FOR UPDATE
USING (auth.uid() = id);

-- Allow users to INSERT their own row on first login via OAuth
CREATE POLICY "users_metadata_insert_own"
ON users_metadata
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Give full access for reading checklist_allocations to authenticated users
DROP POLICY IF EXISTS "checklist_alloc_select" ON checklist_allocations;
CREATE POLICY "checklist_alloc_select"
ON checklist_allocations
FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow employee to update their own allocations (e.g. mark complete)
DROP POLICY IF EXISTS "checklist_alloc_update_own" ON checklist_allocations;
CREATE POLICY "checklist_alloc_update_own"
ON checklist_allocations
FOR UPDATE
USING (auth.uid() = employee_id);

-- Allow authenticated users to read all projects  
DROP POLICY IF EXISTS "projects_select" ON projects;
CREATE POLICY "projects_select"
ON projects
FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow authenticated users to read all checklists
DROP POLICY IF EXISTS "checklists_select" ON checklists;
CREATE POLICY "checklists_select"
ON checklists
FOR SELECT
USING (auth.role() = 'authenticated');
`;

console.log('Applying RLS policies to Supabase via Management API...');

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${MANAGEMENT_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: SQL }),
});

if (res.ok) {
  const data = await res.json();
  console.log('✅ RLS policies applied successfully!');
  console.log('Users can now update their own profile data — changes will persist after page reload.');
} else {
  const err = await res.text();
  console.log('Management API returned:', res.status, err);
  console.log('');
  console.log('⚠️  Automatic RLS fix failed. Please run this SQL manually in your Supabase Dashboard:');
  console.log('   → Go to: https://supabase.com/dashboard/project/papkgiajcnndgvgrusog/sql/new');
  console.log('   → Paste and run the following SQL:');
  console.log('');
  console.log(SQL);
}
