import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = 'https://papkgiajcnndgvgrusog.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcGtnaWFqY25uZGd2Z3J1c29nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIyODU3NiwiZXhwIjoyMDg4ODA0NTc2fQ.eRvYKKSYwacWpPBmR0WfucGJLWXclBeWDr8mkSJpv_s';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkRLS() {
  const { data: policies, error } = await supabase.rpc('get_policies'); // Might not work if not defined
  
  // Alternative: query pg_policies
  const PROJECT_REF = 'papkgiajcnndgvgrusog';
  const SQL = `SELECT * FROM pg_policies WHERE tablename = 'projects';`;

  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`, // Still hope this is a management key? No, it's service role.
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: SQL }),
  });

  if (res.ok) {
    console.log('Policies:', await res.json());
  } else {
    // If management API fails, try to just fetch projects as a normal authenticated user would
    console.log('Testing project fetch with Service Role (should bypass RLS)...');
    const { data, error: err } = await supabase.from('projects').select('*');
    console.log('Result:', data?.length || 0, 'projects found');
    if (err) console.error(err);
  }
}

checkRLS();
