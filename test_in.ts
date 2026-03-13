import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('checklist_allocations')
    .select('*')
    .in('checklists.project_id', []);
    
  console.log("Empty array in() error:", error);
  console.log("Empty array in() data:", data);
}

run();
