import { NextResponse } from 'next/server'
import { processEmailQueue } from '@/lib/actions/scheduler'

// This route is called by Supabase cron every 5 minutes
// Protect it with a secret key
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await processEmailQueue()
  return NextResponse.json({ success: true, ...result })
}
