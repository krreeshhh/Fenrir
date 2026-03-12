import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://papkgiajcnndgvgrusog.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcGtnaWFqY25uZGd2Z3J1c29nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIyODU3NiwiZXhwIjoyMDg4ODA0NTc2fQ.eRvYKKSYwacWpPBmR0WfucGJLWXclBeWDr8mkSJpv_s';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function seedChecklistSteps() {
  console.log('Fetching Operational Context...');

  // 1. Get the latest project (Aether Bridge)
  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('name', 'Project: Aether Bridge')
    .limit(1)
    .single();

  if (!project) {
    console.error('Project "Aether Bridge" not found. Run seed_project.mjs first.');
    return;
  }

  // 2. Get the lead allocated to this project
  const { data: leadAllocation } = await supabase
    .from('project_allocations')
    .select('project_lead_id')
    .eq('project_id', project.id)
    .limit(1)
    .single();

  const leadId = leadAllocation?.project_lead_id;

  // 3. Get employees to assign tasks to
  const { data: employees } = await supabase
    .from('users_metadata')
    .select('id, full_name')
    .eq('role', 'employee')
    .limit(3);

  if (!employees || employees.length === 0) {
    console.error('No employees found in matrix.');
    return;
  }

  const tasks = [
    {
      title: 'Initialize Quantum Link',
      description: 'Establish the primary connection between legacy node alpha and the aether bridge.',
      role: 'Communications Lead',
      difficulty: 'Hard'
    },
    {
      title: 'Data Integrity Audit',
      description: 'Run checksums on current packet streams to ensure no corruption during dimensional shift.',
      role: 'Security Analyst',
      difficulty: 'Medium'
    },
    {
      title: 'Protocol Handshake',
      description: 'Exchange master keys between the gatekeeper and the internal pivot authority.',
      role: 'Protocol Officer',
      difficulty: 'Easy'
    },
    {
      title: 'Aether Shield Calibration',
      description: 'Monitor heat signatures and latency spikes during the final stabilization phase.',
      role: 'Systems Engineer',
      difficulty: 'Hard'
    }
  ];

  console.log(`Seeding ${tasks.length} mission-critical tasks for ${project.name}...`);

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const assignee = employees[i % employees.length];

    // Create Checklist Item
    const { data: checklist, error: chkError } = await supabase
      .from('checklists')
      .insert({
        project_id: project.id,
        title: task.title,
        description: task.description,
        project_lead_id: leadId,
        status: 'ongoing'
      })
      .select()
      .single();

    if (checklist) {
      // Allocate to employee
      const { error: allocError } = await supabase
        .from('checklist_allocations')
        .insert({
          checklist_id: checklist.id,
          employee_id: assignee.id,
          deadline: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString(), // Incremental deadlines
          role_on_project: task.role,
          difficulty_rating: task.difficulty,
          status: 'not_started'
        });

      if (!allocError) {
        console.log(`✅ Task "${task.title}" assigned to ${assignee.full_name} [${task.role}]`);
      } else {
        console.error(`❌ Error allocating task ${task.title}:`, allocError);
      }
    } else {
       console.error(`❌ Error creating checklist ${task.title}:`, chkError);
    }
  }

  console.log('Operational seeding complete.');
}

seedChecklistSteps();
