import { createAdminClient } from './src/utils/supabase.ts';
async function run() { 
  const s = createAdminClient(); 
  
  // Disable RLS on projects temporarily or just enable it properly:
  const { error } = await s.rpc('exec_sql', {
    sql_string: `
      ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.checklist_allocations DISABLE ROW LEVEL SECURITY;
    `
  });

  console.log("RPC exec_sql error:", error);
} 
run().then(() => process.exit(0));
