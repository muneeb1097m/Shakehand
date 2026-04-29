"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { 
  Users, 
  Search, 
  Download, 
  Upload, 
  Plus, 
  MoreHorizontal,
  Mail,
  Phone,
  Building2,
  Tag
} from "lucide-react";
import { cn } from "@/lib/utils";

const leads: any[] = [];

export default function LeadsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "replied": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "interested": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "contacted": return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
      default: return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50">
      <PageHeader
        title="Leads"
        subtitle="Manage your prospective clients and their engagement history"
        actions={
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all font-semibold text-sm text-zinc-700 shadow-sm">
              <Upload className="h-4 w-4 text-zinc-400" />
              Import CSV
            </button>
            <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20">
              <Plus className="h-4 w-4" />
              Add Lead
            </button>
          </div>
        }
      />

      <div className="p-8 space-y-8">

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search leads by name, email, or company..."
            className="w-full bg-card/50 border border-border rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-card/50 border border-border rounded-xl hover:bg-muted transition-all">
          <Download className="h-5 w-5" />
          Export
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card/50 backdrop-blur-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lead</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Campaign</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Activity</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leads.length > 0 ? leads.map((lead) => (
              <tr key={lead.id} className="group hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-primary">
                      {lead.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold">{lead.name}</p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <Building2 className="h-3 w-3" />
                        {lead.company}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-widest",
                    getStatusColor(lead.status)
                  )}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    {lead.campaign}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {lead.lastActivity}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground font-bold">
                  No leads yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
