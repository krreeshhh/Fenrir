import { createAdminClient } from './src/utils/supabase.ts';
async function run() { 
  const s = createAdminClient(); 
  const {data: p, error: pe} = await s.from('projects').select('*'); 
  console.log('projects error:', pe);
  console.log('projects:', p);

  const {data: ca, error: cae} = await s.from('checklist_allocations').select(`
    id, created_at,
    users_metadata (full_name),
    checklists!inner (title, project_id)
  `);
  console.log('ca error:', cae);
  console.log('ca:', ca);
} 
run().then(() => process.exit(0));
