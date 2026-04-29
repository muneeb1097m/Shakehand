'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type Campaign = {
  id: string
  user_id: string
  name: string
  status: 'draft' | 'active' | 'paused'
  created_at: string
}

export async function getCampaigns(): Promise<{ data: Campaign[] | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: data as Campaign[], error: null }
}

export async function createCampaign(name: string): Promise<{ data: Campaign | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('campaigns')
    .insert({ user_id: user.id, name: name.trim(), status: 'draft' })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/campaigns')
  return { data: data as Campaign, error: null }
}

export async function updateCampaignStatus(id: string, status: 'active' | 'paused' | 'draft'): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('campaigns')
    .update({ status })
    .match({ id, user_id: user.id })

  if (error) return { error: error.message }
  revalidatePath('/campaigns')
  return { error: null }
}

export async function deleteCampaign(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('campaigns')
    .delete()
    .match({ id, user_id: user.id })

  if (error) return { error: error.message }
  revalidatePath('/campaigns')
  return { error: null }
}
