"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import {
  Mail, Building2, Phone, Globe, Link2, Tag, Plus, MoreVertical,
  CheckCircle2, Clock, Edit3, X, Save, Loader2, ArrowLeft,
  Send, MousePointer2, RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { type Contact } from "@/lib/actions/contacts";

const TAGS_OPTIONS = ["ICP", "Hot Lead", "Do Not Contact", "Decision Maker", "Champion", "Unsubscribed"];

export default function ContactProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const supabase = createClient();

  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<"activity" | "notes">("activity");
  const [notes, setNotes] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [addingTag, setAddingTag] = useState(false);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    fetchContact();
  }, [id]);

  async function fetchContact() {
    setLoading(true);
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setContact(data as Contact);
    setNotes(data.custom_fields?.notes || "");
    setTags(data.custom_fields?.tags ? JSON.parse(data.custom_fields.tags) : []);

    // Fetch email activity
    const { data: logs } = await supabase
      .from("email_queue")
      .select("*, campaigns(name)")
      .eq("contact_id", id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (logs) setEmailLogs(logs);
    setLoading(false);
  }

  async function saveNotes() {
    if (!contact) return;
    await supabase
      .from("contacts")
      .update({
        custom_fields: {
          ...contact.custom_fields,
          notes,
          tags: JSON.stringify(tags),
        }
      })
      .eq("id", id);
    setEditingNotes(false);
  }

  async function saveTags(newTags: string[]) {
    if (!contact) return;
    setTags(newTags);
    await supabase
      .from("contacts")
      .update({
        custom_fields: {
          ...contact.custom_fields,
          tags: JSON.stringify(newTags),
        }
      })
      .eq("id", id);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  if (notFound) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <p className="text-zinc-500 font-medium">Contact not found.</p>
      <button onClick={() => router.push("/contacts")} className="text-blue-600 text-sm font-bold hover:underline flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> Back to Contacts
      </button>
    </div>
  );

  if (!contact) return null;

  const initials = contact.name.split(" ").map(n => n[0]).join("").toUpperCase();

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50">
      <PageHeader
        title="Contact Profile"
        subtitle={`${contact.name} · ${contact.company || "No company"}`}
      />

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Contact Card */}
          <div className="space-y-5">
            <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-black shadow-md shadow-blue-500/20">
                  {initials}
                </div>
              </div>
              <h2 className="text-xl font-black text-zinc-900">{contact.name}</h2>
              <p className="text-sm text-zinc-500 mt-0.5">{contact.job_title || "No title"}</p>

              <span className={cn(
                "inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-lg text-[11px] font-bold",
                contact.email_status === "verified" ? "bg-emerald-50 text-emerald-600" :
                contact.email_status === "unsubscribed" ? "bg-rose-50 text-rose-500" :
                "bg-amber-50 text-amber-600"
              )}>
                <CheckCircle2 className="h-3 w-3" />
                {contact.email_status}
              </span>

              <div className="mt-5 space-y-3">
                {[
                  { icon: Mail, value: contact.email },
                  { icon: Building2, value: contact.company },
                  { icon: Phone, value: contact.phone },
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
                <h4 className="text-sm font-bold text-zinc-700 flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-zinc-300" /> Tags
                </h4>
                <button onClick={() => setAddingTag(!addingTag)} className="p-1 hover:bg-zinc-50 rounded-lg text-zinc-400">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[11px] font-bold border border-blue-100">
                    {t}
                    <button onClick={() => saveTags(tags.filter(x => x !== t))} className="ml-0.5 hover:text-blue-900">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {tags.length === 0 && <span className="text-xs text-zinc-300">No tags yet</span>}
              </div>
              {addingTag && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {TAGS_OPTIONS.filter(t => !tags.includes(t)).map(t => (
                    <button key={t}
                      onClick={() => { saveTags([...tags, t]); setAddingTag(false); }}
                      className="px-2.5 py-1 bg-zinc-50 hover:bg-blue-50 text-zinc-600 hover:text-blue-600 rounded-lg text-[11px] font-bold border border-zinc-200 transition-all">
                      + {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Fields */}
            {contact.custom_fields && Object.keys(contact.custom_fields).filter(k => k !== 'notes' && k !== 'tags').length > 0 && (
              <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-5">
                <h4 className="text-sm font-bold text-zinc-700 mb-3">Custom Fields</h4>
                <div className="space-y-3">
                  {Object.entries(contact.custom_fields)
                    .filter(([k]) => k !== 'notes' && k !== 'tags')
                    .map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400">{k}</span>
                      <span className="text-xs font-bold text-zinc-700">{v as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Tabs */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-4 flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-500/20">
                <Send className="h-4 w-4" /> Add to Sequence
              </button>
              <button onClick={() => router.push("/contacts")} className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl text-sm font-bold transition-all">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            </div>

            <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="flex border-b border-zinc-100">
                {(["activity", "notes"] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={cn("flex-1 py-3.5 text-sm font-bold capitalize transition-all",
                      activeTab === tab ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/30" : "text-zinc-400 hover:text-zinc-700")}>
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === "activity" && (
                <div className="p-6 space-y-1">
                  {emailLogs.length === 0 && (
                    <div className="text-center py-12 text-zinc-400">
                      <Mail className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-medium">No email activity yet</p>
                    </div>
                  )}
                  {emailLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-4 py-3 group border-b border-zinc-50 last:border-0">
                      <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0",
                        log.opened_at ? "bg-emerald-50" : "bg-zinc-100")}>
                        {log.opened_at
                          ? <RotateCcw className="h-4 w-4 text-emerald-600" />
                          : <Send className="h-4 w-4 text-zinc-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-800 truncate">{log.subject}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {log.status} · {log.opened_at ? "Opened" : "Not opened"}
                          {log.clicked_at ? " · Clicked" : ""}
                          {log.campaigns?.name ? ` · ${log.campaigns.name}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Clock className="h-3 w-3 text-zinc-300" />
                        <span className="text-xs text-zinc-400">{new Date(log.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "notes" && (
                <div className="p-6">
                  {editingNotes ? (
                    <div className="space-y-3">
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={8}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm text-zinc-700 leading-relaxed resize-none outline-none focus:border-blue-400 transition-all"
                        placeholder="Add notes about this contact..."
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingNotes(false)} className="px-4 py-2 text-sm font-bold text-zinc-500 hover:bg-zinc-100 rounded-xl">Cancel</button>
                        <button onClick={saveNotes} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20">
                          <Save className="h-4 w-4" /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="group relative">
                      <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">{notes || "No notes yet. Click edit to add notes."}</p>
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
