"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import {
  Search, Inbox, CheckCircle2, XCircle, Calendar, AlertTriangle,
  Send, Loader2, Bot, MoreHorizontal, Paperclip, Link,
  CornerDownRight, Mail
} from "lucide-react";
import { cn } from "@/lib/utils";

type ThreadStatus = "new" | "interested" | "not_interested" | "meeting_booked" | "unsubscribed";

interface Message {
  id: string; from: string; fromEmail: string; body: string; time: string; isFromContact: boolean;
}
interface Thread {
  id: string;
  contact: { name: string; email: string; company: string; initials: string };
  campaign: string; status: ThreadStatus; isRead: boolean; lastTime: string; preview: string;
  messages: Message[];
}

const initialThreads: Thread[] = [
  {
    id: "t1",
    contact: { name: "Marcus Webb", email: "marcus@techflow.io", company: "TechFlow Inc", initials: "MW" },
    campaign: "Q1 SaaS Outreach", status: "interested", isRead: false, lastTime: "10:42 AM",
    preview: "Hey, this looks really interesting! I'd love to learn more about how you can help us...",
    messages: [
      { id: "m1", from: "Alex Johnson", fromEmail: "alex@yourdomain.com", body: "Hi Marcus,\n\nI noticed your work at TechFlow and wanted to reach out. We've been helping SaaS companies automate their outreach workflows — could we get 15 minutes?\n\nBest, Alex", time: "Yesterday, 9:00 AM", isFromContact: false },
      { id: "m2", from: "Marcus Webb", fromEmail: "marcus@techflow.io", body: "Hey Alex,\n\nThis looks really interesting! I'd love to learn more about how you can help us scale outreach. We've been struggling with deliverability lately.\n\nAre you free Thursday afternoon?\n\nMarcus", time: "Today, 10:42 AM", isFromContact: true }
    ]
  },
  {
    id: "t2",
    contact: { name: "Priya Sharma", email: "priya@nexuslabs.co", company: "Nexus Labs", initials: "PS" },
    campaign: "Enterprise Founders", status: "meeting_booked", isRead: true, lastTime: "9:15 AM",
    preview: "I've sent a calendar invite for Tuesday at 2pm EST. Looking forward to it!",
    messages: [
      { id: "m3", from: "Alex Johnson", fromEmail: "alex@yourdomain.com", body: "Hi Priya,\n\nSaw your post on scaling sales at Nexus Labs. We help enterprise teams get 3x reply rates through better personalization.\n\nWorth a quick chat?\n\nAlex", time: "Mon, 8:00 AM", isFromContact: false },
      { id: "m4", from: "Priya Sharma", fromEmail: "priya@nexuslabs.co", body: "Hi Alex, sounds great! Calendar invite sent for Tuesday 2pm EST. Looking forward to seeing your platform.", time: "Today, 9:15 AM", isFromContact: true }
    ]
  },
  {
    id: "t3",
    contact: { name: "Jordan Ellis", email: "j.ellis@coldstream.com", company: "Coldstream", initials: "JE" },
    campaign: "Cold Reach - HR", status: "not_interested", isRead: true, lastTime: "Yesterday",
    preview: "Thanks but we're not looking for new tools right now. Please remove me from your list.",
    messages: [
      { id: "m5", from: "Alex Johnson", fromEmail: "alex@yourdomain.com", body: "Hi Jordan,\n\nI work with several HR leaders who've cut time-to-hire significantly with automated outreach...", time: "3 days ago", isFromContact: false },
      { id: "m6", from: "Jordan Ellis", fromEmail: "j.ellis@coldstream.com", body: "Thanks for reaching out but we're not looking for any new tools right now. Please remove me from your list.", time: "Yesterday, 3:20 PM", isFromContact: true }
    ]
  },
  {
    id: "t4",
    contact: { name: "Sam Torres", email: "sam.t@orbitgrowth.com", company: "Orbit Growth", initials: "ST" },
    campaign: "Q1 SaaS Outreach", status: "new", isRead: false, lastTime: "8:02 AM",
    preview: "Could you tell me more about pricing? We have about 50 reps who would use this.",
    messages: [
      { id: "m7", from: "Alex Johnson", fromEmail: "alex@yourdomain.com", body: "Hi Sam,\n\nI've been following Orbit Growth's impressive trajectory...\n\nWould love to show you how we can help scale outreach.\n\nAlex", time: "Yesterday, 2:00 PM", isFromContact: false },
      { id: "m8", from: "Sam Torres", fromEmail: "sam.t@orbitgrowth.com", body: "Interesting! Could you tell me a bit more about the pricing structure? We have about 50 reps who would be using this.", time: "Today, 8:02 AM", isFromContact: true }
    ]
  },
  {
    id: "t5",
    contact: { name: "Aisha Okafor", email: "aisha@brightmind.ai", company: "BrightMind AI", initials: "AO" },
    campaign: "Webinar Follow-up", status: "new", isRead: false, lastTime: "Yesterday",
    preview: "Had a follow-up question about the automation feature you demoed in the webinar.",
    messages: [
      { id: "m9", from: "Aisha Okafor", fromEmail: "aisha@brightmind.ai", body: "Hi Alex,\n\nAttended your webinar yesterday — great stuff! Had a follow-up question about the automation feature you demoed. Can we sync this week?\n\nAisha", time: "Yesterday, 4:00 PM", isFromContact: true }
    ]
  }
];

const statusConfig: Record<ThreadStatus, { label: string; color: string; bg: string; dot: string }> = {
  new: { label: "New Reply", color: "text-blue-600", bg: "bg-blue-50", dot: "bg-blue-500" },
  interested: { label: "Interested", color: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  not_interested: { label: "Not Interested", color: "text-zinc-500", bg: "bg-zinc-100", dot: "bg-zinc-400" },
  meeting_booked: { label: "Meeting Booked", color: "text-purple-600", bg: "bg-purple-50", dot: "bg-purple-500" },
  unsubscribed: { label: "Unsubscribed", color: "text-rose-600", bg: "bg-rose-50", dot: "bg-rose-500" },
};

const filterTabs = ["All", "New", "Interested", "Meeting", "Not Interested"];

export default function InboxPage() {
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [selectedId, setSelectedId] = useState("t1");
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAIWriting, setIsAIWriting] = useState(false);

  const selectedThread = threads.find(t => t.id === selectedId)!;

  const filtered = threads.filter(t => {
    const matchFilter = activeFilter === "All"
      || (activeFilter === "New" && t.status === "new")
      || (activeFilter === "Interested" && t.status === "interested")
      || (activeFilter === "Meeting" && t.status === "meeting_booked")
      || (activeFilter === "Not Interested" && t.status === "not_interested");
    const matchSearch = !search || t.contact.name.toLowerCase().includes(search.toLowerCase()) || t.contact.company.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const markRead = (id: string) => setThreads(p => p.map(t => t.id === id ? { ...t, isRead: true } : t));
  const changeStatus = (id: string, status: ThreadStatus) => setThreads(p => p.map(t => t.id === id ? { ...t, status } : t));

  const handleSend = () => {
    if (!replyText.trim()) return;
    setIsSending(true);
    setTimeout(() => { setIsSending(false); setReplyText(""); }, 1200);
  };

  const handleAI = () => {
    setIsAIWriting(true);
    setTimeout(() => {
      setReplyText(`Hi ${selectedThread.contact.name.split(" ")[0]},\n\nThanks for getting back to me! Thursday afternoon works perfectly.\n\nI'll send a calendar invite now — excited to show you how we can help ${selectedThread.contact.company} scale outreach.\n\nBest,\nAlex`);
      setIsAIWriting(false);
    }, 1400);
  };

  const unread = threads.filter(t => !t.isRead).length;

  return (
    <div className="flex flex-col h-screen bg-zinc-50">
      <PageHeader title="Inbox" subtitle={`${unread} unread replies across all sequences`} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Thread List */}
        <div className="w-[320px] shrink-0 border-r border-zinc-200 bg-white flex flex-col overflow-hidden">
          <div className="p-3 border-b border-zinc-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all" />
            </div>
          </div>

          <div className="flex gap-1 px-3 py-2 overflow-x-auto border-b border-zinc-100">
            {filterTabs.map(tab => (
              <button key={tab} onClick={() => setActiveFilter(tab)} className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all", activeFilter === tab ? "bg-blue-600 text-white" : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700")}>
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-50">
            {filtered.map(thread => {
              const s = statusConfig[thread.status];
              const isSelected = thread.id === selectedId;
              return (
                <button key={thread.id} onClick={() => { setSelectedId(thread.id); markRead(thread.id); }}
                  className={cn("w-full text-left p-4 hover:bg-zinc-50/80 transition-colors relative", isSelected && "bg-blue-50/50", !thread.isRead && "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-8 before:bg-blue-600 before:rounded-r-full")}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("h-9 w-9 rounded-full flex items-center justify-center text-xs font-black shrink-0", isSelected ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-600")}>
                      {thread.contact.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={cn("text-sm font-bold truncate", !thread.isRead ? "text-zinc-900" : "text-zinc-700")}>{thread.contact.name}</span>
                        <span className="text-[10px] text-zinc-400 ml-1 shrink-0">{thread.lastTime}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate mb-1">{thread.contact.company} · {thread.campaign}</p>
                      <p className="text-xs text-zinc-500 truncate leading-snug">{thread.preview}</p>
                      <div className={cn("inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold", s.bg, s.color)}>
                        <div className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
                        {s.label}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Inbox className="h-8 w-8 text-zinc-200 mb-2" />
                <p className="text-sm font-bold text-zinc-400">No conversations</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Thread Detail */}
        {selectedThread && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Thread Header */}
            <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-zinc-200">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                  {selectedThread.contact.initials}
                </div>
                <div>
                  <h2 className="font-bold text-zinc-900 text-sm">{selectedThread.contact.name}</h2>
                  <p className="text-[11px] text-zinc-400">{selectedThread.contact.email} · {selectedThread.contact.company}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-zinc-400 mr-1">Move to:</span>
                {(["interested", "meeting_booked", "not_interested", "unsubscribed"] as ThreadStatus[]).map(s => {
                  const cfg = statusConfig[s];
                  return (
                    <button key={s} onClick={() => changeStatus(selectedThread.id, s)}
                      className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border", selectedThread.status === s ? cn(cfg.bg, cfg.color, "border-transparent") : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50")}>
                      {cfg.label}
                    </button>
                  );
                })}
                <button className="ml-1 p-1.5 hover:bg-zinc-50 rounded-lg text-zinc-400"><MoreHorizontal className="h-4 w-4" /></button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5 bg-zinc-50/50">
              {selectedThread.messages.map(msg => (
                <div key={msg.id} className={cn("flex", msg.isFromContact ? "justify-start" : "justify-end")}>
                  <div className={cn("max-w-[68%] rounded-3xl p-5 shadow-sm", msg.isFromContact ? "bg-white border border-zinc-100 text-zinc-800" : "bg-blue-600 text-white")}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-black", msg.isFromContact ? "bg-zinc-100 text-zinc-600" : "bg-white/20 text-white")}>
                        {msg.from.split(" ").map(n => n[0]).join("")}
                      </div>
                      <p className={cn("text-[11px] font-bold", msg.isFromContact ? "text-zinc-700" : "text-white/90")}>{msg.from}</p>
                      <span className={cn("text-[10px]", msg.isFromContact ? "text-zinc-400" : "text-white/50")}>· {msg.time}</span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Composer */}
            <div className="bg-white border-t border-zinc-200 p-4">
              <div className="border border-zinc-200 rounded-2xl overflow-hidden focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 border-b border-zinc-100">
                  <CornerDownRight className="h-3 w-3 text-zinc-400" />
                  <span className="text-[11px] font-semibold text-zinc-500">Replying to <strong className="text-zinc-700">{selectedThread.contact.name}</strong></span>
                </div>
                <textarea className="w-full px-4 py-3 text-sm text-zinc-700 resize-none focus:outline-none leading-relaxed bg-white" rows={4} placeholder="Write your reply..." value={replyText} onChange={e => setReplyText(e.target.value)} />
                <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50/50 border-t border-zinc-100">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-all"><Paperclip className="h-3.5 w-3.5" /></button>
                    <button className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-all"><Link className="h-3.5 w-3.5" /></button>
                    <button onClick={handleAI} disabled={isAIWriting} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-[11px] font-bold transition-all border border-blue-100/50">
                      {isAIWriting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Bot className="h-3 w-3" />}
                      {isAIWriting ? "Writing..." : "Write with AI"}
                    </button>
                  </div>
                  <button onClick={handleSend} disabled={!replyText.trim() || isSending}
                    className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all", replyText.trim() && !isSending ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20" : "bg-zinc-100 text-zinc-400 cursor-not-allowed")}>
                    {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    {isSending ? "Sending..." : "Send Reply"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
