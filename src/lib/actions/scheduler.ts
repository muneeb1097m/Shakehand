'use server'

import { randomUUID } from 'crypto'
import { createClient } from '@/utils/supabase/server'
import { mergeVariables, buildMergeData } from '@/lib/merge'
import { revalidatePath } from 'next/cache'

const QUEUE_BATCH_SIZE = 50
const MIN_SECONDS_BETWEEN_SENDS_PER_ACCOUNT = 90       // ~40/hour cap per mailbox
const MAX_JITTER_SECONDS = 180                          // ±3 min jitter per contact
const MAX_ATTEMPTS = 5

type SupabaseSrv = Awaited<ReturnType<typeof createClient>>

// ---------- timezone-aware send window ----------

function isHourInWindow(date: Date, tz: string, startHour: number, endHour: number, allowedDays: number[]): boolean {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      hour12: false,
      weekday: 'short',
    })
    const parts = fmt.formatToParts(date)
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10)
    const wd = parts.find(p => p.type === 'weekday')?.value || ''
    const dayMap: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }
    const day = dayMap[wd] ?? 0
    if (!allowedDays.includes(day)) return false
    if (startHour <= endHour) return hour >= startHour && hour < endHour
    return hour >= startHour || hour < endHour // window crosses midnight
  } catch {
    return true // bad tz string — don't block sending
  }
}

function advanceToWindow(from: Date, tz: string, startHour: number, endHour: number, allowedDays: number[]): Date {
  const d = new Date(from)
  // Step forward in 30-min increments up to 8 days; cheap enough for queue building.
  for (let i = 0; i < 24 * 16; i++) {
    if (isHourInWindow(d, tz, startHour, endHour, allowedDays)) return d
    d.setMinutes(d.getMinutes() + 30)
  }
  return from
}

// ---------- launch ----------

export async function launchCampaign(campaignId: string, contactIds: string[]): Promise<{ queued: number; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { queued: 0, error: 'Unauthorized' }

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()
  if (!campaign) return { queued: 0, error: 'Campaign not found' }

  // Rotation pool: prefer campaign_accounts; fall back to legacy single account_id
  const { data: rotation } = await supabase
    .from('campaign_accounts')
    .select('account_id')
    .eq('campaign_id', campaignId)

  let accountPool: string[] = (rotation || []).map(r => r.account_id)
  if (accountPool.length === 0 && campaign.account_id) accountPool = [campaign.account_id]
  if (accountPool.length === 0) return { queued: 0, error: 'No sender accounts attached to this campaign.' }

  const { data: steps } = await supabase
    .from('campaign_steps')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('position', { ascending: true })
  if (!steps || steps.length === 0) return { queued: 0, error: 'Campaign has no steps.' }

  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .in('id', contactIds)
    .eq('user_id', user.id)
  if (!contacts || contacts.length === 0) return { queued: 0, error: 'No valid contacts found' }

  const { data: suppressed } = await supabase
    .from('suppression_list')
    .select('email')
    .eq('user_id', user.id)
  const suppressedEmails = new Set((suppressed || []).map((s: any) => s.email.toLowerCase()))

  const activeContacts = contacts.filter(c =>
    !suppressedEmails.has(c.email.toLowerCase()) &&
    c.email_status !== 'unsubscribed' &&
    c.email_status !== 'bounced' &&
    !c.bounced_at
  )
  if (activeContacts.length === 0) return { queued: 0, error: 'All contacts are suppressed, bounced, or unsubscribed.' }

  const startHour = campaign.send_window_start ?? 9
  const endHour   = campaign.send_window_end ?? 17
  const days      = campaign.send_window_days ?? [1, 2, 3, 4, 5]

  const queueRows: any[] = []
  let stepDelayMinutes = 0   // cumulative from start of campaign
  let rotationIdx = 0

  for (const step of steps) {
    const waitMin = (step.wait_days ?? 0) * 24 * 60 + (step.wait_hours ?? 0) * 60 + (step.wait_minutes ?? 0)
    if (!step.subject && !step.body) {
      stepDelayMinutes += waitMin
      continue
    }

    let perContactOffset = 0
    for (const contact of activeContacts) {
      const acct = accountPool[rotationIdx % accountPool.length]
      rotationIdx++

      // Stagger contacts within a step so we don't blast simultaneously
      perContactOffset += MIN_SECONDS_BETWEEN_SENDS_PER_ACCOUNT / accountPool.length
      const jitter = (Math.random() * 2 - 1) * MAX_JITTER_SECONDS

      let scheduledAt = new Date(Date.now() + stepDelayMinutes * 60_000 + (perContactOffset + jitter) * 1000)
      scheduledAt = advanceToWindow(scheduledAt, contact.timezone || 'UTC', startHour, endHour, days)

      const mergeData = buildMergeData(contact)
      queueRows.push({
        user_id: user.id,
        campaign_id: campaignId,
        contact_id: contact.id,
        account_id: acct,
        step_position: step.position,
        subject: mergeVariables(step.subject || '', mergeData),
        body: mergeVariables(step.body || '', mergeData),
        status: 'pending',
        scheduled_at: scheduledAt.toISOString(),
        tracking_id: randomUUID(),
        attempts: 0,
      })
    }

    stepDelayMinutes += waitMin
  }

  const { error: queueError } = await supabase.from('email_queue').insert(queueRows)
  if (queueError) return { queued: 0, error: queueError.message }

  await supabase
    .from('campaign_contacts')
    .upsert(
      activeContacts.map(c => ({ campaign_id: campaignId, contact_id: c.id, status: 'active' })),
      { onConflict: 'campaign_id,contact_id', ignoreDuplicates: true }
    )

  await supabase.from('campaigns').update({ status: 'active' }).eq('id', campaignId)

  revalidatePath('/campaigns')
  return { queued: queueRows.length, error: null }
}

// ---------- processor ----------

function isTransient(message: string): boolean {
  const m = message.toLowerCase()
  if (/4\d\d/.test(m)) return true                       // 4xx SMTP
  if (m.includes('etimedout') || m.includes('econnreset')) return true
  if (m.includes('econnrefused') || m.includes('enotfound')) return true
  if (m.includes('greylist') || m.includes('rate limit') || m.includes('try again')) return true
  return false
}

async function recentSendCount(supabase: SupabaseSrv, accountId: string, windowSeconds: number): Promise<number> {
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString()
  const { count } = await supabase
    .from('send_log')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', accountId)
    .gte('sent_at', since)
  return count || 0
}

export async function processEmailQueue(): Promise<{ sent: number; failed: number; deferred: number }> {
  const supabase = await createClient()

  const { data: pending } = await supabase
    .from('email_queue')
    .select('*, email_accounts(*), contacts(*), campaigns(track_opens, track_clicks)')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(QUEUE_BATCH_SIZE)

  if (!pending || pending.length === 0) return { sent: 0, failed: 0, deferred: 0 }

  let sent = 0, failed = 0, deferred = 0
  const { sendEmail } = await import('@/lib/email-engine')

  for (const item of pending) {
    const account = item.email_accounts
    const campaign = item.campaigns

    // Daily cap
    if (account && account.daily_limit && account.sent_today >= account.daily_limit) {
      await supabase
        .from('email_queue')
        .update({ scheduled_at: new Date(Date.now() + 60 * 60_000).toISOString() })
        .eq('id', item.id)
      deferred++
      continue
    }

    // Per-account rate limit (last 90s)
    const recent = await recentSendCount(supabase, item.account_id, MIN_SECONDS_BETWEEN_SENDS_PER_ACCOUNT)
    if (recent > 0) {
      await supabase
        .from('email_queue')
        .update({ scheduled_at: new Date(Date.now() + MIN_SECONDS_BETWEEN_SENDS_PER_ACCOUNT * 1000).toISOString() })
        .eq('id', item.id)
      deferred++
      continue
    }

    // Skip if contact got suppressed / replied / bounced since queueing
    if (item.contacts?.bounced_at || item.contacts?.replied_at || item.contacts?.email_status === 'unsubscribed') {
      await supabase.from('email_queue').update({ status: 'skipped' }).eq('id', item.id)
      continue
    }

    // For follow-up steps, thread to the first send if we have its Message-ID
    let inReplyTo: string | undefined
    let references: string | undefined
    if (item.step_position > 0) {
      const { data: first } = await supabase
        .from('email_queue')
        .select('message_id')
        .eq('campaign_id', item.campaign_id)
        .eq('contact_id', item.contact_id)
        .eq('step_position', 0)
        .not('message_id', 'is', null)
        .single()
      if (first?.message_id) {
        inReplyTo = first.message_id
        references = first.message_id
      }
    }

    try {
      const { messageId } = await sendEmail({
        accountId: item.account_id,
        to: item.contacts.email,
        subject: item.subject,
        body: item.body,
        trackingId: item.tracking_id,
        trackOpens: !!campaign?.track_opens,
        trackClicks: !!campaign?.track_clicks,
        inReplyTo,
        references,
      })

      await supabase
        .from('email_queue')
        .update({ status: 'sent', sent_at: new Date().toISOString(), message_id: messageId })
        .eq('id', item.id)

      await supabase.from('send_log').insert({ account_id: item.account_id })
      await supabase
        .from('email_accounts')
        .update({ sent_today: (account?.sent_today || 0) + 1 })
        .eq('id', item.account_id)

      sent++
    } catch (err: any) {
      const attempts = (item.attempts || 0) + 1
      const msg = err?.message || 'send failed'

      if (isTransient(msg) && attempts < MAX_ATTEMPTS) {
        // exponential backoff: 2^attempts minutes
        const backoffMs = Math.min(60, 2 ** attempts) * 60_000
        await supabase
          .from('email_queue')
          .update({
            attempts,
            next_attempt_at: new Date(Date.now() + backoffMs).toISOString(),
            scheduled_at: new Date(Date.now() + backoffMs).toISOString(),
            error_message: msg,
          })
          .eq('id', item.id)
        deferred++
      } else {
        await supabase
          .from('email_queue')
          .update({ status: 'failed', attempts, error_message: msg })
          .eq('id', item.id)
        failed++
      }
    }
  }

  return { sent, failed, deferred }
}
