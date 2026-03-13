
import { createClient } from '../src/utils/supabase.js';
const supabase = createClient();
async function check() {
  const { data, error } = await supabase.from('users_metadata').select('avatar_url').limit(1);
  if (error) {
    if (error.message.includes('column "avatar_url" does not exist')) {
      console.log('COLUMN_MISSING');
    } else {
      console.log('ERROR:', error.message);
    }
  } else {
    console.log('COLUMN_EXISTS');
  }
  process.exit(0);
}
check();
