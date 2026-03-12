import { createAdminClient } from '@/utils/supabase-admin'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const adminClient = createAdminClient();
    const now = new Date();
    const notificationsSent = [];

    // --- 1. MEETING NOTIFICATIONS (10 mins before) ---
    const tenMinsLater = new Date(now.getTime() + 10 * 60 * 1000);
    const fifteenMinsLater = new Date(now.getTime() + 15 * 60 * 1000);

    // Fetch meetings starting in the next ~10-15 mins
    const { data: upcomingMeetings } = await adminClient
      .from('meetings')
      .select(`
        id,
        title,
        scheduled_at,
        meeting_participants (user_id)
      `)
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', fifteenMinsLater.toISOString());

    if (upcomingMeetings) {
      for (const mtg of upcomingMeetings) {
        const alarmKey = `ALARM_MTG_${mtg.id}_10M`;
        for (const part of mtg.meeting_participants as any[]) {
          // Check if already notified
          const { data: existing } = await adminClient
            .from('messages')
            .select('id')
            .eq('receiver_id', part.user_id)
            .eq('subject', alarmKey)
            .maybeSingle();

          if (!existing) {
             await adminClient.from('messages').insert({
               receiver_id: part.user_id,
               subject: alarmKey,
               body: `URGENT: Meeting "${mtg.title}" starts in 10 minutes. Prepare for synchronization.`,
               is_notification: true
             });
             notificationsSent.push(`${alarmKey} -> ${part.user_id}`);
          }
        }
      }
    }

    // --- 2. DEADLINE NOTIFICATIONS (1 day and 2 hours before) ---
    // We check checklist_allocations
    const twoHoursLater = new Date(now.getTime() + 2.5 * 60 * 60 * 1000); // 2h window
    const oneDayLater = new Date(now.getTime() + 25 * 60 * 60 * 1000);   // 24h window

    const { data: deadlines } = await adminClient
      .from('checklist_allocations')
      .select(`
        id,
        employee_id,
        deadline,
        checklist:checklists(title)
      `)
      .neq('status', 'completed')
      .gte('deadline', now.toISOString())
      .lte('deadline', oneDayLater.toISOString());

    if (deadlines) {
      for (const dl of deadlines) {
        const deadlineTime = new Date(dl.deadline).getTime();
        const diffHours = (deadlineTime - now.getTime()) / (1000 * 60 * 60);
        
        // 1 Day Alarm (~24h)
        if (diffHours >= 23 && diffHours <= 25) {
          const alarmKey = `ALARM_DL_${dl.id}_1D`;
          const { data: existing } = await adminClient
            .from('messages')
            .select('id')
            .eq('receiver_id', dl.employee_id)
            .eq('subject', alarmKey)
            .maybeSingle();

          if (!existing) {
            await adminClient.from('messages').insert({
              receiver_id: dl.employee_id,
              subject: alarmKey,
              body: `WARNING: The deadline for "${(dl.checklist as any)?.title}" is in 24 hours. Ensure progress is within parameters.`,
              is_notification: true
            });
            notificationsSent.push(alarmKey);
          }
        }

        // 2 Hours Alarm (~2h)
        if (diffHours >= 1.5 && diffHours <= 2.5) {
          const alarmKey = `ALARM_DL_${dl.id}_2H`;
          const { data: existing } = await adminClient
            .from('messages')
            .select('id')
            .eq('receiver_id', dl.employee_id)
            .eq('subject', alarmKey)
            .maybeSingle();

          if (!existing) {
            await adminClient.from('messages').insert({
              receiver_id: dl.employee_id,
              subject: alarmKey,
              body: `CRITICAL: The deadline for "${(dl.checklist as any)?.title}" is in 2 hours. Finalize all operations now.`,
              is_notification: true
            });
            notificationsSent.push(alarmKey);
          }
        }
      }
    }

    return NextResponse.json({ success: true, processed: notificationsSent.length });

  } catch (error: any) {
    console.error('Notification Scheduler Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
