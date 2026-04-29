'use server'

import { createClient } from '@/utils/supabase/server'
import { mergeVariables, buildMergeData } from '@/lib/merge'
import { revalidatePath } from 'next/cache'

// Called when user clicks "Launch Campaign"
// Queues one email per contact per step, spaced by wait_days
export async function launchCampaign(campaignId: string, contactIds: string[]): Promise<{ queued: number; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { queued: 0, error: 'Unauthorized' }

  // Fetch campaign + account
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*, email_accounts(*)')
    .eq('id', campaignId)
    .single()

  if (!campaign) return { queued: 0, error: 'Campaign not found' }
  if (!campaign.account_id) return { queued: 0, error: 'No sender account selected. Go to the campaign and select an account first.' }

  // Fetch steps ordered by position
  const { data: steps } = await supabase
    .from('campaign_steps')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('position', { ascending: true })

  if (!steps || steps.length === 0) return { queued: 0, error: 'Campaign has no steps. Add at least one email step first.' }

  // Fetch contacts
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .in('id', contactIds)
    .eq('user_id', user.id)

  if (!contacts || contacts.length === 0) return { queued: 0, error: 'No valid contacts found' }

  // Check suppression list
  const { data: suppressed } = await supabase
    .from('suppression_list')
    .select('email')
    .eq('user_id', user.id)

  const suppressedEmails = new Set((suppressed || []).map((s: any) => s.email.toLowerCase()))

  const activeContacts = contacts.filter(c => !suppressedEmails.has(c.email.toLowerCase()))

  if (activeContacts.length === 0) return { queued: 0, error: 'All contacts are on the suppression list' }

  // Build queue rows
  const queueRows: any[] = []
  let cumulativeDays = 0

  for (const step of steps) {
    if (step.wait_days) {
      cumulativeDays += step.wait_days
      continue // wait steps just add delay, no email
    }

    const scheduledAt = new Date()
    scheduledAt.setDate(scheduledAt.getDate() + cumulativeDays)

    for (const contact of activeContacts) {
      const mergeData = buildMergeData(contact)
      const mergedSubject = mergeVariables(step.subject || '', mergeData)
      const mergedBody = mergeVariables(step.body || '', mergeData)

      queueRows.push({
        user_id: user.id,
        campaign_id: campaignId,
        contact_id: contact.id,
        account_id: campaign.account_id,
        step_position: step.position,
        subject: mergedSubject,
        body: mergedBody,
        status: 'pending',
        scheduled_at: scheduledAt.toISOString(),
      })
    }

    cumulativeDays++ // each email step adds 1 day gap by default
  }

  // Insert into queue
  const { error: queueError } = await supabase
    .from('email_queue')
    .insert(queueRows)

  if (queueError) return { queued: 0, error: queueError.message }

  // Add contacts to campaign_contacts
  const campaignContacts = activeContacts.map(c => ({
    campaign_id: campaignId,
    contact_id: c.id,
    status: 'active'
  }))

  await supabase
    .from('campaign_contacts')
    .upsert(campaignContacts, { onConflict: 'campaign_id,contact_id', ignoreDuplicates: true })

  // Set campaign status to active
  await supabase
    .from('campaigns')
    .update({ status: 'active' })
    .eq('id', campaignId)

  revalidatePath('/campaigns')
  return { queued: queueRows.length, error: null }
}

// Processes pending emails in the queue — call this from a cron
// We'll expose it as an API route so Supabase cron can hit it
export async function processEmailQueue(): Promise<{ sent: number; failed: number }> {
  const supabase = await createClient()

  // Fetch pending emails that are due
  const { data: pending } = await supabase
    .from('email_queue')
    .select('*, email_accounts(*), contacts(*)')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .limit(50) // process 50 at a time

  if (!pending || pending.length === 0) return { sent: 0, failed: 0 }

  let sent = 0
  let failed = 0

  for (const item of pending) {
    try {
      const { sendEmail } = await import('@/lib/email-engine')
      await sendEmail({
        accountId: item.account_id,
        to: item.contacts.email,
        subject: item.subject,
        body: item.body,
      })

      await supabase
        .from('email_queue')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', item.id)

      sent++
    } catch (err: any) {
      await supabase
        .from('email_queue')
        .update({ status: 'failed', error_message: err.message })
        .eq('id', item.id)

      failed++
    }
  }

  return { sent, failed }
}
