import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { verifyClick } from '@/lib/tracking'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const trackingId = searchParams.get('id')
  const destination = searchParams.get('url')
  const sig = searchParams.get('s')

  if (!trackingId || !destination || !sig) {
    return new NextResponse('Invalid link', { status: 400 })
  }

  if (!verifyClick(trackingId, destination, sig)) {
    return new NextResponse('Invalid signature', { status: 403 })
  }

  // Validate destination protocol — even with a valid signature, never redirect to non-http(s).
  let parsed: URL
  try {
    parsed = new URL(destination)
  } catch {
    return new NextResponse('Invalid URL', { status: 400 })
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return new NextResponse('Invalid URL', { status: 400 })
  }

  const supabase = await createClient()
  await supabase
    .from('email_queue')
    .update({ clicked_at: new Date().toISOString() })
    .eq('tracking_id', trackingId)
    .is('clicked_at', null)

  return NextResponse.redirect(destination)
}
