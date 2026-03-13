import { createAdminClient } from './src/utils/supabase.ts';
async function run() { 
  const s = createAdminClient(); 
  
  const { error } = await s.rpc('exec_sql', {
    sql_string: `
      DROP POLICY IF EXISTS "Leads can view their projects" ON public.projects;
      CREATE POLICY "Leads can view their projects" 
      ON public.projects 
      FOR SELECT 
      USING (auth.uid() = project_lead_id);
    `
  });

  console.log("RPC exec_sql error:", error);
} 
run().then(() => process.exit(0));
