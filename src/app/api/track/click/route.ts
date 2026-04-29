import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const trackingId = searchParams.get('id')
  const destination = searchParams.get('url')

  if (trackingId) {
    const supabase = await createClient()
    await supabase
      .from('email_queue')
      .update({ clicked_at: new Date().toISOString() })
      .eq('tracking_id', trackingId)
      .is('clicked_at', null) // only record first click
  }

  if (!destination) {
    return new NextResponse('Missing url', { status: 400 })
  }

  return NextResponse.redirect(destination)
}
