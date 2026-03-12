import { createAdminClient } from '@/utils/supabase-admin'
import { NextResponse } from 'next/server'

/**
 * POST /api/meetings/cleanup
 * Deletes all meetings that have already ended (scheduled_at + duration_minutes < now).
 * Called automatically from every meetings page on load.
 */
export async function POST() {
  try {
    const adminClient = createAdminClient()
    const now = new Date().toISOString()

    // Fetch all meetings that have ended
    // A meeting is "over" when: scheduled_at + duration_minutes * interval < NOW
    // We use a Postgres expression via RPC, but simpler: fetch all and filter in JS
    const { data: allMeetings, error: fetchError } = await adminClient
      .from('meetings')
      .select('id, scheduled_at, duration_minutes')

    if (fetchError) {
      console.error('Cleanup fetch error:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const nowMs = Date.now()

    const expiredIds = (allMeetings || [])
      .filter(m => {
        const startMs = new Date(m.scheduled_at).getTime()
        const durationMs = (m.duration_minutes || 30) * 60 * 1000
        return (startMs + durationMs) < nowMs
      })
      .map(m => m.id)

    if (expiredIds.length === 0) {
      return NextResponse.json({ deleted: 0 })
    }

    // Delete participants first (FK constraint)
    const { error: partError } = await adminClient
      .from('meeting_participants')
      .delete()
      .in('meeting_id', expiredIds)

    if (partError) {
      console.error('Cleanup participants delete error:', partError)
      return NextResponse.json({ error: partError.message }, { status: 500 })
    }

    // Delete the meetings
    const { error: meetingError } = await adminClient
      .from('meetings')
      .delete()
      .in('id', expiredIds)

    if (meetingError) {
      console.error('Cleanup meetings delete error:', meetingError)
      return NextResponse.json({ error: meetingError.message }, { status: 500 })
    }

    console.log(`[Meetings Cleanup] Deleted ${expiredIds.length} expired meeting(s):`, expiredIds)
    return NextResponse.json({ deleted: expiredIds.length })

  } catch (err: any) {
    console.error('Cleanup route error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
