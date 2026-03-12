import { createClient } from '@/utils/supabase-server'
import { google } from 'googleapis'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session || !session.provider_token) {
    return NextResponse.json({ error: 'Authorize with Google to sync calendar.' }, { status: 401 })
  }

  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: session.provider_token })

  const calendar = google.calendar({ version: 'v3', auth })

  try {
    // Fetch upcoming events from the primary calendar
    const { data } = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 15,
      singleEvents: true,
      orderBy: 'startTime',
    })

    const events = data.items || []
    const syncedEvents = []

    for (const event of events) {
      if (!event.start?.dateTime) continue

      const startTime = new Date(event.start.dateTime)
      const endTime = event.end?.dateTime ? new Date(event.end.dateTime) : new Date(startTime.getTime() + 30 * 60000)
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000)

      const meetingData = {
        google_event_id: event.id,
        title: event.summary || 'Untitled Mission Sync',
        scheduled_at: startTime.toISOString(),
        duration_minutes: duration,
        link: event.hangoutLink || event.htmlLink || null
      }

      // Upsert by google_event_id
      const { data: inserted, error: upsertError } = await supabase
        .from('meetings')
        .upsert(meetingData, { onConflict: 'google_event_id' })
        .select()
        .single()

      if (!upsertError && inserted) {
        syncedEvents.push(inserted)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Synchronized ${syncedEvents.length} calendar nodes.`,
      count: syncedEvents.length
    })

  } catch (error: any) {
    console.error('Calendar Sync Error:', error)
    return NextResponse.json({ 
      error: 'Failed to synchronize with Google Calendar.',
      details: error.message 
    }, { status: 500 })
  }
}
