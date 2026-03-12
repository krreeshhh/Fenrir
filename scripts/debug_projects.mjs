import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = 'https://papkgiajcnndgvgrusog.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcGtnaWFqY25uZGd2Z3J1c29nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIyODU3NiwiZXhwIjoyMDg4ODA0NTc2fQ.eRvYKKSYwacWpPBmR0WfucGJLWXclBeWDr8mkSJpv_s';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function debugProjects() {
  const { data: cols, error: errCols } = await supabase.from('projects').select('*').limit(1);
  if (errCols) {
     console.error("Projects Fetch Error:", errCols);
  } else {
     console.log("Sample Project Keys:", Object.keys(cols[0] || {}));
  }

  const { data: joinTest, error: errJoin } = await supabase
    .from('projects')
    .select(`
       id,
       manager_id,
       project_lead_id
    `)
    .limit(5);

  if (errJoin) {
    console.error("Simple Join Selection Error:", errJoin);
  } else {
    console.log("Simple Data:", joinTest);
  }
}

debugProjects();
