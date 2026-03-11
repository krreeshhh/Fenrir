import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://papkgiajcnndgvgrusog.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcGtnaWFqY25uZGd2Z3J1c29nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIyODU3NiwiZXhwIjoyMDg4ODA0NTc2fQ.eRvYKKSYwacWpPBmR0WfucGJLWXclBeWDr8mkSJpv_s';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const emailToUpdate = 'summaadhaa@gmail.com';
const newRole = 'admin';

async function main() {
  console.log(`Looking for user with email: ${emailToUpdate}`);

  // Find user
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }

  const user = usersData.users.find(u => u.email === emailToUpdate);
  if (!user) {
    console.log(`User not found with email ${emailToUpdate}`);
    return;
  }

  console.log(`Found user: ${user.id}`);

  // Update auth metadata
  console.log(`Updating auth metadata...`);
  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, role: newRole }
  });

  if (updateError) {
    console.error('Error updating auth metadata:', updateError);
  } else {
    console.log('Auth metadata updated.');
  }

  // Check if user exists in users_metadata table
  const { data: currentMetadata } = await supabase
    .from('users_metadata')
    .select('*')
    .eq('id', user.id)
    .single();

  if (currentMetadata) {
    console.log(`Updating users_metadata table...`);
    const { error: tableUpdateError } = await supabase
      .from('users_metadata')
      .update({ role: newRole })
      .eq('id', user.id);

    if (tableUpdateError) console.error('Table update error:', tableUpdateError);
    else console.log('users_metadata table updated.');
  } else {
    console.log(`Creating record in users_metadata table...`);
    const { error: insertError } = await supabase
      .from('users_metadata')
      .insert({
        id: user.id,
        role: newRole,
        full_name: user.user_metadata?.full_name || 'Summaa Dhaa'
      });

    if (insertError) console.error('Table insert error:', insertError);
    else console.log('users_metadata table inserted.');
  }

  console.log(`Role updated to ${newRole} for ${emailToUpdate} successfully!`);
}

main();
