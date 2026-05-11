'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import nodemailer from 'nodemailer'
import { encryptSecret } from '@/lib/crypto'
import { checkDomainAuth } from '@/lib/dns-check'

export async function addSmtpAccount(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const email = formData.get('email') as string
  const host = formData.get('host') as string
  const port = parseInt(formData.get('port') as string)
  const user_smtp = formData.get('user') as string
  const pass = formData.get('pass') as string
  const daily_limit = parseInt(formData.get('daily_limit') as string) || 50
  const sender_name = (formData.get('sender_name') as string) || null
  const sender_address = (formData.get('sender_address') as string) || null
  const imap_host = (formData.get('imap_host') as string) || null
  const imap_port_raw = formData.get('imap_port') as string | null
  const imap_port = imap_port_raw ? parseInt(imap_port_raw) : null
  const imap_user = (formData.get('imap_user') as string) || user_smtp
  const imap_pass = (formData.get('imap_pass') as string) || pass

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user: user_smtp, pass },
    })
    await transporter.verify()
  } catch (error: any) {
    return { error: `Connection failed: ${error.message}` }
  }

  const auth = await checkDomainAuth(email)

  const { error: dbError } = await supabase.from('email_accounts').insert({
    user_id: user.id,
    email,
    provider: 'smtp',
    smtp_host: host,
    smtp_port: port,
    smtp_user: user_smtp,
    smtp_pass: encryptSecret(pass),
    daily_limit,
    sender_name,
    sender_address,
    imap_host,
    imap_port,
    imap_user: imap_host ? imap_user : null,
    imap_pass: imap_host ? encryptSecret(imap_pass) : null,
    spf_status: auth.spf,
    dkim_status: auth.dkim,
    dmarc_status: auth.dmarc,
    auth_checked_at: new Date().toISOString(),
  })

  if (dbError) return { error: dbError.message }

  revalidatePath('/accounts')
  return {
    success: true,
    auth: {
      spf: auth.spf,
      dkim: auth.dkim,
      dmarc: auth.dmarc,
      warning: (auth.spf !== 'pass' || auth.dmarc !== 'pass')
        ? 'Your domain is missing SPF or DMARC records — cold sends will likely land in spam. Add these DNS records before launching campaigns.'
        : null,
    },
  }
}

export async function deleteEmailAccount(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('email_accounts').delete().match({ id })

  if (error) return { error: error.message }

  revalidatePath('/accounts')
  return { success: true }
}
