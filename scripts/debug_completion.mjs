import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://papkgiajcnndgvgrusog.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcGtnaWFqY25uZGd2Z3J1c29nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIyODU3NiwiZXhwIjoyMDg4ODA0NTc2fQ.eRvYKKSYwacWpPBmR0WfucGJLWXclBeWDr8mkSJpv_s';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function debugData() {
  console.log('--- DEBUGGING DATA FOR COMPLETION PAGE ---');
  
  // 1. Projects
  const { data: projects } = await supabase.from('projects').select('*');
  console.log('Projects:', projects?.map(p => ({ id: p.id, name: p.name, lead: p.project_lead_id })));

  // 2. Checklist Allocations that are completed
  const { data: completed } = await supabase
    .from('checklist_allocations')
    .select(`
      id, 
      status, 
      verified, 
      employee_id,
      checklist_id,
      checklists (title, project_id)
    `)
    .eq('status', 'completed');
  
  console.log('Completed Allocations:', JSON.stringify(completed, null, 2));

  // 3. Check specific project leads
  const { data: leads } = await supabase.from('users_metadata').select('id, full_name, role').eq('role', 'project_lead');
  console.log('Project Leads:', leads);
}

debugData();
