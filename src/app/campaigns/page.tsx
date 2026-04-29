"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Play, 
  Pause, 
  Edit2, 
  Trash2,
  Mail,
  Eye,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

const campaigns = [
  {
    id: 1,
    name: "Q1 SaaS Outreach",
    status: "Active",
    sent: 1240,
    opens: 856,
    replies: 42,
    lastActive: "2 hours ago",
    progress: 85
  },
  {
    id: 2,
    name: "Enterprise Founders",
    status: "Paused",
    sent: 450,
    opens: 312,
    replies: 12,
    lastActive: "1 day ago",
    progress: 45
  },
  {
    id: 3,
    name: "Growth Agency Leads",
    status: "Draft",
    sent: 0,
    opens: 0,
    replies: 0,
    lastActive: "3 days ago",
    progress: 0
  },
  {
    id: 4,
    name: "Cold Warm-up Batch #1",
    status: "Active",
    sent: 890,
    opens: 612,
    replies: 18,
    lastActive: "5 hours ago",
    progress: 92
  }
];

export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50">
      <PageHeader
        title="Sequences"
        subtitle="Manage and monitor your automated email outreach"
        actions={
          <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20">
            <Plus className="h-4 w-4" />
            New Sequence
          </button>
        }
      />

      <div className="p-8 space-y-6">

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search campaigns..."
            className="w-full bg-card/50 border border-border rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-card/50 border border-border rounded-xl hover:bg-muted transition-all">
          <Filter className="h-5 w-5" />
          Filters
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {campaigns.map((campaign) => (
          <Link 
            href={`/campaigns/${campaign.id}`}
            key={campaign.id} 
            className="group p-6 rounded-3xl border border-border bg-card/50 backdrop-blur-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 block"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold">{campaign.name}</h3>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-semibold",
                    campaign.status === "Active" && "bg-emerald-500/10 text-emerald-500",
                    campaign.status === "Paused" && "bg-amber-500/10 text-amber-500",
                    campaign.status === "Draft" && "bg-zinc-500/10 text-zinc-500"
                  )}>
                    {campaign.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Last active {campaign.lastActive}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-2 hover:bg-muted rounded-lg transition-colors">
                  {campaign.status === "Active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </div>
                <div className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <Edit2 className="h-4 w-4" />
                </div>
                <div className="p-2 hover:bg-muted rounded-lg transition-colors text-destructive">
                  <Trash2 className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Sent</span>
                </div>
                <p className="text-lg font-bold">{campaign.sent}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Opens</span>
                </div>
                <p className="text-lg font-bold">{campaign.opens} <span className="text-xs font-normal text-muted-foreground ml-1">({campaign.sent > 0 ? ((campaign.opens/campaign.sent)*100).toFixed(1) : 0}%)</span></p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Replies</span>
                </div>
                <p className="text-lg font-bold">{campaign.replies} <span className="text-xs font-normal text-muted-foreground ml-1">({campaign.sent > 0 ? ((campaign.replies/campaign.sent)*100).toFixed(1) : 0}%)</span></p>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-muted-foreground">Progress</span>
                <span>{campaign.progress}%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${campaign.progress}%` }} 
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
      </div>
    </div>
  );
}
