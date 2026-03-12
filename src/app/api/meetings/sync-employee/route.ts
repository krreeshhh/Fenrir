import { createClient } from '@/utils/supabase-server'
import { createAdminClient } from '@/utils/supabase-admin'
import { google } from 'googleapis'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (!session || !session.provider_token) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
    }

    const { meetingId } = await req.json()

    // 1. Fetch meeting details
    const { data: meeting, error: mError } = await adminClient
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single()

    if (mError || !meeting) throw new Error('Meeting not found')

    // 2. Add to Employee's Google Calendar
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
    auth.setCredentials({ access_token: session.provider_token })
    const calendar = google.calendar({ version: 'v3', auth })

    const startTime = new Date(meeting.scheduled_at)
    const endTime = new Date(startTime.getTime() + (meeting.duration_minutes || 30) * 60000)

    const event = {
      summary: `[SYNC] ${meeting.title}`,
      description: 'PIVOT Operation Node Synchronization',
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
      location: meeting.link || 'Remote Node',
      reminders: { useDefault: true }
    }

    await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event
    })

    // 3. Mark as synced in DB (if column exists, otherwise just log success)
    try {
      await adminClient
        .from('meeting_participants')
        .update({ is_synced: true })
        .eq('meeting_id', meetingId)
        .eq('user_id', session.user.id)
    } catch (e) {
      console.log('is_synced update skipped (column might not exist)');
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Employee Sync Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
