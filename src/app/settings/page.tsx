"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import {
  User, CreditCard, Bell, Shield, Key, Mail, Check, Settings,
  Users, Trash2, Plus, X, Crown, ChevronDown, Zap, Star,
  Download, AlertTriangle, Upload
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "team", label: "Team", icon: Users },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "suppression", label: "Suppression", icon: Shield },
  { id: "integrations", label: "Integrations", icon: Key },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
];

const teamMembers = [
  { id: "1", name: "Alex Johnson", email: "alex@yourdomain.com", role: "Admin", avatar: "AJ", joined: "Jan 2025", status: "active" },
  { id: "2", name: "Sarah Kim", email: "sarah@yourdomain.com", role: "Member", avatar: "SK", joined: "Feb 2025", status: "active" },
  { id: "3", name: "James Carter", email: "james@yourdomain.com", role: "Viewer", avatar: "JC", joined: "Mar 2025", status: "active" },
  { id: "4", name: "Priya Patel", email: "inviting...", role: "Member", avatar: "PP", joined: "Invite sent", status: "pending" },
];

const suppressedEmails = [
  { type: "email", value: "bounce@example.com", reason: "Hard Bounce", date: "Apr 18, 2025" },
  { type: "domain", value: "spam-domain.net", reason: "Manual Block", date: "Apr 15, 2025" },
  { type: "email", value: "info@catchall.com", reason: "Catch-all Domain", date: "Apr 12, 2025" },
  { type: "email", value: "noreply@bigcorp.io", reason: "Role-based Email", date: "Apr 10, 2025" },
];

const invoices = [
  { id: "INV-001", date: "Apr 1, 2025", amount: "$149.00", status: "Paid" },
  { id: "INV-002", date: "Mar 1, 2025", amount: "$149.00", status: "Paid" },
  { id: "INV-003", date: "Feb 1, 2025", amount: "$99.00", status: "Paid" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaved, setIsSaved] = useState(false);
  const [members, setMembers] = useState(teamMembers);
  const [suppressed, setSuppressed] = useState(suppressedEmails);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Member");
  const [showInvite, setShowInvite] = useState(false);
  const [newSuppress, setNewSuppress] = useState("");
  const [notifSettings, setNotifSettings] = useState({
    newReply: true, openedEmail: false, bouncedEmail: true, weeklyReport: true, teamActivity: false,
  });

  const handleSave = () => { setIsSaved(true); setTimeout(() => setIsSaved(false), 2500); };

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    setMembers(m => [...m, { id: Date.now().toString(), name: inviteEmail.split("@")[0], email: inviteEmail, role: inviteRole, avatar: inviteEmail.slice(0, 2).toUpperCase(), joined: "Invite sent", status: "pending" }]);
    setInviteEmail(""); setShowInvite(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50">
      <PageHeader title="Settings" subtitle="Manage your account, team, and platform configuration" />

      <div className="p-8">
        <div className="flex gap-8">
          {/* Sidebar Tabs */}
          <div className="w-52 shrink-0">
            <nav className="bg-white border border-zinc-200 rounded-2xl p-2 shadow-sm space-y-0.5 sticky top-24">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={cn("w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all text-left",
                    activeTab === tab.id ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900")}>
                  <tab.icon className="h-4 w-4 shrink-0" />{tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1 space-y-6 max-w-3xl">
            {/* PROFILE */}
            {activeTab === "profile" && (
              <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-8 space-y-6">
                <div><h3 className="text-lg font-bold text-zinc-900">Profile Details</h3><p className="text-sm text-zinc-400 mt-1">Update your personal information.</p></div>
                <div className="flex items-center gap-5 p-5 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-500/20">AJ</div>
                  <div><p className="font-bold text-zinc-900">Alex Johnson</p><p className="text-xs text-zinc-400 mt-0.5">Admin Account</p></div>
                  <button className="ml-auto px-4 py-2 text-sm font-semibold border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-all text-zinc-700">Change Avatar</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[{ label: "Full Name", val: "Alex Johnson", type: "text" }, { label: "Email Address", val: "alex@yourdomain.com", type: "email" }].map(f => (
                    <div key={f.label} className="space-y-2">
                      <label className="text-sm font-semibold text-zinc-600">{f.label}</label>
                      <input type={f.type} defaultValue={f.val} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all text-zinc-900" />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-600">Biography</label>
                  <textarea rows={3} placeholder="Tell us about yourself..." className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none text-zinc-900 placeholder:text-zinc-400" />
                </div>
                <div className="flex justify-end">
                  <button onClick={handleSave} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all text-sm">
                    {isSaved ? <><Check className="h-4 w-4" />Saved!</> : "Save Changes"}
                  </button>
                </div>
              </div>
            )}

            {/* TEAM */}
            {activeTab === "team" && (
              <div className="space-y-5">
                <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
                    <div><h3 className="font-bold text-zinc-900">Team Members</h3><p className="text-xs text-zinc-400 mt-0.5">{members.length} members · 5 seat plan</p></div>
                    <button onClick={() => setShowInvite(!showInvite)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20">
                      <Plus className="h-4 w-4" />Invite Member
                    </button>
                  </div>
                  {showInvite && (
                    <div className="px-6 py-4 bg-blue-50/30 border-b border-blue-100/50 flex items-center gap-3">
                      <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@yourcompany.com" className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-all" />
                      <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 transition-all font-medium">
                        {["Admin", "Member", "Viewer"].map(r => <option key={r}>{r}</option>)}
                      </select>
                      <button onClick={handleInvite} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all">Send Invite</button>
                      <button onClick={() => setShowInvite(false)} className="p-2 text-zinc-400 hover:text-zinc-600"><X className="h-4 w-4" /></button>
                    </div>
                  )}
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50/50 border-b border-zinc-100">
                        <th className="px-6 py-3">Member</th><th className="px-6 py-3">Role</th><th className="px-6 py-3">Joined</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {members.map(m => (
                        <tr key={m.id} className="hover:bg-zinc-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-black">{m.avatar}</div>
                              <div><p className="font-bold text-zinc-900 text-sm">{m.name}</p><p className="text-xs text-zinc-400">{m.email}</p></div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn("px-2.5 py-1 rounded-lg text-[11px] font-bold", m.role === "Admin" ? "bg-purple-50 text-purple-600" : m.role === "Member" ? "bg-blue-50 text-blue-600" : "bg-zinc-100 text-zinc-500")}>
                              {m.role === "Admin" && <Crown className="h-3 w-3 inline mr-1" />}{m.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-500">{m.joined}</td>
                          <td className="px-6 py-4">
                            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", m.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                              {m.status === "active" ? "Active" : "Pending"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {m.role !== "Admin" && (
                              <button onClick={() => setMembers(p => p.filter(x => x.id !== m.id))} className="p-1.5 hover:bg-rose-50 rounded-lg text-zinc-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* BILLING */}
            {activeTab === "billing" && (
              <div className="space-y-5">
                {/* Current Plan */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
                  <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
                  <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-white/5" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="h-5 w-5 text-yellow-300 fill-yellow-300" />
                      <span className="text-sm font-black uppercase tracking-widest text-white/80">Current Plan</span>
                    </div>
                    <h2 className="text-4xl font-black mb-1">Pro Plan</h2>
                    <p className="text-white/70 text-sm">$149/month · Billed monthly</p>
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
                      {[{ label: "Email Accounts", used: 4, total: 10 }, { label: "Contacts", used: 2140, total: 50000 }, { label: "Emails/Month", used: 24800, total: 100000 }].map(u => (
                        <div key={u.label}>
                          <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-1">{u.label}</p>
                          <p className="text-lg font-black">{u.used.toLocaleString()} <span className="text-sm font-normal text-white/60">/ {u.total.toLocaleString()}</span></p>
                          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mt-2">
                            <div className="h-full bg-white/80 rounded-full" style={{ width: `${(u.used / u.total) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="mt-6 px-5 py-2.5 bg-white text-blue-600 rounded-xl text-sm font-black hover:bg-blue-50 transition-all shadow-md">
                      Upgrade to Enterprise →
                    </button>
                  </div>
                </div>

                {/* Invoices */}
                <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
                    <h3 className="font-bold text-zinc-900">Invoice History</h3>
                    <button className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-600 transition-colors"><Download className="h-3.5 w-3.5" />Download All</button>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50/50 border-b border-zinc-100">
                        <th className="px-6 py-3">Invoice</th><th className="px-6 py-3">Date</th><th className="px-6 py-3">Amount</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">PDF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {invoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-sm font-bold text-zinc-700">{inv.id}</td>
                          <td className="px-6 py-4 text-sm text-zinc-500">{inv.date}</td>
                          <td className="px-6 py-4 text-sm font-bold text-zinc-900">{inv.amount}</td>
                          <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[11px] font-bold">{inv.status}</span></td>
                          <td className="px-6 py-4 text-right"><button className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-700 transition-all"><Download className="h-4 w-4" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUPPRESSION LIST */}
            {activeTab === "suppression" && (
              <div className="space-y-5">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 font-medium">Emails and domains on this list will never be contacted — even if added to a sequence. Required for CAN-SPAM and GDPR compliance.</p>
                </div>

                <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
                    <div><h3 className="font-bold text-zinc-900">Suppression List</h3><p className="text-xs text-zinc-400 mt-0.5">{suppressed.length} entries</p></div>
                    <div className="flex gap-3">
                      <button className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 border border-zinc-200 px-3 py-2 rounded-xl hover:bg-zinc-50 transition-all">
                        <Upload className="h-3.5 w-3.5" />Import CSV
                      </button>
                      <button onClick={() => { if (newSuppress) { setSuppressed(p => [{ type: "email", value: newSuppress, reason: "Manual Block", date: "Today" }, ...p]); setNewSuppress(""); } }}
                        className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all">
                        <Plus className="h-3.5 w-3.5" />Add Entry
                      </button>
                    </div>
                  </div>
                  <div className="px-6 py-3 border-b border-zinc-100 bg-zinc-50/30">
                    <input value={newSuppress} onChange={e => setNewSuppress(e.target.value)} placeholder="Email address or domain (e.g. user@example.com or @domain.com)" className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-all" />
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50/50 border-b border-zinc-100">
                        <th className="px-6 py-3">Email / Domain</th><th className="px-6 py-3">Reason</th><th className="px-6 py-3">Date Added</th><th className="px-6 py-3 text-right">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {suppressed.map((entry, i) => (
                        <tr key={i} className="hover:bg-zinc-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", entry.type === "email" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600")}>
                                {entry.type}
                              </span>
                              <span className="text-sm font-semibold text-zinc-800">{entry.value}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-500">{entry.reason}</td>
                          <td className="px-6 py-4 text-sm text-zinc-400">{entry.date}</td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => setSuppressed(p => p.filter((_, j) => j !== i))} className="p-1.5 hover:bg-rose-50 rounded-lg text-zinc-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === "notifications" && (
              <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-8 space-y-6">
                <div><h3 className="text-lg font-bold text-zinc-900">Notification Preferences</h3><p className="text-sm text-zinc-400 mt-1">Choose what you want to be notified about.</p></div>
                <div className="space-y-4">
                  {[
                    { key: "newReply", label: "New Reply Received", desc: "When a prospect replies to your email" },
                    { key: "openedEmail", label: "Email Opened", desc: "When a prospect opens your email" },
                    { key: "bouncedEmail", label: "Email Bounced", desc: "When an email hard bounces" },
                    { key: "weeklyReport", label: "Weekly Performance Report", desc: "Summary of your outreach every Monday" },
                    { key: "teamActivity", label: "Team Activity", desc: "When team members make changes" },
                  ].map(n => (
                    <div key={n.key} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-zinc-200 transition-all">
                      <div>
                        <p className="font-bold text-zinc-900 text-sm">{n.label}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{n.desc}</p>
                      </div>
                      <button onClick={() => setNotifSettings(p => ({ ...p, [n.key]: !p[n.key as keyof typeof p] }))}
                        className={cn("relative h-6 w-11 rounded-full transition-colors duration-200 shrink-0", notifSettings[n.key as keyof typeof notifSettings] ? "bg-blue-600" : "bg-zinc-200")}>
                        <div className={cn("absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200", notifSettings[n.key as keyof typeof notifSettings] ? "translate-x-6" : "translate-x-1")} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button onClick={handleSave} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all text-sm">
                    {isSaved ? <><Check className="h-4 w-4" />Saved!</> : "Save Preferences"}
                  </button>
                </div>
              </div>
            )}

            {/* INTEGRATIONS */}
            {activeTab === "integrations" && (
              <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-8 space-y-6">
                <div><h3 className="text-lg font-bold text-zinc-900">Email Providers</h3><p className="text-sm text-zinc-400 mt-1">Connect your email sending infrastructure.</p></div>
                {[
                  { logo: "R", name: "Resend", desc: "Modern email for developers", color: "bg-white text-zinc-900 border-zinc-200", active: true },
                  { logo: "M", name: "SendGrid", desc: "Enterprise email foundation", color: "bg-blue-50 text-blue-600 border-blue-100", active: false },
                  { logo: "Z", name: "Zapier", desc: "Connect with 5,000+ apps", color: "bg-orange-50 text-orange-600 border-orange-100", active: false },
                ].map(p => (
                  <div key={p.name} className={cn("flex items-center justify-between p-5 rounded-2xl bg-zinc-50 border border-zinc-200", !p.active && "opacity-60")}>
                    <div className="flex items-center gap-4">
                      <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center font-black text-sm border", p.color)}>{p.logo}</div>
                      <div><h4 className="font-bold text-zinc-900 text-sm">{p.name}</h4><p className="text-xs text-zinc-400">{p.desc}</p></div>
                    </div>
                    <button className={cn("px-4 py-2 rounded-xl text-sm font-bold border transition-all", p.active ? "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100" : "bg-white text-zinc-400 border-zinc-200 cursor-not-allowed")}>
                      {p.active ? "Configure" : "Coming Soon"}
                    </button>
                  </div>
                ))}
                <div className="pt-4 border-t border-zinc-100 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">API Configuration</h4>
                  <div className="flex gap-3">
                    <input type="password" placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx" className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-all" />
                    <button onClick={handleSave} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all text-sm whitespace-nowrap">
                      {isSaved ? <><Check className="h-4 w-4" />Saved</> : "Save Key"}
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-400 italic">Your key is encrypted at rest.</p>
                </div>
              </div>
            )}

            {/* OTHER TABS - COMING SOON */}
            {(activeTab === "security") && (
              <div className="flex flex-col items-center justify-center p-16 text-center bg-white rounded-3xl border border-zinc-200 shadow-sm space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-zinc-100 flex items-center justify-center"><Settings className="h-7 w-7 text-zinc-400 animate-pulse" /></div>
                <div><h3 className="text-lg font-bold text-zinc-900 capitalize">{activeTab}</h3><p className="text-sm text-zinc-400 max-w-xs mt-1">We're building this section. It'll be available very soon!</p></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
