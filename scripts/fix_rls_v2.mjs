import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://papkgiajcnndgvgrusog.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcGtnaWFqY25uZGd2Z3J1c29nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIyODU3NiwiZXhwIjoyMDg4ODA0NTc2fQ.eRvYKKSYwacWpPBmR0WfucGJLWXclBeWDr8mkSJpv_s';

const PROJECT_REF = 'papkgiajcnndgvgrusog';

const SQL = `
-- 1. Projects Policies
DROP POLICY IF EXISTS "projects_select" ON projects;
CREATE POLICY "projects_select" ON projects FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "projects_insert" ON projects;
CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "projects_update" ON projects;
CREATE POLICY "projects_update" ON projects FOR UPDATE USING (auth.role() = 'authenticated');

-- 2. Project Allocations Policies
DROP POLICY IF EXISTS "project_alloc_select" ON project_allocations;
CREATE POLICY "project_alloc_select" ON project_allocations FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "project_alloc_insert" ON project_allocations;
CREATE POLICY "project_alloc_insert" ON project_allocations FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "project_alloc_update" ON project_allocations;
CREATE POLICY "project_alloc_update" ON project_allocations FOR UPDATE USING (auth.role() = 'authenticated');

-- 3. Checklists Policies
DROP POLICY IF EXISTS "checklists_select" ON checklists;
CREATE POLICY "checklists_select" ON checklists FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "checklists_insert" ON checklists;
CREATE POLICY "checklists_insert" ON checklists FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "checklists_update" ON checklists;
CREATE POLICY "checklists_update" ON checklists FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. Checklist Allocations Policies
DROP POLICY IF EXISTS "checklist_alloc_select" ON checklist_allocations;
CREATE POLICY "checklist_alloc_select" ON checklist_allocations FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "checklist_alloc_insert" ON checklist_allocations;
CREATE POLICY "checklist_alloc_insert" ON checklist_allocations FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "checklist_alloc_update" ON checklist_allocations;
CREATE POLICY "checklist_alloc_update" ON checklist_allocations FOR UPDATE USING (auth.role() = 'authenticated');

-- 5. Users Metadata
DROP POLICY IF EXISTS "users_metadata_select" ON users_metadata;
CREATE POLICY "users_metadata_select" ON users_metadata FOR SELECT USING (auth.role() = 'authenticated');

-- Ensure RLS is enabled on all critical tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_metadata ENABLE ROW LEVEL SECURITY;
`;

async function applyRLS() {
  console.log('Applying Comprehensive RLS policies...');
  
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: SQL }),
  });

  if (res.ok) {
    console.log('✅ RLS policies applied successfully!');
  } else {
    const err = await res.text();
    console.log('❌ Failed to apply RLS:', res.status, err);
  }
}

applyRLS();
