"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  MessageSquare,
  Loader2,
  X,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  getCampaigns, 
  createCampaign, 
  updateCampaignStatus, 
  deleteCampaign, 
  type Campaign 
} from "@/lib/actions/campaigns";

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    setIsLoading(true);
    const { data, error } = await getCampaigns();
    if (data) setCampaigns(data);
    if (error) console.error("Error fetching campaigns:", error);
    setIsLoading(false);
  }

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;

    setIsCreating(true);
    setError(null);

    const { data, error } = await createCampaign(newCampaignName);
    
    if (error) {
      setError(error);
      setIsCreating(false);
    } else if (data) {
      router.push(`/campaigns/${data.id}`);
    }
  };

  const handleToggleStatus = async (e: React.MouseEvent, campaign: Campaign) => {
    e.preventDefault();
    e.stopPropagation();

    const nextStatus = campaign.status === "active" ? "paused" : "active";
    const { error } = await updateCampaignStatus(campaign.id, nextStatus);

    if (error) {
      alert("Error updating status: " + error);
    } else {
      setCampaigns(campaigns.map(c => 
        c.id === campaign.id ? { ...c, status: nextStatus } : c
      ));
    }
  };

  const handleDeleteCampaign = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this sequence?")) return;

    const { error } = await deleteCampaign(id);
    if (error) {
      alert("Error deleting sequence: " + error);
    } else {
      setCampaigns(campaigns.filter(c => c.id !== id));
    }
  };

  const filteredCampaigns = campaigns.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50">
      <PageHeader
        title="Sequences"
        subtitle="Manage and monitor your automated email outreach"
        actions={
          <button 
            onClick={() => { setIsNewModalOpen(true); setError(null); setNewCampaignName(""); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
          >
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
              className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all font-semibold text-sm">
            <Filter className="h-5 w-5 text-zinc-400" />
            Filters
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <p className="font-medium text-lg">Loading sequences...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-4 bg-white border border-zinc-200 rounded-3xl border-dashed">
            <div className="h-16 w-16 bg-zinc-100 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-zinc-400" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-zinc-900">No sequences found</h3>
              <p className="text-sm text-zinc-500 max-w-xs mx-auto mt-1">
                {searchQuery ? "Try a different search term or clear the filter." : "Get started by creating your first automated email outreach sequence."}
              </p>
            </div>
            {!searchQuery && (
              <button 
                onClick={() => setIsNewModalOpen(true)}
                className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all"
              >
                <Plus className="h-4 w-4" /> Create Sequence
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredCampaigns.map((campaign) => (
              <Link 
                href={`/campaigns/${campaign.id}`}
                key={campaign.id} 
                className="group p-6 rounded-3xl border border-zinc-200 bg-white hover:shadow-xl hover:border-blue-500/20 transition-all duration-300 block"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-zinc-900">{campaign.name}</h3>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider",
                        campaign.status === "active" && "bg-emerald-50 text-emerald-600",
                        campaign.status === "paused" && "bg-amber-50 text-amber-600",
                        campaign.status === "draft" && "bg-zinc-100 text-zinc-600"
                      )}>
                        {campaign.status}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500">Created {new Date(campaign.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => handleToggleStatus(e, campaign)}
                      className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-600"
                      title={campaign.status === "active" ? "Pause" : "Play"}
                    >
                      {campaign.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <button 
                      className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-600"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteCampaign(e, campaign.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Mail className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Sent</span>
                    </div>
                    <p className="text-lg font-bold text-zinc-900">0</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Eye className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Opens</span>
                    </div>
                    <p className="text-lg font-bold text-zinc-900">0 <span className="text-xs font-normal text-zinc-400 ml-1">(0%)</span></p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Replies</span>
                    </div>
                    <p className="text-lg font-bold text-zinc-900">0 <span className="text-xs font-normal text-zinc-400 ml-1">(0%)</span></p>
                  </div>
                </div>

                <div className="mt-8 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-zinc-400">Progress</span>
                    <span className="text-zinc-900">0%</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-500" 
                      style={{ width: `0%` }} 
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* New Sequence Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => !isCreating && setIsNewModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <h2 className="text-lg font-bold text-zinc-900">Create New Sequence</h2>
              <button 
                onClick={() => setIsNewModalOpen(false)} 
                className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 transition-colors"
                disabled={isCreating}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCampaign} className="p-6 space-y-4 bg-zinc-50/50">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> {error}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Sequence Name</label>
                <input 
                  autoFocus
                  required 
                  placeholder="e.g. Q4 SaaS Founders Outreach" 
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                  value={newCampaignName} 
                  onChange={e => setNewCampaignName(e.target.value)} 
                  disabled={isCreating}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
                <button 
                  type="button" 
                  onClick={() => setIsNewModalOpen(false)} 
                  className="px-5 py-2.5 text-sm font-bold text-zinc-600 rounded-xl hover:bg-zinc-100 transition-colors"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isCreating || !newCampaignName.trim()}
                  className="px-6 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md flex items-center gap-2 disabled:opacity-50 transition-all"
                >
                  {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isCreating ? "Creating..." : "Create Sequence"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
