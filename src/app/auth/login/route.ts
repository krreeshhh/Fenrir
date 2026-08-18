import { createClient } from '@/utils/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const provider = searchParams.get('provider') || 'google'
  const source = searchParams.get('source') || 'web'
  
  const supabase = await createClient()

  // We initiate the OAuth flow from the server.
  // This ensures the PKCE code_verifier is stored in the cookies of the CURRENT browser.
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as any,
    options: {
      redirectTo: `${origin}/auth/callback?source=${source}`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
        // Optional: you can add scopes here if needed
        scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.events',
      }
    }
  })

  if (error) {
    console.error('Auth initiation error:', error)
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`)
  }

  if (data?.url) {
    // Redirect the browser to Google's consent screen
    return NextResponse.redirect(data.url)
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=Could+not+initiate+auth+flow`)
}
