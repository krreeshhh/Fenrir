import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = 'https://papkgiajcnndgvgrusog.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcGtnaWFqY25uZGd2Z3J1c29nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIyODU3NiwiZXhwIjoyMDg4ODA0NTc2fQ.eRvYKKSYwacWpPBmR0WfucGJLWXclBeWDr8mkSJpv_s';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkProjectData() {
  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
       *,
       manager:manager_id(full_name),
       lead:project_lead_id(full_name)
    `);

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("PROJECTS DATA:");
  console.log(JSON.stringify(projects, null, 2));

  // Also check allocations to see team nodes
  const { data: allocations } = await supabase
    .from('checklist_allocations')
    .select('id, employee_id, checklists!inner(project_id)');
    
  console.log("\nALLOCATIONS SAMPLE:");
  console.log(JSON.stringify(allocations, null, 2));
}

checkProjectData();
