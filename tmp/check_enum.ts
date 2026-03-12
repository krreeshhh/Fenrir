import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function checkEnum() {
  const { data, error } = await supabase.rpc('get_enum_values', { enum_type: 'project_status' })
  
  if (error) {
    // If RPC doesn't exist, try to just fetch one project and see its status
    const { data: proj } = await supabase.from('projects').select('status').limit(1)
    console.log('Sample Project Status:', proj?.[0]?.status)
  } else {
    console.log('Project Status Enum Values:', data)
  }
}

checkEnum()
