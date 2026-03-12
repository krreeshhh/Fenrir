import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://papkgiajcnndgvgrusog.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcGtnaWFqY25uZGd2Z3J1c29nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIyODU3NiwiZXhwIjoyMDg4ODA0NTc2fQ.eRvYKKSYwacWpPBmR0WfucGJLWXclBeWDr8mkSJpv_s';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkData() {
  console.log('--- ADMIN DATA CHECK ---');
  
  const { data: meetings, error: mErr } = await supabase.from('meetings').select('*');
  console.log('Total Meetings in DB:', meetings?.length || 0);
  if (meetings) console.log('Latest Meeting:', meetings[meetings.length-1]);

  const { data: parts, error: pErr } = await supabase.from('meeting_participants').select('*');
  console.log('Total Participants in DB:', parts?.length || 0);
  
  if (mErr || pErr) console.error('Error fetching:', mErr || pErr);

  console.log('\nChecking RLS Status...');
  // We can infer RLS status by trying a query with a standard ANON key vs SERVICE key
  // But for now, let's just try to fix it.
}

checkData();
