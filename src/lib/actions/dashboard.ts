'use server'

import { createClient } from '@/utils/supabase/server'

export async function getDashboardStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [sentResult, openedResult, clickedResult, repliedResult, campaignsResult, contactsResult] = await Promise.all([
    supabase.from('email_queue').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'sent'),
    supabase.from('email_queue').select('id', { count: 'exact', head: true }).eq('user_id', user.id).not('opened_at', 'is', null),
    supabase.from('email_queue').select('id', { count: 'exact', head: true }).eq('user_id', user.id).not('clicked_at', 'is', null),
    supabase.from('email_queue').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'sent').not('opened_at', 'is', null),
    supabase.from('campaigns').select('id, name, status, created_at', { count: 'exact' }).eq('user_id', user.id).eq('status', 'active').limit(5),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  const totalSent = sentResult.count ?? 0
  const totalOpened = openedResult.count ?? 0
  const totalClicked = clickedResult.count ?? 0

  return {
    totalSent,
    openRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) + '%' : '0%',
    clickRate: totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) + '%' : '0%',
    replyRate: '0%',
    activeCampaigns: campaignsResult.data ?? [],
    totalContacts: contactsResult.count ?? 0,
  }
}
