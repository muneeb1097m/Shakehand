import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import { createClient } from '@/utils/supabase/server'
import { decryptSecret } from './crypto'

type Supa = Awaited<ReturnType<typeof createClient>>

interface PollResult {
  account: string
  replies: number
  bounces: number
  error?: string
}

const BOUNCE_FROM_HINTS = ['mailer-daemon', 'postmaster', 'mail delivery subsystem', 'noreply-dmarc']
const BOUNCE_SUBJECT_HINTS = ['undeliverable', 'delivery status', 'returned mail', 'mail delivery failed', 'failure notice']

function looksLikeBounce(fromAddr: string, subject: string): boolean {
  const f = fromAddr.toLowerCase()
  const s = subject.toLowerCase()
  return BOUNCE_FROM_HINTS.some(h => f.includes(h)) || BOUNCE_SUBJECT_HINTS.some(h => s.includes(h))
}

// Pull a tracking_id out of bounce body / headers (we set X-Entity-Ref-ID on send)
function extractTrackingId(text: string): string | null {
  const m = text.match(/X-Entity-Ref-ID:\s*([0-9a-f-]{36})/i)
  if (m) return m[1]
  const m2 = text.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)
  return m2 ? m2[1] : null
}

async function pollAccount(supabase: Supa, account: any): Promise<PollResult> {
  const out: PollResult = { account: account.email, replies: 0, bounces: 0 }
  if (!account.imap_host || !account.imap_user || !account.imap_pass) {
    return { ...out, error: 'IMAP not configured' }
  }

  const client = new ImapFlow({
    host: account.imap_host,
    port: account.imap_port || 993,
    secure: (account.imap_port || 993) === 993,
    auth: { user: account.imap_user, pass: decryptSecret(account.imap_pass) },
    logger: false,
  })

  try {
    await client.connect()
    const lock = await client.getMailboxLock('INBOX')
    try {
      const since = account.imap_last_uid ? Number(account.imap_last_uid) + 1 : 1
      let highestUid = Number(account.imap_last_uid || 0)

      for await (const msg of client.fetch({ uid: `${since}:*` }, { uid: true, source: true, envelope: true }, { uid: true })) {
        highestUid = Math.max(highestUid, Number(msg.uid))

        const parsed = await simpleParser(msg.source as Buffer)
        const inReplyTo = parsed.inReplyTo || ''
        const references = ([] as string[]).concat(parsed.references || []).join(' ')
        const fromAddr = parsed.from?.value?.[0]?.address || ''
        const subject = parsed.subject || ''
        const snippet = (parsed.text || '').slice(0, 240)
        const messageId = parsed.messageId || ''

        // Find the queue row this is in reply to
        let queueRow: any = null
        const candidateIds = [inReplyTo, ...references.split(/\s+/).filter(Boolean)]
        for (const mid of candidateIds) {
          const { data } = await supabase
            .from('email_queue')
            .select('id, user_id, campaign_id, contact_id, tracking_id')
            .eq('message_id', mid)
            .maybeSingle()
          if (data) { queueRow = data; break }
        }

        // Bounce path: parser couldn't link via headers — try body tracking_id
        const isBounce = looksLikeBounce(fromAddr, subject)
        if (!queueRow && isBounce) {
          const tid = extractTrackingId(parsed.text || '') || extractTrackingId(parsed.html || '')
          if (tid) {
            const { data } = await supabase
              .from('email_queue')
              .select('id, user_id, campaign_id, contact_id, tracking_id')
              .eq('tracking_id', tid)
              .maybeSingle()
            if (data) queueRow = data
          }
        }

        if (!queueRow) continue

        if (isBounce) {
          await supabase
            .from('email_queue')
            .update({ bounced_at: new Date().toISOString(), status: 'bounced' })
            .eq('id', queueRow.id)
          await supabase
            .from('contacts')
            .update({ bounced_at: new Date().toISOString(), email_status: 'bounced' })
            .eq('id', queueRow.contact_id)
          await supabase
            .from('campaign_contacts')
            .update({ status: 'bounced' })
            .match({ campaign_id: queueRow.campaign_id, contact_id: queueRow.contact_id })
          // Cancel any future steps for this contact in this campaign
          await supabase
            .from('email_queue')
            .update({ status: 'skipped' })
            .match({ campaign_id: queueRow.campaign_id, contact_id: queueRow.contact_id, status: 'pending' })
          out.bounces++
        } else {
          // Real reply
          await supabase
            .from('email_queue')
            .update({ replied_at: new Date().toISOString() })
            .eq('id', queueRow.id)
          await supabase
            .from('contacts')
            .update({ replied_at: new Date().toISOString(), email_status: 'replied' })
            .eq('id', queueRow.contact_id)
          await supabase
            .from('campaign_contacts')
            .update({ status: 'replied' })
            .match({ campaign_id: queueRow.campaign_id, contact_id: queueRow.contact_id })
          // Stop the sequence
          await supabase
            .from('email_queue')
            .update({ status: 'skipped' })
            .match({ campaign_id: queueRow.campaign_id, contact_id: queueRow.contact_id, status: 'pending' })
          out.replies++
        }

        await supabase.from('inbox_messages').insert({
          user_id: queueRow.user_id,
          account_id: account.id,
          queue_id: queueRow.id,
          campaign_id: queueRow.campaign_id,
          contact_id: queueRow.contact_id,
          kind: isBounce ? 'bounce' : 'reply',
          from_email: fromAddr,
          subject,
          snippet,
          message_id: messageId,
          in_reply_to: inReplyTo,
        })
      }

      if (highestUid > Number(account.imap_last_uid || 0)) {
        await supabase
          .from('email_accounts')
          .update({ imap_last_uid: highestUid })
          .eq('id', account.id)
      }
    } finally {
      lock.release()
    }
    await client.logout()
  } catch (e: any) {
    out.error = e?.message || 'IMAP error'
    try { await client.close() } catch {}
  }

  return out
}

export async function pollAllInboxes(): Promise<PollResult[]> {
  const supabase = await createClient()
  const { data: accounts } = await supabase
    .from('email_accounts')
    .select('*')
    .not('imap_host', 'is', null)
    .eq('status', 'active')

  if (!accounts || accounts.length === 0) return []

  const results: PollResult[] = []
  for (const acct of accounts) {
    results.push(await pollAccount(supabase, acct))
  }
  return results
}
