import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://papkgiajcnndgvgrusog.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcGtnaWFqY25uZGd2Z3J1c29nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIyODU3NiwiZXhwIjoyMDg4ODA0NTc2fQ.eRvYKKSYwacWpPBmR0WfucGJLWXclBeWDr8mkSJpv_s';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function seedProject() {
  const newProject = {
    name: 'Project: Aether Bridge',
    description: 'Cross-dimensional data synchronization and protocol bridge between legacy nodes and the new PIVOT matrix.',
    status: 'active',
    completion_percentage: 15,
    deadline: '2026-11-15',
    priority: 'High',
    risk_factor: 'Safe',
    latency: '4ms'
  };

  console.log('Inserting seed project...');
  const { data, error } = await supabase
    .from('projects')
    .insert(newProject)
    .select();

  if (error) {
    console.error('Error seeding project:', error);
  } else {
    console.log('Project seeded successfully:', data);
    const projectId = data[0].id;

    // Allocate to the first available project lead
    const { data: lead } = await supabase
      .from('users_metadata')
      .select('id')
      .eq('role', 'project_lead')
      .limit(1)
      .single();

    if (lead) {
      const { error: allocError } = await supabase
        .from('project_allocations')
        .insert({
          project_id: projectId,
          project_lead_id: lead.id,
          deadline: newProject.deadline
        });
      
      if (!allocError) {
        console.log(`Allocated project ${projectId} to lead ${lead.id}`);
      } else {
        console.error('Error allocating project:', allocError);
      }
    }
  }
}

seedProject();
