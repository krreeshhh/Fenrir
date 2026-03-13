
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function setupStorage() {
  console.log('Setting up storage...');
  
  // 1. Create the bucket
  const { data: bucket, error: bucketError } = await supabase.storage.createBucket('profiles', {
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/*']
  });

  if (bucketError) {
    if (bucketError.message.includes('already exists')) {
      console.log('Bucket "profiles" already exists.');
    } else {
      console.error('Error creating bucket:', bucketError.message);
      process.exit(1);
    }
  } else {
    console.log('Bucket "profiles" created.');
  }

  console.log('Storage setup complete.');
  process.exit(0);
}

setupStorage();
