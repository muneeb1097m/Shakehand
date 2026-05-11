import nodemailer from 'nodemailer'
import { randomBytes } from 'crypto'
import { createClient } from '@/utils/supabase/server'
import { decryptSecret } from './crypto'
import { openPixelUrl, clickUrl, unsubscribeUrl } from './tracking'

interface SendEmailParams {
  accountId: string
  to: string
  subject: string
  body: string
  trackingId: string
  trackOpens?: boolean
  trackClicks?: boolean
  inReplyTo?: string  // for follow-ups: ties the thread together
  references?: string
}

interface InjectionContext {
  baseUrl: string
  trackingId: string
  trackOpens: boolean
  trackClicks: boolean
  senderAddress: string | null
}

function injectTracking(body: string, ctx: InjectionContext): string {
  let out = body

  if (ctx.trackClicks) {
    out = out.replace(/href="(https?:\/\/[^"]+)"/g, (_, url) => {
      // Don't rewrite our own unsubscribe link if a user already inlined one
      if (url.includes('/api/unsubscribe')) return `href="${url}"`
      return `href="${clickUrl(ctx.baseUrl, ctx.trackingId, url)}"`
    })
  }

  const unsubLink = unsubscribeUrl(ctx.baseUrl, ctx.trackingId)
  const addressLine = ctx.senderAddress
    ? `<div style="font-size:11px;color:#9ca3af;margin-top:4px;">${escapeHtml(ctx.senderAddress)}</div>`
    : ''

  const footer = `
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;">
      <a href="${unsubLink}" style="font-size:11px;color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
      ${addressLine}
    </div>`

  const pixel = ctx.trackOpens
    ? `<img src="${openPixelUrl(ctx.baseUrl, ctx.trackingId)}" width="1" height="1" style="display:none" alt="" />`
    : ''

  return `${out}${footer}${pixel}`
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

export async function sendEmail({
  accountId, to, subject, body, trackingId,
  trackOpens = false, trackClicks = false, inReplyTo, references,
}: SendEmailParams) {
  const supabase = await createClient()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { data: account, error } = await supabase
    .from('email_accounts')
    .select('*')
    .eq('id', accountId)
    .single()

  if (error || !account) throw new Error('Email account not found')
  if (account.provider !== 'smtp') throw new Error('Unsupported provider')

  const pass = decryptSecret(account.smtp_pass)

  const finalBody = injectTracking(body, {
    baseUrl,
    trackingId,
    trackOpens,
    trackClicks,
    senderAddress: account.sender_address || null,
  })

  // Stable Message-ID we can match against IMAP later
  const fromAddress = account.email
  const domain = fromAddress.split('@')[1] || 'localhost'
  const messageId = `<${trackingId}.${randomBytes(6).toString('hex')}@${domain}>`

  const transporter = nodemailer.createTransport({
    host: account.smtp_host,
    port: account.smtp_port,
    secure: account.smtp_port === 465,
    auth: { user: account.smtp_user, pass },
  })

  const displayName = account.sender_name || account.email.split('@')[0]
  const oneClickUrl = unsubscribeUrl(baseUrl, trackingId)

  await transporter.sendMail({
    from: { name: displayName, address: fromAddress },
    to,
    subject,
    html: finalBody,
    messageId,
    inReplyTo,
    references,
    headers: {
      // RFC 8058: one-click unsubscribe support, recognized by Gmail/Outlook
      'List-Unsubscribe': `<${oneClickUrl}>, <mailto:unsubscribe+${trackingId}@${domain}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'X-Entity-Ref-ID': trackingId,
    },
  })

  return { messageId }
}
