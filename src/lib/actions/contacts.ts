'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type Contact = {
  id: string
  user_id: string
  name: string
  email: string
  job_title: string | null
  company: string | null
  phone: string | null
  custom_fields: Record<string, string>
  email_status: 'verified' | 'unverified' | 'bounced' | 'unsubscribed'
  created_at: string
  updated_at: string
}

export type AddContactInput = {
  name: string
  email: string
  job_title?: string
  company?: string
  phone?: string
  custom_fields?: Record<string, string>
}

export async function getContacts(): Promise<{ data: Contact[] | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: data as Contact[], error: null }
}

export async function addContact(input: AddContactInput): Promise<{ data: Contact | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('contacts')
    .insert({
      user_id: user.id,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      job_title: input.job_title?.trim() || null,
      company: input.company?.trim() || null,
      phone: input.phone?.trim() || null,
      custom_fields: input.custom_fields || {},
      email_status: 'unverified',
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return { data: null, error: 'A contact with this email already exists.' }
    return { data: null, error: error.message }
  }

  revalidatePath('/contacts')
  return { data: data as Contact, error: null }
}

export async function importContacts(contacts: AddContactInput[]): Promise<{ inserted: number; skipped: number; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { inserted: 0, skipped: 0, error: 'Unauthorized' }

  const seen = new Set<string>()
  const deduped = contacts.filter(c => {
    const key = c.email.trim().toLowerCase()
    if (seen.has(key) || !key) return false
    seen.add(key)
    return true
  })

  const rows = deduped.map(c => ({
    user_id: user.id,
    name: c.name?.trim() || '(No Name)',
    email: c.email.trim().toLowerCase(),
    job_title: c.job_title?.trim() || null,
    company: c.company?.trim() || null,
    phone: c.phone?.trim() || null,
    custom_fields: c.custom_fields || {},
    email_status: 'unverified' as const,
  }))

  const { data, error } = await supabase
    .from('contacts')
    .upsert(rows, { onConflict: 'user_id,email', ignoreDuplicates: true })
    .select('id')

  if (error) return { inserted: 0, skipped: 0, error: error.message }

  const inserted = data?.length ?? 0
  const skipped = deduped.length - inserted
  revalidatePath('/contacts')
  return { inserted, skipped, error: null }
}

export async function deleteContact(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('contacts')
    .delete()
    .match({ id, user_id: user.id })

  if (error) return { error: error.message }
  revalidatePath('/contacts')
  return { error: null }
}
