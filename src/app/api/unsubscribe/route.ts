import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { verifyUnsub } from '@/lib/tracking'

// GET = show confirmation page (defeats mail-scanner false unsubscribes)
// POST = perform unsubscribe (also handles RFC 8058 List-Unsubscribe-Post one-click)

async function performUnsubscribe(trackingId: string) {
  const supabase = await createClient()
  const { data: queueItem } = await supabase
    .from('email_queue')
    .select('user_id, contacts(email)')
    .eq('tracking_id', trackingId)
    .single()

  if (!queueItem) return false
  const email = (queueItem.contacts as any)?.email
  const userId = queueItem.user_id
  if (!email) return false

  await supabase
    .from('suppression_list')
    .upsert({ user_id: userId, email, reason: 'unsubscribed' }, { onConflict: 'user_id,email', ignoreDuplicates: true })

  await supabase
    .from('contacts')
    .update({ email_status: 'unsubscribed' })
    .eq('email', email)
    .eq('user_id', userId)

  return true
}

function html(body: string) {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta name="robots" content="noindex"><title>Unsubscribe</title></head>
    <body style="font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb;">
      <div style="text-align:center;padding:40px;background:white;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:420px;">
        ${body}
      </div>
    </body></html>`,
    { headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' } }
  )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const trackingId = searchParams.get('id')
  const sig = searchParams.get('s')

  if (!trackingId || !sig || !verifyUnsub(trackingId, sig)) {
    return html(`<h2 style="color:#18181b;margin:0 0 8px;">Invalid link</h2>
      <p style="color:#71717a;margin:0;">This unsubscribe link is no longer valid.</p>`)
  }

  return html(`
    <h2 style="color:#18181b;margin:0 0 8px;">Unsubscribe</h2>
    <p style="color:#71717a;margin:0 0 24px;">Confirm that you no longer want to receive emails from this sender.</p>
    <form method="POST" action="/api/unsubscribe?id=${trackingId}&s=${sig}">
      <button type="submit" style="background:#18181b;color:white;border:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;">
        Confirm unsubscribe
      </button>
    </form>`)
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const trackingId = searchParams.get('id')
  const sig = searchParams.get('s')

  if (!trackingId || !sig || !verifyUnsub(trackingId, sig)) {
    return new NextResponse('Invalid link', { status: 400 })
  }

  const ok = await performUnsubscribe(trackingId)

  // RFC 8058: mail clients sending List-Unsubscribe-Post expect a 200 with no body
  const ct = request.headers.get('content-type') || ''
  if (ct.includes('application/x-www-form-urlencoded')) {
    const text = await request.text()
    if (text.includes('List-Unsubscribe=One-Click')) {
      return new NextResponse(null, { status: 200 })
    }
  }

  if (!ok) {
    return html(`<h2 style="color:#18181b;margin:0 0 8px;">Invalid link</h2>
      <p style="color:#71717a;margin:0;">This unsubscribe link is no longer valid.</p>`)
  }
  return html(`<h2 style="color:#18181b;margin:0 0 8px;">You've been unsubscribed</h2>
    <p style="color:#71717a;margin:0;">You won't receive any more emails from this sender.</p>`)
}
