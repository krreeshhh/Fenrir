import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const url = new URL(request.url)
  
  // Public routes
  if (!user) {
    if (url.pathname !== '/' && !url.pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return response
  }

  // Get user role from metadata table
  const { data: profile, error } = await supabase
    .from('users_metadata')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error("Middleware fetch role error:", error.message)
  }

  // Fallback chain: DB profile -> Auth metadata -> Default "employee"
  const rawRole = profile?.role || user.user_metadata?.role || 'employee'
  
  // Force lowercase and map both spaces and underscores to hyphens
  const role = String(rawRole).toLowerCase()
  const rolePath = role.replace(/[\s_]+/g, '-')

  // Redirect if trying to access another role's pages
  const roles = ['employee', 'project-lead', 'manager', 'unit-head']
  const matchedRole = roles.find(r => url.pathname.toLowerCase().startsWith(`/${r}`))

  if (matchedRole && matchedRole !== rolePath) {
    return NextResponse.redirect(new URL(`/${rolePath}`, request.url))
  }

  // Redirect from root to dashboard if logged in
  if (url.pathname === '/') {
    return NextResponse.redirect(new URL(`/${rolePath}`, request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
