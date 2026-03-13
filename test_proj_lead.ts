import { createAdminClient } from './src/utils/supabase.ts';
async function run() { 
  const s = createAdminClient(); 
  const {data: p, error: pe} = await s.from('projects').select('*').eq('project_lead_id', 'c58a0272-12f6-42ff-b720-c9f655f18824'); 
  console.log('projects for lead:', p);
} 
run().then(() => process.exit(0));
