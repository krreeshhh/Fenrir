import { createAdminClient } from './src/utils/supabase.ts';
async function run() { 
  const supabase = createAdminClient(); 
  const { data, error } = await supabase.rpc('get_policies'); // Supabase RPC if exists?
  // Let's just query pg_policies directly
  const { data: policies, error: polErr } = await supabase.from('pg_policies').select('*').eq('tablename', 'projects');
  
  if (polErr) {
    // try via a raw query if pg_policies is not exposed in public schema
    console.error("Policy fetch error:", polErr);
  } else {
    console.log("Policies:", policies);
  }
} 
run().then(() => process.exit(0));
