import { NextResponse } from 'next/server'
import { pollAllInboxes } from '@/lib/imap-poller'

export const maxDuration = 60

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const results = await pollAllInboxes()
  return NextResponse.json({ success: true, accounts: results })
}
