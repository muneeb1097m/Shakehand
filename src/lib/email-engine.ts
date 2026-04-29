import nodemailer from 'nodemailer'
import { createClient } from '@/utils/supabase/server'

interface SendEmailParams {
  accountId: string
  to: string
  subject: string
  body: string
  trackingId?: string
}

function injectTracking(body: string, trackingId: string, baseUrl: string): string {
  const pixel = `<img src="${baseUrl}/api/track/open?id=${trackingId}" width="1" height="1" style="display:none" />`
  
  // Wrap all links with click tracking
  const trackedBody = body.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (_, url) => `href="${baseUrl}/api/track/click?id=${trackingId}&url=${encodeURIComponent(url)}"`
  )

  const unsubscribeLink = `<p style="font-size:11px;color:#9ca3af;margin-top:32px;text-align:center;">
    Don't want to receive these emails? 
    <a href="${baseUrl}/api/unsubscribe?id=${trackingId}" style="color:#9ca3af;">Unsubscribe</a>
  </p>`

  return `${trackedBody}${unsubscribeLink}${pixel}`
}

export async function sendEmail({ accountId, to, subject, body, trackingId }: SendEmailParams) {
  const supabase = await createClient()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { data: account, error } = await supabase
    .from('email_accounts')
    .select('*')
    .eq('id', accountId)
    .single()

  if (error || !account) throw new Error('Email account not found')

  const finalBody = trackingId ? injectTracking(body, trackingId, baseUrl) : body

  if (account.provider === 'smtp') {
    const transporter = nodemailer.createTransport({
      host: account.smtp_host,
      port: account.smtp_port,
      secure: account.smtp_port === 465,
      auth: { user: account.smtp_user, pass: account.smtp_pass },
    })

    const info = await transporter.sendMail({
      from: `"${account.email}" <${account.smtp_user}>`,
      to,
      subject,
      html: finalBody,
    })

    return info
  }

  throw new Error('Unsupported provider')
}
