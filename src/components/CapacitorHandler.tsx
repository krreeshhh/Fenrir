"use client"

import { useEffect } from 'react'
import { App } from '@capacitor/app'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase'

export default function CapacitorHandler() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if we are running in Capacitor
    const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor

    if (isCapacitor) {
      // Listen for deep links
      App.addListener('appUrlOpen', async (event: any) => {
        const url = new URL(event.url)
        
        // Handle auth success: com.pivot.app://auth/success?role=employee&access_token=...&refresh_token=...
        if (url.host === 'auth' && url.pathname === '/success') {
          const role = url.searchParams.get('role') || 'employee'
          const accessToken = url.searchParams.get('access_token')
          const refreshToken = url.searchParams.get('refresh_token')

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })
          }

          router.push(`/${role}`)
          return;
        }

        // Handle direct auth callback: com.pivot.app://auth/callback?code=...
        if (url.host === 'auth' && url.pathname === '/callback') {
          const code = url.searchParams.get('code')
          
          if (code) {
            // Exchange the code for a session
            const { error } = await supabase.auth.exchangeCodeForSession(code)
            
            if (!error) {
              // Get user role and redirect
              const { data: { user } } = await supabase.auth.getUser()
              if (user) {
                const { data: profile } = await supabase
                  .from('users_metadata')
                  .select('role')
                  .eq('id', user.id)
                  .single()
                
                const role = profile?.role || user.user_metadata?.role || 'employee'
                const rolePath = role.toLowerCase().replace(/[\s_]+/g, '-')
                router.push(`/${rolePath}`)
              }
            } else {
              router.push('/auth/auth-code-error')
            }
          }
        }
      })
    }
  }, [router, supabase])

  return null
}
