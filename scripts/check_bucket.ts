
import { createClient } from '../src/utils/supabase.js';
const supabase = createClient();
async function check() {
  const { data, error } = await supabase.storage.getBucket('profiles');
  if (error) {
    if (error.message.includes('not found')) {
      console.log('BUCKET_MISSING');
    } else {
      console.log('ERROR:', error.message);
    }
  } else {
    console.log('BUCKET_EXISTS');
  }
  process.exit(0);
}
check();
