import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://papkgiajcnndgvgrusog.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcGtnaWFqY25uZGd2Z3J1c29nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIyODU3NiwiZXhwIjoyMDg4ODA0NTc2fQ.eRvYKKSYwacWpPBmR0WfucGJLWXclBeWDr8mkSJpv_s';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkCols() {
  const { data: row } = await supabase.from('checklist_allocations').select('*').limit(1);
  console.log('checklist_allocations row:', row ? row[0] : 'No data');

  const { data: row2 } = await supabase.from('checklists').select('*');
  console.log('All checklists:', row2);

  const { data: row3 } = await supabase.from('projects').select('*');
  console.log('All projects:', row3);
}

checkCols();
