"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import {
  Mail, Building2, Phone, Globe, Link2, Tag, Plus, MoreVertical,
  CheckCircle2, MousePointer2, RotateCcw, Send, Clock, Edit3, X, Save
} from "lucide-react";
import { cn } from "@/lib/utils";

const contactData: Record<string, any> = {
  "1": {
    id: "1", name: "Anil Salvi", email: "anil@saleshandy.com", company: "Saleshandy",
    jobTitle: "Product Owner", phone: "+1 555-0100", website: "saleshandy.com",
    linkedin: "linkedin.com/in/anilsalvi", status: "Verified", tags: ["ICP", "Hot Lead"],
    campaigns: [
      { name: "Q1 SaaS Outreach", status: "Active", step: "Follow-up 1", openRate: "72%" },
      { name: "Webinar Follow-up", status: "Completed", step: "Done", openRate: "91%" }
    ],
    activity: [
      { type: "replied", label: "Replied to Follow-up 1", time: "2h ago", color: "text-blue-600", bg: "bg-blue-50", icon: RotateCcw },
      { type: "opened", label: "Opened Follow-up 1", time: "3h ago", color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2 },
      { type: "clicked", label: "Clicked link in Initial Email", time: "1d ago", color: "text-indigo-600", bg: "bg-indigo-50", icon: MousePointer2 },
      { type: "opened", label: "Opened Initial Email", time: "1d ago", color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2 },
      { type: "sent", label: "Initial Email sent", time: "2d ago", color: "text-zinc-500", bg: "bg-zinc-100", icon: Send },
    ],
    notes: "Met at SaaStr 2024. Very interested in the automation features. Decision maker for the sales team tooling. Follow up after their Q2 budget review.",
    customFields: { "LinkedIn Followers": "2.4k", "Company Size": "51-200", "Funding Stage": "Series A" }
  }
};

const TAGS_OPTIONS = ["ICP", "Hot Lead", "Do Not Contact", "Decision Maker", "Champion", "Unsubscribed"];

export default function ContactProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const contact = contactData[id] || contactData["1"];

  const [activeTab, setActiveTab] = useState<"activity" | "campaigns" | "notes">("activity");
  const [notes, setNotes] = useState(contact.notes);
  const [editingNotes, setEditingNotes] = useState(false);
  const [tags, setTags] = useState<string[]>(contact.tags);
  const [addingTag, setAddingTag] = useState(false);

  const toggleTag = (tag: string) => setTags(t => t.includes(tag) ? t.filter(x => x !== tag) : [...t, tag]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50">
      <PageHeader title="Contact Profile" subtitle={`${contact.name} · ${contact.company}`} />

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
              <p className="text-sm text-zinc-500 mt-0.5">{contact.jobTitle}</p>

              <span className={cn("inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-lg text-[11px] font-bold",
                contact.status === "Verified" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                <CheckCircle2 className="h-3 w-3" />{contact.status}
              </span>

              <div className="mt-5 space-y-3">
                {[
                  { icon: Mail, value: contact.email },
                  { icon: Building2, value: contact.company },
                  { icon: Phone, value: contact.phone },
                  { icon: Globe, value: contact.website },
                  { icon: Link2, value: contact.linkedin },
                ].map(({ icon: Icon, value }) => value && (
                  <div key={value} className="flex items-center gap-3 text-sm text-zinc-600">
                    <Icon className="h-4 w-4 text-zinc-300 shrink-0" />
                    <span className="truncate">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-zinc-700 flex items-center gap-1.5"><Tag className="h-4 w-4 text-zinc-300" />Tags</h4>
                <button onClick={() => setAddingTag(!addingTag)} className="p-1 hover:bg-zinc-50 rounded-lg text-zinc-400"><Plus className="h-4 w-4" /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[11px] font-bold border border-blue-100">
                    {t}
                    <button onClick={() => setTags(ts => ts.filter(x => x !== t))} className="ml-0.5 hover:text-blue-900"><X className="h-3 w-3" /></button>
                  </span>
                ))}
                {tags.length === 0 && <span className="text-xs text-zinc-300">No tags</span>}
              </div>
              {addingTag && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {TAGS_OPTIONS.filter(t => !tags.includes(t)).map(t => (
                    <button key={t} onClick={() => { toggleTag(t); setAddingTag(false); }}
                      className="px-2.5 py-1 bg-zinc-50 hover:bg-blue-50 text-zinc-600 hover:text-blue-600 rounded-lg text-[11px] font-bold border border-zinc-200 hover:border-blue-200 transition-all">
                      + {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Fields */}
            <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-5">
              <h4 className="text-sm font-bold text-zinc-700 mb-3">Custom Fields</h4>
              <div className="space-y-3">
                {Object.entries(contact.customFields).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400">{k}</span>
                    <span className="text-xs font-bold text-zinc-700">{v as string}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Tabs */}
          <div className="lg:col-span-2 space-y-5">
            {/* Quick Actions */}
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-4 flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-500/20">
                <Send className="h-4 w-4" /> Add to Sequence
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl text-sm font-bold transition-all">
                <Mail className="h-4 w-4" /> Send Email
              </button>
              <button className="p-2 hover:bg-zinc-50 rounded-xl text-zinc-400 ml-auto"><MoreVertical className="h-4 w-4" /></button>
            </div>

            {/* Tabs */}
            <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="flex border-b border-zinc-100">
                {(["activity", "campaigns", "notes"] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={cn("flex-1 py-3.5 text-sm font-bold capitalize transition-all",
                      activeTab === tab ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/30" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50/50")}>
                    {tab}
                  </button>
                ))}
              </div>

              {/* Activity Tab */}
              {activeTab === "activity" && (
                <div className="p-6 space-y-1">
                  {contact.activity.map((event: any, i: number) => (
                    <div key={i} className="flex items-start gap-4 py-3 group">
                      <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0", event.bg)}>
                        <event.icon className={cn("h-4 w-4", event.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-800">{event.label}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Clock className="h-3 w-3 text-zinc-300" />
                        <span className="text-xs text-zinc-400 font-medium">{event.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Campaigns Tab */}
              {activeTab === "campaigns" && (
                <div className="p-6 space-y-3">
                  {contact.campaigns.map((c: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-zinc-200 transition-all">
                      <div>
                        <p className="font-bold text-zinc-900 text-sm">{c.name}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">Current step: {c.step}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs font-bold text-zinc-400">Open Rate</p>
                          <p className="text-sm font-black text-zinc-900">{c.openRate}</p>
                        </div>
                        <span className={cn("px-2.5 py-1 rounded-lg text-[11px] font-bold",
                          c.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-500")}>
                          {c.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Notes Tab */}
              {activeTab === "notes" && (
                <div className="p-6">
                  {editingNotes ? (
                    <div className="space-y-3">
                      <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={8}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm text-zinc-700 leading-relaxed resize-none outline-none focus:border-blue-400 transition-all" />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingNotes(false)} className="px-4 py-2 text-sm font-bold text-zinc-500 hover:bg-zinc-100 rounded-xl transition-all">Cancel</button>
                        <button onClick={() => setEditingNotes(false)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-500/20">
                          <Save className="h-4 w-4" /> Save Notes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="group relative">
                      <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">{notes || "No notes yet."}</p>
                      <button onClick={() => setEditingNotes(true)}
                        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-1.5 bg-white border border-zinc-200 rounded-lg text-zinc-400 hover:text-zinc-700 transition-all shadow-sm">
                        <Edit3 className="h-3.5 w-3.5" />
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
