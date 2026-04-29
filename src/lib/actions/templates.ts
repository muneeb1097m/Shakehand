'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type Template = {
  id: string
  user_id: string
  name: string
  subject: string
  body: string
  category: string
  created_at: string
}

export async function getTemplates(): Promise<{ data: Template[] | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: data as Template[], error: null }
}

export async function createTemplate(input: {
  name: string
  subject: string
  body: string
  category: string
}): Promise<{ data: Template | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('templates')
    .insert({ user_id: user.id, ...input })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/templates')
  return { data: data as Template, error: null }
}

export async function updateTemplate(id: string, input: {
  name?: string
  subject?: string
  body?: string
  category?: string
}): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('templates')
    .update({ ...input, updated_at: new Date().toISOString() })
    .match({ id, user_id: user.id })

  if (error) return { error: error.message }
  revalidatePath('/templates')
  return { error: null }
}

export async function deleteTemplate(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('templates')
    .delete()
    .match({ id, user_id: user.id })

  if (error) return { error: error.message }
  revalidatePath('/templates')
  return { error: null }
}
