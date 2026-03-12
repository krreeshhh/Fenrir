import { createClient } from '@/utils/supabase-server'
import { createAdminClient } from '@/utils/supabase-admin'
import { google } from 'googleapis'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('[Mail Sync] Session Error:', sessionError)
      return NextResponse.json({ error: 'SESSION_ERROR', details: sessionError.message }, { status: 401 })
    }

    if (!session || !session.provider_token) {
      console.error('[Mail Sync] Auth Required: No provider token')
      return NextResponse.json({ error: 'AUTH_REQUIRED', message: 'Re-authenticate with Google' }, { status: 401 })
    }

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
    auth.setCredentials({ access_token: session.provider_token })

    const gmail = google.gmail({ version: 'v1', auth })

    // 1. Fetch unread messages from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const query = `is:unread after:${Math.floor(yesterday.getTime() / 1000)}`;
    console.log('[Mail Sync] Querying Gmail:', query);

    const { data } = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 5
    });

    if (!data.messages) {
      console.log('[Mail Sync] No new messages.');
      return NextResponse.json({ success: true, count: 0 });
    }

    const newNotifications = [];

    for (const msg of data.messages) {
      try {
        const { data: existing, error: checkError } = await adminClient
          .from('messages')
          .select('id')
          .eq('subject', `MAIL_SYNC_${msg.id}`)
          .maybeSingle();

        if (checkError) {
           console.error('[Mail Sync] DB Check Error:', checkError);
           continue;
        }
        if (existing) continue;

        const { data: fullMsg } = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!
        });

        const headers = fullMsg.payload?.headers;
        const subject = headers?.find(h => h.name === 'Subject')?.value || 'New Correspondence';
        const from = headers?.find(h => h.name === 'From')?.value || 'Unknown Sender';
        const snippet = fullMsg.snippet || '';

        const { data: inserted, error: insError } = await adminClient
          .from('messages')
          .insert({
            receiver_id: session.user.id,
            subject: `MAIL_SYNC_${msg.id}`, // Using a unique subject for check
            body: `SUBJECT: ${subject}\nFROM: ${from}\n\n${snippet}`,
            is_notification: true,
            is_read: false
          })
          .select()
          .single();

        if (insError) {
           console.error('[Mail Sync] DB Insert Error:', insError);
        } else if (inserted) {
          newNotifications.push(inserted);
        }
      } catch (innerError) {
        console.error('[Mail Sync] Inner loop failure:', innerError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: newNotifications.length
    });

  } catch (error: any) {
    console.error('[Mail Sync] Critical Failure:', error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
