"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Mail, 
  Building2, 
  ExternalLink,
  Loader2,
  Rocket
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchLeads() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('campaign_contacts')
        .select('*, contacts(*), campaigns(name)')
        .order('added_at', { ascending: false });

      if (data) setLeads(data);
      setLoading(false);
    }
    fetchLeads();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50">
      <PageHeader
        title="Leads"
        subtitle="Manage leads enrolled in your campaigns"
      />

      <main className="p-8">
        <div className="bg-white border border-zinc-200 rounded-[2.5rem] shadow-sm overflow-hidden">
          {/* Table Controls */}
          <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="Search leads..." 
                  className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-all">
                <Filter className="h-4 w-4" />
                Filter
              </button>
            </div>
          </div>

          {/* Leads Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">
                  <th className="px-8 py-5">Lead Info</th>
                  <th className="px-8 py-5">Campaign</th>
                  <th className="px-8 py-5 text-center">Status</th>
                  <th className="px-8 py-5 text-center">Enrolled At</th>
                  <th className="px-8 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                      <p className="text-zinc-400 font-bold mt-4">Loading leads...</p>
                    </td>
                  </tr>
                ) : leads.length > 0 ? leads.map((lead) => (
                  <tr key={lead.id} className="group hover:bg-zinc-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{lead.contacts?.name}</p>
                          <p className="text-xs text-zinc-400 font-medium">{lead.contacts?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <Rocket className="h-3.5 w-3.5 text-zinc-300" />
                        <span className="text-xs font-bold text-zinc-600">{lead.campaigns?.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                          lead.status === 'active' ? "bg-emerald-50 text-emerald-600" : 
                          lead.status === 'unsubscribed' ? "bg-rose-50 text-rose-500" :
                          "bg-zinc-100 text-zinc-400"
                        )}>
                          {lead.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center text-xs font-bold text-zinc-400">
                      {new Date(lead.added_at).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <Link href={`/contacts/${lead.contact_id}`} className="p-2 text-zinc-300 hover:text-blue-600 transition-colors inline-block">
                        <ExternalLink className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-30">
                        <Users className="h-12 w-12" />
                        <p className="text-zinc-500 font-bold max-w-xs">No leads yet. Launch a campaign to see leads appear here.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
