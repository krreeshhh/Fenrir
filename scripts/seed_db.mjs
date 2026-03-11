import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://papkgiajcnndgvgrusog.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcGtnaWFqY25uZGd2Z3J1c29nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIyODU3NiwiZXhwIjoyMDg4ODA0NTc2fQ.eRvYKKSYwacWpPBmR0WfucGJLWXclBeWDr8mkSJpv_s';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('Fetching all authenticated users to generate relations...');
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError || !usersData?.users.length) {
    console.error('Error or no users found to map data to:', usersError);
    return;
  }
  
  const users = usersData.users;
  console.log(`Found ${users.length} users. Wiping old temporary data and seeding...`);

  // Clear existing mock data
  await supabase.from('checklist_allocations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('checklists').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Let's create two mock projects
  console.log('Inserting Projects...');
  const { data: projects, error: pError } = await supabase.from('projects').insert([
    { name: 'Project Hydra', description: 'Next-gen analytics engine refactor', status: 'active', completion_percentage: 45 },
    { name: 'Project Orion', description: 'Q3 Enterprise Client Delivery', status: 'active', completion_percentage: 12 },
    { name: 'Project Apollo', description: 'Internal tool deprecation', status: 'on_hold', completion_percentage: 80 }
  ]).select();

  if (pError || !projects) {
    console.error('Failed to create projects', pError);
    return;
  }

  const p1 = projects[0];
  const p2 = projects[1];

  console.log('Inserting Checklists...');
  const { data: checklists, error: cError } = await supabase.from('checklists').insert([
    { title: 'Setup CI/CD Pipeline', project_id: p1.id, status: 'ongoing' },
    { title: 'Write unit tests for Auth', project_id: p1.id, status: 'not_started' },
    { title: 'API documentation update', project_id: p2.id, status: 'ongoing' },
    { title: 'Client meeting for feedback', project_id: p2.id, status: 'not_started' }
  ]).select();

  if (cError || !checklists) {
     console.error('Failed to create checklists', cError);
     return;
  }

  console.log('Inserting Checklist Allocations to all existing users...');
  
  for (const user of users) {
     await supabase.from('checklist_allocations').insert([
       { checklist_id: checklists[0].id, employee_id: user.id, status: 'ongoing', role_on_project: 'Engineering', difficulty_rating: 'Hard', score_awarded: 450 },
       { checklist_id: checklists[1].id, employee_id: user.id, status: 'not_started', role_on_project: 'Engineering', difficulty_rating: 'Medium', score_awarded: 200 },
       { checklist_id: checklists[2].id, employee_id: user.id, status: 'ongoing', role_on_project: 'Technical Writing', difficulty_rating: 'Easy', score_awarded: 150 }
     ]);
  }

  // Set randomized scores in users_metadata so leaderboards look cool
  for (const user of users) {
     const score = Math.floor(Math.random() * 3000) + 500;
     await supabase.from('users_metadata')
                   .update({ score: score, full_name: user.user_metadata?.full_name || user.email.split('@')[0] })
                   .eq('id', user.id);
  }

  console.log('✅ Database successfully seeded with real relational data tied to your authentication accounts!');
}

main();
