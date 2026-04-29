'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import nodemailer from 'nodemailer'

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

  // Test the connection
  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user: user_smtp,
        pass,
      },
    })

    await transporter.verify()
  } catch (error: any) {
    return { error: `Connection failed: ${error.message}` }
  }

  // Save to database
  const { error: dbError } = await supabase.from('email_accounts').insert({
    user_id: user.id,
    email,
    provider: 'smtp',
    smtp_host: host,
    smtp_port: port,
    smtp_user: user_smtp,
    smtp_pass: pass,
    daily_limit,
  })

  if (dbError) {
    return { error: dbError.message }
  }

  revalidatePath('/accounts')
  return { success: true }
}

export async function deleteEmailAccount(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('email_accounts').delete().match({ id })

  if (error) return { error: error.message }

  revalidatePath('/accounts')
  return { success: true }
}
