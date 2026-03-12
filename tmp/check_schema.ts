import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function checkSchema() {
  const { data, error } = await supabase
    .from('checklist_allocations')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error fetching checklist_allocations:', error)
  } else {
    console.log('Checklist Allocations columns:', Object.keys(data[0] || {}))
  }

  const { data: checklists, error: chkError } = await supabase
    .from('checklists')
    .select('*')
    .limit(1)

  if (chkError) {
    console.error('Error fetching checklists:', chkError)
  } else {
    console.log('Checklists columns:', Object.keys(checklists[0] || {}))
  }
}

checkSchema()
