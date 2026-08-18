import { createClient } from '@/utils/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in search params, use it as the redirection URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && session) {
      const user = session.user
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

        // BRIDGE: Detect if this login happened via a mobile browser and we should jump back to the app
        const userAgent = request.headers.get('user-agent') || ''
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
        const isAppSource = searchParams.get('source') === 'app'

        if (isMobile || isAppSource) {
          // Redirect to a specialized bridge page that handles the jump back to the app
          // We include the tokens to sync them back to the Capacitor local storage
          const tokens = `&access_token=${session.access_token}&refresh_token=${session.refresh_token}`
          return NextResponse.redirect(`${origin}/auth/success?role=${rolePath}${tokens}`)
        }

        return NextResponse.redirect(`${origin}/${rolePath}`)
      }
    } else {
      console.error('Auth exchange error:', error)
      const message = error?.message || 'Handshake synchronization failed'
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(message)}`)
    }
  }

  const errorDesc = searchParams.get('error_description') || searchParams.get('error') || 'Unknown auth error'
  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(errorDesc)}`)
}
