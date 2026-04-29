import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// 1x1 transparent pixel
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const trackingId = searchParams.get('id')

  if (trackingId) {
    const supabase = await createClient()
    await supabase
      .from('email_queue')
      .update({ opened_at: new Date().toISOString() })
      .eq('tracking_id', trackingId)
      .is('opened_at', null) // only record first open
  }

  return new NextResponse(PIXEL, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
