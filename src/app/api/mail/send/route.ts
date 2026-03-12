import { createClient } from '@/utils/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    // 1. Connectivity Check
    if (!session?.provider_token) {
      return NextResponse.json({ 
        error: 'AUTH_REQUIRED',
        message: 'Google Authorization required. Please log out and log in again with Google.' 
      }, { status: 401 })
    }

    const { to, subject, body } = await req.json()
    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Payload directive missing parameters.' }, { status: 400 })
    }

    // 2. Mission Directive Construction (MIME)
    // We use a simplified RFC822 format for the Gmail API
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `To: ${to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      body,
    ];
    const message = messageParts.join('\n');

    // Encode in base64url (required by Google)
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // 3. Automated External Dispatch via REST
    // Using fetch directly to avoid library initialization errors
    const gmailResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.provider_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: encodedMessage
      })
    });

    const result = await gmailResponse.json();

    if (!gmailResponse.ok) {
      console.error('--- GMAIL API REJECTION DETAILS ---');
      console.error('Status:', gmailResponse.status);
      console.error('Response:', JSON.stringify(result, null, 2));
      console.error('------------------------------------');

      return NextResponse.json({ 
        error: 'DISPATCH_REJECTED',
        details: result.error?.message || 'External server rejected the directive.',
        code: result.error?.code,
        status: result.error?.status
      }, { status: gmailResponse.status });
    }

    return NextResponse.json({ success: true, messageId: result.id })

  } catch (error: any) {
    console.error('Operational Dispatch Critical Failure:', error)
    return NextResponse.json({ 
      error: 'CRITICAL_FAILURE',
      details: error.message 
    }, { status: 500 })
  }
}
