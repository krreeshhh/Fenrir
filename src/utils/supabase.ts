import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type UserRole = 'employee' | 'project_lead' | 'manager' | 'unit_head' | 'admin'

export interface UserMetadata {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  score: number
}
