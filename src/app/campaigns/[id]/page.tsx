"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronDown, 
  MoreHorizontal, 
  Mail, 
  CornerDownRight, 
  Plus, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Trash2,
  Brain,
  Layers,
  Clock,
  ExternalLink,
  RotateCcw,
  Users,
  Loader2,
  Save,
  Rocket,
  X,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { launchCampaign } from "@/lib/actions/scheduler";
import { getContacts, type Contact } from "@/lib/actions/contacts";

interface Step {
  id: string;
  type: "email" | "wait";
  title: string;
  duration?: string;
  subject?: string;
  body?: string;
  position: number;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  account_id?: string;
}

export default function SequenceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const supabase = createClient();

  const [steps, setSteps] = useState<Step[]>([]);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  // Launch / Contact Picker State
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchResult, setLaunchResult] = useState<{ queued: number; error: string | null } | null>(null);

  useEffect(() => {
    if (campaignId) {
      fetchCampaignData();
    }
  }, [campaignId]);

  async function fetchCampaignData() {
    setLoading(true);
    // Fetch Campaign
    const { data: campaignData } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    // Fetch Steps
    const { data: stepsData } = await supabase
      .from('campaign_steps')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('position', { ascending: true });

    // Fetch Accounts for the dropdown
    const { data: accountsData } = await supabase
      .from('email_accounts')
      .select('id, email, provider');

    if (campaignData) setCampaign(campaignData);
    if (stepsData) {
      setSteps(stepsData.map((s: any) => ({
        id: s.id,
        type: s.wait_days ? 'wait' : 'email',
        title: s.wait_days ? 'Wait' : (s.subject || 'Follow-up'),
        duration: s.wait_days ? `${s.wait_days} DAYS` : undefined,
        subject: s.subject,
        body: s.body,
        position: s.position
      })));
      if (stepsData.length > 0) setActiveStepId(stepsData[0].id);
    }
    if (accountsData) setAccounts(accountsData);
    setLoading(false);
  }

  async function handleSave() {
    if (!campaign) return;
    if (!campaign.account_id) {
      alert('Please select a sender account first.');
      return;
    }
    setIsSaving(true);

    try {
      // Save steps
      await supabase.from('campaign_steps').delete().eq('campaign_id', campaignId);
      const stepsToInsert = steps.map((step, idx) => ({
        campaign_id: campaignId,
        position: idx,
        subject: step.type === 'email' ? step.subject : null,
        body: step.type === 'email' ? step.body : null,
        wait_days: step.type === 'wait' ? parseInt(step.duration?.split(' ')[0] || '1') : null,
      }));
      await supabase.from('campaign_steps').insert(stepsToInsert);

      // Update account
      await supabase
        .from('campaigns')
        .update({ account_id: campaign.account_id })
        .eq('id', campaignId);

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setIsSaving(false);
    }
  }

  const handleLaunchClick = async () => {
    setIsLaunchModalOpen(true);
    setLaunchResult(null);
    const { data } = await getContacts();
    if (data) setAllContacts(data);
  };

  const handleLaunchCampaign = async () => {
    if (selectedContactIds.length === 0) return;
    setIsLaunching(true);
    const result = await launchCampaign(campaignId, selectedContactIds);
    setLaunchResult(result);
    setIsLaunching(false);
    if (!result.error) {
      setTimeout(() => {
        setIsLaunchModalOpen(false);
        router.refresh();
      }, 3000);
    }
  };

  const addStep = (type: "email" | "wait") => {
    const newId = `new-${Date.now()}`;
    const newStep: Step = type === "email" ? {
      id: newId,
      type: "email",
      title: "New Email",
      subject: "Subject line...",
      body: "Hi {{first_name}},\n\n...",
      position: steps.length
    } : {
      id: newId,
      type: "wait",
      title: "Wait",
      duration: "3 DAYS",
      position: steps.length
    };
    setSteps([...steps, newStep]);
    setActiveStepId(newId);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-50 h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
          <p className="text-zinc-500 font-bold">Loading sequence...</p>
        </div>
      </div>
    );
  }

  const currentStep = steps.find(s => s.id === activeStepId);
  const currentEmailBody = currentStep?.body || "";
  const linkCount = (currentEmailBody.match(/http/g) || []).length;
  const hasUnsubscribe = currentEmailBody.toLowerCase().includes("unsubscribe");
  const auditScore = Math.max(0, 100 - (linkCount > 1 ? 15 : 0) - (!hasUnsubscribe ? 10 : 0));

  const filteredContacts = allContacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-inter relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-bold tracking-tight">Sequence saved successfully!</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-zinc-200">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-zinc-200 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">{campaign?.name || "Untitled Sequence"}</h1>
            <div className="h-4 w-px bg-zinc-200 mx-2" />
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sender Account:</span>
               <select 
                 className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100"
                 value={campaign?.account_id || ""}
                 onChange={(e) => setCampaign(c => c ? { ...c, account_id: e.target.value } : null)}
               >
                 <option value="">Select Account...</option>
                 {accounts.map(acc => (
                   <option key={acc.id} value={acc.id}>{acc.email} ({acc.provider})</option>
                 ))}
               </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                "bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-xl font-bold transition-all text-sm active:scale-[0.98] flex items-center gap-2",
                isSaving && "opacity-80 cursor-not-allowed"
              )}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button 
              onClick={handleLaunchClick}
              disabled={isSaving || !campaign?.account_id || steps.filter(s => s.type === 'email').length === 0}
              className={cn(
                "bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/25 transition-all text-sm active:scale-[0.98] flex items-center gap-2",
                (!campaign?.account_id || steps.filter(s => s.type === 'email').length === 0) && "opacity-50 cursor-not-allowed grayscale"
              )}
            >
              <Rocket className="h-4 w-4" />
              Launch Campaign
            </button>
          </div>
        </header>

        {/* Workflow Editor */}
        <div className="flex-1 overflow-y-auto px-10 pt-10 pb-32 no-scrollbar space-y-12">
          {steps.length === 0 && (
             <div className="text-center py-20">
                <Layers className="h-12 w-12 text-zinc-200 mx-auto mb-4" />
                <p className="text-zinc-400 font-bold">No steps yet. Add your first email to start.</p>
             </div>
          )}

          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className={cn(
                "relative group/step animate-in fade-in slide-in-from-bottom-2 duration-500",
                activeStepId === step.id ? "opacity-100" : "opacity-60 grayscale-[40%]"
              )} onClick={() => setActiveStepId(step.id)}>
                {step.type === "email" ? (
                  <div className="max-w-3xl mx-auto relative cursor-pointer">
                    <div className={cn(
                      "flex items-start bg-white rounded-3xl border transition-all duration-300 overflow-hidden",
                      activeStepId === step.id ? "border-blue-400 shadow-xl" : "border-zinc-200"
                    )}>
                      <div className="p-6">
                        <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center", activeStepId === step.id ? "bg-blue-600 text-white" : "bg-zinc-50 text-zinc-400")}>
                          <Mail className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="flex-1 p-6 pl-0">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-sm font-black text-zinc-900 tracking-tight">{step.title}</h3>
                          <button 
                             onClick={(e) => { e.stopPropagation(); setSteps(steps.filter(s => s.id !== step.id)) }}
                             className="p-1.5 hover:bg-neutral-100 rounded-lg text-zinc-300 hover:text-red-500 transition-colors"
                          >
                             <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <input 
                            type="text" 
                            placeholder="Subject line..." 
                            className="w-full text-sm font-bold focus:outline-none placeholder:text-zinc-300 bg-transparent py-2 border-b border-zinc-100"
                            value={step.subject}
                            onChange={(e) => {
                              const newSteps = [...steps];
                              newSteps[index].subject = e.target.value;
                              setSteps(newSteps);
                            }}
                          />
                          <textarea 
                             className="w-full h-44 text-[13px] leading-relaxed text-zinc-600 font-medium p-6 bg-zinc-50/50 rounded-2xl border border-zinc-100/50 resize-none focus:outline-none"
                             value={step.body}
                             onChange={(e) => {
                               const newSteps = [...steps];
                               newSteps[index].body = e.target.value;
                               setSteps(newSteps);
                             }}
                          />
                        </div>
                        
                        <div className="flex items-center gap-2 mt-4">
                           <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md uppercase tracking-widest">
                              Variable Support: {"{{first_name}}, {{company}}"}
                           </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center flex-col items-center relative py-4">
                     <div className="h-px bg-zinc-200 w-full absolute top-1/2 -z-10" />
                     <div className="bg-white border-2 border-zinc-100 px-6 py-2 rounded-full shadow-sm">
                        <input 
                           type="number" 
                           className="w-10 text-center font-black text-blue-600 outline-none"
                           value={step.duration?.split(' ')[0]} 
                           onChange={(e) => {
                              const newSteps = [...steps];
                              newSteps[index].duration = `${e.target.value} DAYS`;
                              setSteps(newSteps);
                           }}
                        />
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Days Wait</span>
                     </div>
                  </div>
                )}
              </div>
            </React.Fragment>
          ))}

          {/* Add Step Controller */}
          <div className="flex justify-center pt-8">
            <div className="bg-white p-2 rounded-[24px] border border-zinc-200 shadow-xl flex items-center gap-2">
               <button 
                 onClick={() => addStep("email")}
                 className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-[18px] text-[12px] font-black uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
               >
                  <Mail className="h-4 w-4" />
                  Add Email Step
               </button>
               <button 
                 onClick={() => addStep("wait")}
                 className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-[18px] text-[12px] font-black uppercase tracking-wider hover:bg-zinc-800 transition-all"
               >
                  <Clock className="h-4 w-4" />
                  Add Wait Step
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Sidebar */}
      <aside className="w-[340px] bg-white p-8 border-l border-zinc-100 flex flex-col h-screen sticky top-0">
          <div className="mb-10">
            <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.15em] mb-4">Sequence Accuracy</h4>
            <div className="flex items-end gap-3 mb-5">
              <span className="text-5xl font-black text-zinc-900 leading-none tabular-nums">{auditScore}</span>
              <span className="text-sm font-bold text-zinc-300 mb-1.5 font-mono">/100</span>
            </div>
            <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden">
               <div className={cn("h-full rounded-full transition-all duration-700 bg-blue-500")} style={{ width: `${auditScore}%` }} />
            </div>
          </div>

          <div className="space-y-6">
             <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-2">
                <h5 className="text-xs font-black text-zinc-900 uppercase">Deliverability Check</h5>
                <p className="text-[11px] text-zinc-500 font-bold leading-relaxed">
                   {linkCount > 1 ? "⚠️ Excessive links detected. High spam risk." : "✅ Link density is healthy."}<br/>
                   {hasUnsubscribe ? "✅ Unsubscribe link found." : "❌ Missing unsubscribe link."}
                </p>
             </div>
          </div>

          <div className="mt-auto p-6 bg-blue-600 rounded-[32px] text-white">
             <div className="flex items-center gap-2 mb-3">
                <Zap className="h-5 w-5 fill-white" />
                <span className="text-[11px] font-black uppercase">Ready to send?</span>
             </div>
             <p className="text-xs font-bold leading-relaxed opacity-90">
                You have {steps.filter(s => s.type === 'email').length} email steps. Make sure to assign a sender account above to start dispatching.
             </p>
          </div>
      </aside>

      {/* Launch Modal */}
      {isLaunchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => !isLaunching && setIsLaunchModalOpen(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-100">
              <h2 className="text-xl font-black text-zinc-900 tracking-tight">Launch Campaign</h2>
              <button 
                onClick={() => setIsLaunchModalOpen(false)} 
                className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 transition-colors"
                disabled={isLaunching}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-8">
              {launchResult ? (
                <div className="text-center py-10 space-y-4">
                  {launchResult.error ? (
                    <>
                      <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                        <AlertTriangle className="h-8 w-8" />
                      </div>
                      <h3 className="text-lg font-bold text-zinc-900">Launch Failed</h3>
                      <p className="text-sm text-red-500 font-medium">{launchResult.error}</p>
                    </>
                  ) : (
                    <>
                      <div className="h-16 w-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>
                      <h3 className="text-lg font-bold text-zinc-900">Campaign Launched!</h3>
                      <p className="text-sm text-zinc-500 font-bold">{launchResult.queued} emails queued successfully.</p>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-black pt-2">Closing in a few seconds...</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Select Contacts</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <input 
                        type="text" 
                        placeholder="Search contacts..." 
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20" 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto border border-zinc-100 rounded-2xl divide-y divide-zinc-50 no-scrollbar">
                    {filteredContacts.length > 0 ? filteredContacts.map(contact => (
                      <label key={contact.id} className="flex items-center gap-3 p-4 hover:bg-zinc-50 cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          className="h-5 w-5 rounded-lg border-zinc-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                          checked={selectedContactIds.includes(contact.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedContactIds([...selectedContactIds, contact.id]);
                            else setSelectedContactIds(selectedContactIds.filter(id => id !== contact.id));
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-zinc-900 truncate">{contact.name}</p>
                          <p className="text-[11px] text-zinc-400 font-medium truncate">{contact.email}</p>
                        </div>
                      </label>
                    )) : (
                      <div className="p-10 text-center text-zinc-400 text-sm font-bold">
                        No contacts found
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <p className="text-xs font-bold text-zinc-500">
                      {selectedContactIds.length} contacts selected
                    </p>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setIsLaunchModalOpen(false)}
                        className="px-6 py-2.5 text-sm font-bold text-zinc-500 hover:bg-zinc-100 rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleLaunchCampaign}
                        disabled={selectedContactIds.length === 0 || isLaunching}
                        className="flex items-center gap-2 bg-blue-600 text-white px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:grayscale"
                      >
                        {isLaunching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                        {isLaunching ? "Launching..." : "Confirm Launch"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
