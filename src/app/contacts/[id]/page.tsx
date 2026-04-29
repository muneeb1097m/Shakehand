"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import {
  Mail, Building2, Phone, Globe, Link2, Tag, Plus, MoreVertical,
  CheckCircle2, MousePointer2, RotateCcw, Send, Clock, Edit3, X, Save,
  Loader2, AlertCircle, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { type Contact } from "@/lib/actions/contacts";

const TAGS_OPTIONS = ["ICP", "Hot Lead", "Do Not Contact", "Decision Maker", "Champion", "Unsubscribed"];

export default function ContactProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const supabase = createClient();

  const [contact, setContact] = useState<Contact | null>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"activity" | "campaigns" | "notes">("activity");
  const [notes, setNotes] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [addingTag, setAddingTag] = useState(false);

  useEffect(() => {
    if (id) {
      fetchContactData();
    }
  }, [id]);

  async function fetchContactData() {
    setLoading(true);
    setError(null);

    // Fetch Contact
    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();

    if (contactError) {
      setError(contactError.message);
      setLoading(false);
      return;
    }

    setContact(contactData);
    setNotes(contactData.notes || "");
    // In a real app, tags would be a separate column or table
    setTags(contactData.custom_fields?.tags ? (contactData.custom_fields.tags as string).split(',') : []);

    // Fetch Activity from email_queue
    const { data: queueData } = await supabase
      .from('email_queue')
      .select('*, campaigns(name)')
      .eq('contact_id', id)
      .order('created_at', { ascending: false });

    if (queueData) {
      const formattedActivity = queueData.flatMap((item: any) => {
        const events = [];
        if (item.sent_at) events.push({ type: 'sent', label: `Sent: ${item.subject}`, time: new Date(item.sent_at).toLocaleString(), icon: Send, color: "text-zinc-500", bg: "bg-zinc-100" });
        if (item.opened_at) events.push({ type: 'opened', label: `Opened: ${item.subject}`, time: new Date(item.opened_at).toLocaleString(), icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" });
        if (item.clicked_at) events.push({ type: 'clicked', label: `Clicked: ${item.subject}`, time: new Date(item.clicked_at).toLocaleString(), icon: MousePointer2, color: "text-indigo-600", bg: "bg-indigo-50" });
        return events;
      });
      setActivity(formattedActivity);

      // Unique campaigns this contact is in
      const uniqueCampaigns = Array.from(new Set(queueData.map((i: any) => i.campaign_id))).map(cid => {
        const item = queueData.find((i: any) => i.campaign_id === cid);
        return {
          name: item.campaigns?.name || 'Unknown Campaign',
          status: 'Active',
          openRate: item.opened_at ? '100%' : '0%'
        };
      });
      setCampaigns(uniqueCampaigns);
    }

    setLoading(false);
  }

  const handleSaveNotes = async () => {
    if (!contact) return;
    const { error } = await supabase
      .from('contacts')
      .update({ notes })
      .eq('id', id);
    
    if (error) alert("Error saving notes: " + error.message);
    else setEditingNotes(false);
  };

  const toggleTag = (tag: string) => setTags(t => t.includes(tag) ? t.filter(x => x !== tag) : [...t, tag]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50/50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="mt-4 text-zinc-500 font-bold">Loading contact profile...</p>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50/50 p-8">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-zinc-900">Contact Not Found</h2>
        <p className="text-zinc-500 mt-2 text-center">{error || "The contact you're looking for doesn't exist or you don't have access."}</p>
        <button onClick={() => window.history.back()} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">Go Back</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50">
      <PageHeader title="Contact Profile" subtitle={`${contact.name} · ${contact.company || 'Private'}`} />

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Contact Card */}
          <div className="space-y-5">
            {/* Profile Card */}
            <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-black shadow-md shadow-blue-500/20">
                  {contact.name.split(" ").map((n: string) => n[0]).join("")}
                </div>
                <button className="p-2 hover:bg-zinc-50 rounded-xl text-zinc-400 hover:text-zinc-600 transition-all">
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
              <h2 className="text-xl font-black text-zinc-900">{contact.name}</h2>
              <p className="text-sm text-zinc-500 mt-0.5">{contact.job_title || "No Title"}</p>

              <span className={cn("inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider",
                contact.email_status === "verified" ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-500")}>
                <CheckCircle2 className="h-3 w-3" />{contact.email_status}
              </span>

              <div className="mt-5 space-y-3">
                {[
                  { icon: Mail, value: contact.email },
                  { icon: Building2, value: contact.company },
                  { icon: Phone, value: contact.phone },
                ].map(({ icon: Icon, value }) => value && (
                  <div key={value} className="flex items-center gap-3 text-sm text-zinc-600">
                    <Icon className="h-4 w-4 text-zinc-300 shrink-0" />
                    <span className="truncate font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-zinc-700 flex items-center gap-1.5 uppercase tracking-widest text-[10px]"><Tag className="h-4 w-4 text-zinc-300" />Tags</h4>
                <button onClick={() => setAddingTag(!addingTag)} className="p-1 hover:bg-zinc-50 rounded-lg text-zinc-400"><Plus className="h-4 w-4" /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black border border-blue-100 uppercase tracking-tight">
                    {t}
                    <button onClick={() => setTags(ts => ts.filter(x => x !== t))} className="ml-0.5 hover:text-blue-900"><X className="h-3 w-3" /></button>
                  </span>
                ))}
                {tags.length === 0 && <span className="text-xs text-zinc-300 font-bold uppercase tracking-widest">No tags</span>}
              </div>
            </div>

            {/* Custom Fields */}
            {contact.custom_fields && Object.keys(contact.custom_fields).length > 0 && (
              <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-5">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Custom Fields</h4>
                <div className="space-y-3">
                  {Object.entries(contact.custom_fields).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tight">{k}</span>
                      <span className="text-xs font-bold text-zinc-700">{v as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Tabs */}
          <div className="lg:col-span-2 space-y-5">
            {/* Quick Actions */}
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-4 flex items-center gap-3">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-500/20">
                <Send className="h-4 w-4" /> Add to Sequence
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl text-sm font-bold transition-all">
                <Mail className="h-4 w-4" /> Send Individual Email
              </button>
              <button className="p-2 hover:bg-red-50 rounded-xl text-zinc-300 hover:text-red-500 ml-auto transition-all"><Trash2 className="h-4 w-4" /></button>
            </div>

            {/* Tabs */}
            <div className="bg-white border border-zinc-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[400px] flex flex-col">
              <div className="flex border-b border-zinc-100">
                {(["activity", "campaigns", "notes"] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={cn("flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                      activeTab === tab ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/20" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50/50")}>
                    {tab}
                  </button>
                ))}
              </div>

              {/* Activity Tab */}
              {activeTab === "activity" && (
                <div className="p-8 flex-1 space-y-2">
                  {activity.length > 0 ? activity.map((event: any, i: number) => (
                    <div key={i} className="flex items-start gap-4 py-4 group animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                      <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", event.bg)}>
                        <event.icon className={cn("h-5 w-5", event.color)} />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-sm font-bold text-zinc-800">{event.label}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Clock className="h-3 w-3 text-zinc-300" />
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{event.time}</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-300 gap-4">
                       <Clock className="h-12 w-12" />
                       <p className="font-bold uppercase tracking-widest text-[11px]">No activity recorded yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Campaigns Tab */}
              {activeTab === "campaigns" && (
                <div className="p-8 flex-1 space-y-4">
                  {campaigns.length > 0 ? campaigns.map((c: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-6 rounded-[2rem] bg-zinc-50 border border-zinc-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                      <div>
                        <p className="font-black text-zinc-900 text-[15px] uppercase tracking-tight">{c.name}</p>
                        <p className="text-[11px] text-zinc-400 font-bold mt-1 uppercase tracking-wide">Status: {c.status}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Open Rate</p>
                          <p className="text-lg font-black text-zinc-900 leading-none">{c.openRate}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-300 group-hover:text-blue-600 group-hover:border-blue-200 transition-all">
                           <RotateCcw className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-300 gap-4">
                       <RotateCcw className="h-12 w-12" />
                       <p className="font-bold uppercase tracking-widest text-[11px]">Not enrolled in any campaigns</p>
                    </div>
                  )}
                </div>
              )}

              {/* Notes Tab */}
              {activeTab === "notes" && (
                <div className="p-8 flex-1 flex flex-col">
                  {editingNotes ? (
                    <div className="space-y-4 flex-1 flex flex-col">
                      <textarea value={notes} onChange={e => setNotes(e.target.value)}
                        placeholder="Add a detailed note about this contact..."
                        className="flex-1 w-full bg-zinc-50 border border-zinc-200 rounded-3xl px-6 py-5 text-sm font-medium text-zinc-700 leading-relaxed resize-none outline-none focus:border-blue-400 transition-all shadow-inner" />
                      <div className="flex justify-end gap-3">
                        <button onClick={() => setEditingNotes(false)} className="px-6 py-2.5 text-sm font-bold text-zinc-500 hover:bg-zinc-100 rounded-xl transition-all">Cancel</button>
                        <button onClick={handleSaveNotes} className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20">
                          <Save className="h-4 w-4" /> Save Notes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="group relative flex-1">
                      <div className="p-8 rounded-[2rem] bg-amber-50/30 border border-amber-100/50 min-h-[200px]">
                        <p className="text-sm font-medium text-zinc-600 leading-relaxed whitespace-pre-wrap">{notes || "No notes recorded for this contact yet. Click the edit icon to add one."}</p>
                      </div>
                      <button onClick={() => setEditingNotes(true)}
                        className="absolute top-4 right-4 p-2 bg-white border border-zinc-200 rounded-xl text-zinc-400 hover:text-blue-600 transition-all shadow-sm hover:shadow-md">
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
