import { createClient } from '@/utils/supabase-server'
import { createAdminClient } from '@/utils/supabase-admin'
import { google } from 'googleapis'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session Error:', sessionError)
      return NextResponse.json({ error: 'SESSION_ERROR', message: sessionError.message }, { status: 401 })
    }

    if (!session || !session.provider_token) {
      console.error('Auth Required: No session or provider token')
      return NextResponse.json({ error: 'AUTH_REQUIRED', message: 'Please sign in with Google' }, { status: 401 })
    }

    const body = await req.json()
    const { title, scheduledAt, durationMinutes, participants } = body
    
    // Validate inputs
    if (!title || !scheduledAt || isNaN(new Date(scheduledAt).getTime())) {
      return NextResponse.json({ error: 'INVALID_PAYLOAD', message: 'Missing title or invalid date' }, { status: 400 })
    }

    console.log('Meeting Request Payload:', { title, scheduledAt, durationMinutes, participantsCount: participants?.length })

    // 1. Create meeting in PIVOT DB
    const { data: meeting, error: meetingError } = await adminClient
      .from('meetings')
      .insert({
        title,
        scheduled_at: scheduledAt,
        duration_minutes: parseInt(durationMinutes) || 30
      })
      .select()
      .single()

    if (meetingError) {
      console.error('DB Meeting Insert Error:', meetingError)
      throw new Error(`Database Error: ${meetingError.message}`)
    }

    // 2. Add participants to DB
    const uniqueParticipantIds = Array.from(new Set([...(participants || []), session.user.id]))
    const participantEntries = uniqueParticipantIds.map((uid: string) => ({
      meeting_id: meeting.id,
      user_id: uid
    }))

    const { error: partError } = await adminClient
      .from('meeting_participants')
      .insert(participantEntries)

    if (partError) {
      console.error('DB Participants Insert Error:', partError)
      // We don't necessarily want to fail the whole thing if participants fail, 
      // but UNIQUE constraint is likely the culprit if it does.
      // throw new Error(`Participant Error: ${partError.message}`)
    }

    // 3. Create Google Calendar Event
    let gEvent;
    try {
      const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      )
      auth.setCredentials({ access_token: session.provider_token })
      const calendar = google.calendar({ version: 'v3', auth })

      const duration = parseInt(durationMinutes) || 30;
      const endTime = new Date(new Date(scheduledAt).getTime() + duration * 60000)

      const event = {
        summary: title,
        description: 'PIVOT Node Synchronization Session',
        start: { dateTime: new Date(scheduledAt).toISOString() },
        end: { dateTime: endTime.toISOString() },
        attendees: [], // We'll let employees "Okiee" to add it themselves
        reminders: { useDefault: true },
        conferenceData: {
          createRequest: {
            requestId: `pivot-${meeting.id}-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        }
      }

      const gResponse = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        conferenceDataVersion: 1
      })
      gEvent = gResponse.data;
      console.log('Google Event Created:', gEvent.id);
    } catch (gError: any) {
      console.error('Google Calendar API Error Details:', gError.response?.data || gError.message)
      throw new Error(`Google Calendar Sync Failed: ${gError.message}`)
    }

    // Update meeting with link
    if (gEvent) {
      await adminClient
        .from('meetings')
        .update({ 
          link: gEvent.hangoutLink || gEvent.htmlLink,
          google_event_id: gEvent.id
        })
        .eq('id', meeting.id)
    }

    // 4. Send Notifications
    const notificationReceivers = uniqueParticipantIds.filter(id => id !== session.user.id)
    for (const uid of notificationReceivers) {
      await adminClient
        .from('messages')
        .insert({
          receiver_id: uid,
          sender_id: session.user.id,
          subject: 'New Operational Synchronisation Allocated',
          body: `A new meeting "${title}" has been scheduled.\n\nJoin link: ${gEvent?.hangoutLink || gEvent?.htmlLink || 'TBD'}`,
          is_notification: true
        })
        .then(({ error }) => { if (error) console.error('Notification Error:', error) })
    }

    return NextResponse.json({ success: true, meetingId: meeting.id })

  } catch (error: any) {
    console.error('Meeting Creation Error [Final Catch]:', error)
    return NextResponse.json({ 
      error: 'CRITICAL_FAILURE', 
      message: error.message || 'Unknown operational failure',
      details: error.details || error,
      code: error.code
    }, { status: 500 })
  }
}
