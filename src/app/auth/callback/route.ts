import { createClient } from '@/utils/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in search params, use it as the redirection URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Fetch role to redirect to correct dashboard
        const { data: profile } = await supabase
          .from('users_metadata')
          .select('role')
          .eq('id', user.id)
          .single()
        
        // Fallback chain: DB profile -> Auth metadata -> Default "employee"
        const rawRole = profile?.role || user.user_metadata?.role || 'employee'
        
        // Force lowercase and map both spaces and underscores to hyphens
        const role = String(rawRole).toLowerCase()
        const rolePath = role.replace(/[\s_]+/g, '-')

        return NextResponse.redirect(`${origin}/${rolePath}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
