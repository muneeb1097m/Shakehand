import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const trackingId = searchParams.get('id')

  if (!trackingId) {
    return new NextResponse('Invalid link', { status: 400 })
  }

  const supabase = await createClient()

  // Find the email from tracking id
  const { data: queueItem } = await supabase
    .from('email_queue')
    .select('user_id, contacts(email)')
    .eq('tracking_id', trackingId)
    .single()

  if (!queueItem) {
    return new NextResponse('Invalid link', { status: 400 })
  }

  const email = (queueItem.contacts as any).email
  const userId = queueItem.user_id

  // Add to suppression list
  await supabase
    .from('suppression_list')
    .upsert({ user_id: userId, email, reason: 'unsubscribed' }, { onConflict: 'user_id,email', ignoreDuplicates: true })

  // Update contact status
  await supabase
    .from('contacts')
    .update({ email_status: 'unsubscribed' })
    .eq('email', email)
    .eq('user_id', userId)

  // Return simple HTML confirmation page
  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head><title>Unsubscribed</title></head>
      <body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f9fafb;">
        <div style="text-align:center;padding:40px;background:white;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:400px;">
          <h2 style="color:#18181b;margin-bottom:8px;">You've been unsubscribed</h2>
          <p style="color:#71717a;">You won't receive any more emails from this sender.</p>
        </div>
      </body>
    </html>`,
    { headers: { 'Content-Type': 'text/html' } }
  )
}
