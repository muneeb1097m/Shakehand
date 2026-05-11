import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { verifyOpen } from '@/lib/tracking'

const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

function pixelResponse() {
  return new NextResponse(PIXEL, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
    },
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const trackingId = searchParams.get('id')
  const sig = searchParams.get('s')

  // Always return the pixel — never leak validity via status codes
  if (!trackingId || !sig || !verifyOpen(trackingId, sig)) return pixelResponse()

  const supabase = await createClient()
  await supabase
    .from('email_queue')
    .update({ opened_at: new Date().toISOString() })
    .eq('tracking_id', trackingId)
    .is('opened_at', null)

  return pixelResponse()
}
