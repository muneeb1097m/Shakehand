import nodemailer from 'nodemailer'
import { createClient } from '@/utils/supabase/server'

interface SendEmailParams {
  accountId: string
  to: string
  subject: string
  body: string
}

export async function sendEmail({ accountId, to, subject, body }: SendEmailParams) {
  const supabase = await createClient()
  
  // Fetch account details
  const { data: account, error } = await supabase
    .from('email_accounts')
    .select('*')
    .eq('id', accountId)
    .single()

  if (error || !account) {
    throw new Error('Email account not found or unauthorized')
  }

  if (account.provider === 'smtp') {
    const transporter = nodemailer.createTransport({
      host: account.smtp_host,
      port: account.smtp_port,
      secure: account.smtp_port === 465,
      auth: {
        user: account.smtp_user,
        pass: account.smtp_pass,
      },
    })

    const info = await transporter.sendMail({
      from: `"${account.email}" <${account.email}>`,
      to,
      subject,
      html: body,
    })

    return info
  } else if (account.provider === 'google') {
    // For Google, you'd typically use the Gmail API with the refresh token
    // This is a placeholder for that implementation
    throw new Error('Google sending not yet implemented. Requires OAuth2 flow.')
  }

  throw new Error('Unsupported provider')
}
