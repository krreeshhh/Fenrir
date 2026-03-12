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

  // 1. Get Session instead of getUser (faster as it uses the JWT)
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  const url = new URL(request.url)
  
  // Public routes
  if (!user) {
    if (url.pathname !== '/' && !url.pathname.startsWith('/auth') && !url.pathname.startsWith('/api/auth')) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return response
  }

  // 2. Optimized Role Retrieval: Check Auth Metadata first to avoid DB hit
  // We only fetch from DB if metadata is missing (sync fallback)
  let role = user.user_metadata?.role

  if (!role) {
     const { data: profile } = await supabase
       .from('users_metadata')
       .select('role')
       .eq('id', user.id)
       .single()
     role = profile?.role || 'employee'
  }

  // Normalize role path
  const rolePath = String(role).toLowerCase().replace(/[\s_]+/g, '-')

  // 3. Early Exit for root to dashboard redirect
  if (url.pathname === '/') {
    return NextResponse.redirect(new URL(`/${rolePath}`, request.url))
  }

  // 4. Role Protection
  const protectedRoles = ['employee', 'project-lead', 'manager', 'unit-head', 'admin']
  const currentPathPrefix = url.pathname.split('/')[1]

  if (protectedRoles.includes(currentPathPrefix) && currentPathPrefix !== rolePath) {
     // If accessing someone else's area, redirect back to own dashboard
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
