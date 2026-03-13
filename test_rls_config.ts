import { createAdminClient } from './src/utils/supabase.ts';
async function run() { 
  const s = createAdminClient(); 
  
  // Try querying pg_class for RLS
  const { data: rlsData, error: rlsErr } = await s.rpc('exec_sql', {
    sql_string: `
      SELECT relname, relrowsecurity 
      FROM pg_class 
      WHERE relname IN ('projects', 'checklist_allocations', 'users_metadata');
    `
  });
  console.log("RLS Status:", rlsData, rlsErr);

  const { data: polData, error: polErr } = await s.rpc('exec_sql', {
    sql_string: `
      SELECT * FROM pg_policies WHERE tablename IN ('projects', 'checklist_allocations', 'users_metadata');
    `
  });
  console.log("Policies:", polData, polErr);

} 
run().then(() => process.exit(0));
