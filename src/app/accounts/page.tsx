"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import {
  Plus, Server, CheckCircle2, XCircle, AlertTriangle, Flame, Settings,
  RefreshCw, Trash2, X, Eye, EyeOff, ChevronRight, Loader2, Zap, Mail
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { addSmtpAccount, deleteEmailAccount } from "@/lib/actions/email-accounts";

type AccountStatus = "active" | "error" | "paused";
interface EmailAccount {
  id: string; 
  email: string; 
  provider: "gmail" | "outlook" | "smtp"; 
  status: AccountStatus;
  health_score: number; 
  daily_limit: number; 
  sent_today: number;
}

const providerInfo = {
  gmail: { label: "Google Workspace", logo: "G", color: "bg-red-50 text-red-600", border: "border-red-100" },
  outlook: { label: "Microsoft 365", logo: "M", color: "bg-blue-50 text-blue-600", border: "border-blue-100" },
  smtp: { label: "Custom SMTP", logo: "S", color: "bg-zinc-100 text-zinc-600", border: "border-zinc-200" },
};

const statusInfo = {
  active: { label: "Connected", color: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  error: { label: "Error", color: "text-rose-600", bg: "bg-rose-50", dot: "bg-rose-500" },
  paused: { label: "Paused", color: "text-zinc-600", bg: "bg-zinc-50", dot: "bg-zinc-500" },
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<"select" | "smtp" | "google">("select");
  const [showPass, setShowPass] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('email_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setAccounts(data as EmailAccount[]);
    setLoading(false);
  }

  async function handleSmtpSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setConnecting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await addSmtpAccount(formData);

    if (result.error) {
      setError(result.error);
      setConnecting(false);
    } else {
      setConnecting(false);
      setShowModal(false);
      fetchAccounts();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to remove this account?")) return;
    await deleteEmailAccount(id);
    fetchAccounts();
  }

  const stats = {
    total: accounts.length,
    connected: accounts.filter(a => a.status === "active").length,
    errors: accounts.filter(a => a.status === "error").length,
    sentToday: accounts.reduce((s, a) => s + (a.sent_today || 0), 0),
    limitToday: accounts.reduce((s, a) => s + (a.daily_limit || 0), 0),
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50">
      <PageHeader title="Email Accounts" subtitle="Manage your sending mailboxes and deliverability"
        actions={
          <button onClick={() => { setShowModal(true); setStep("select"); setError(null); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20">
            <Plus className="h-4 w-4" /> Connect Account
          </button>
        }
      />

      <div className="p-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Total Accounts", value: stats.total, color: "text-zinc-900", bg: "bg-white" },
            { label: "Connected", value: stats.connected, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Errors", value: stats.errors, color: "text-rose-600", bg: "bg-rose-50" },
            { label: "Sent Today", value: stats.sentToday, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Daily Capacity", value: stats.limitToday, color: "text-zinc-700", bg: "bg-zinc-50" },
          ].map(s => (
            <div key={s.label} className={cn("p-4 rounded-2xl border border-zinc-200/60 shadow-sm", s.bg)}>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">{s.label}</p>
              <p className={cn("text-2xl font-black", s.color)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Accounts Table */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <h3 className="font-bold text-zinc-900">Connected Mailboxes</h3>
            <button onClick={fetchAccounts} className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-600 transition-colors">
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
            </button>
          </div>
          
          {loading && accounts.length === 0 ? (
            <div className="p-20 flex flex-col items-center justify-center text-zinc-400">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p className="text-sm font-medium">Loading your accounts...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="p-20 flex flex-col items-center justify-center text-zinc-400">
              <Server className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">No accounts connected yet.</p>
              <button 
                onClick={() => setShowModal(true)}
                className="mt-4 text-blue-600 text-sm font-bold hover:underline"
              >
                Connect your first account
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 bg-zinc-50/50">
                    <th className="px-6 py-3">Account</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Sent Today</th>
                    <th className="px-6 py-3">Health</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {accounts.map(acc => {
                    const prov = providerInfo[acc.provider] || providerInfo.smtp;
                    const stat = statusInfo[acc.status] || statusInfo.active;
                    const sentPct = acc.daily_limit > 0 ? Math.round(((acc.sent_today || 0) / acc.daily_limit) * 100) : 0;
                    return (
                      <tr key={acc.id} className="hover:bg-zinc-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-sm font-black border", prov.color, prov.border)}>{prov.logo}</div>
                            <div>
                              <p className="font-bold text-zinc-900 text-sm">{acc.email}</p>
                              <p className="text-xs text-zinc-400">{prov.label}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold", stat.bg, stat.color)}>
                            <span className={cn("h-1.5 w-1.5 rounded-full", stat.dot)} />{stat.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-zinc-900">{acc.sent_today || 0} <span className="text-zinc-400 font-normal">/ {acc.daily_limit}</span></p>
                          <div className="h-1.5 w-28 bg-zinc-100 rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${sentPct}%` }} />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 bg-zinc-100 rounded-full overflow-hidden">
                              <div className={cn("h-full rounded-full", (acc.health_score || 100) > 80 ? "bg-emerald-500" : (acc.health_score || 100) > 50 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${acc.health_score || 100}%` }} />
                            </div>
                            <span className={cn("text-xs font-black", (acc.health_score || 100) > 80 ? "text-emerald-600" : (acc.health_score || 100) > 50 ? "text-amber-600" : "text-rose-600")}>{acc.health_score || 100}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-700 transition-colors"><Settings className="h-4 w-4" /></button>
                            <button onClick={() => handleDelete(acc.id)} className="p-1.5 hover:bg-rose-50 rounded-lg text-zinc-400 hover:text-rose-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Connect Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
              <h2 className="text-lg font-bold text-zinc-900">{step === "select" ? "Connect Email Account" : step === "smtp" ? "Custom SMTP" : "Google Workspace"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-400"><X className="h-4 w-4" /></button>
            </div>

            <div className="p-6">
              {step === "select" && (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-500 mb-4">Choose your email provider to get started.</p>
                  {[
                    { key: "google", label: "Google Workspace / Gmail", sub: "Connect via OAuth — no password needed", logo: "G", color: "bg-red-50 text-red-600" },
                    { key: "smtp", label: "Custom SMTP", sub: "Any provider — Sendgrid, Mailgun, etc.", logo: "S", color: "bg-zinc-100 text-zinc-600" },
                  ].map(opt => (
                    <button key={opt.key} onClick={() => setStep(opt.key as any)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border border-zinc-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all group text-left">
                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm", opt.color)}>{opt.logo}</div>
                      <div className="flex-1">
                        <p className="font-bold text-zinc-900 text-sm">{opt.label}</p>
                        <p className="text-xs text-zinc-400">{opt.sub}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-blue-500 transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              {step === "google" && (
                <div className="space-y-5 text-center py-4">
                  <div className="h-16 w-16 rounded-2xl mx-auto flex items-center justify-center text-2xl font-black bg-red-50 text-red-600">G</div>
                  <div>
                    <h3 className="font-bold text-zinc-900">Connect Google Account</h3>
                    <p className="text-sm text-zinc-400 mt-1">Direct Google connection coming soon. Please use SMTP for now or contact support.</p>
                  </div>
                  <button onClick={() => setStep("smtp")} className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold transition-all">Use SMTP instead</button>
                  <button onClick={() => setStep("select")} className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors">← Back</button>
                </div>
              )}

              {step === "smtp" && (
                <form onSubmit={handleSmtpSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold flex items-center gap-2">
                       <AlertTriangle className="h-4 w-4" />
                       {error}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">SMTP Host</label>
                      <input name="host" required placeholder="smtp.gmail.com" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 transition-all font-medium" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Port</label>
                      <input name="port" required defaultValue="465" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 transition-all font-medium" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Email / Username</label>
                    <input name="user" type="email" required placeholder="alex@company.com" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 transition-all font-medium" />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Password / App Password</label>
                    <div className="relative">
                      <input name="pass" type={showPass ? "text" : "password"} required placeholder="••••••••" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:border-blue-400 transition-all font-medium" />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-100">
                    <div className="flex items-center justify-between mb-2">
                       <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Daily Sending Limit</label>
                       <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Recommended: 50</span>
                    </div>
                    <div className="relative">
                      <Zap className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                      <input 
                        name="daily_limit" 
                        type="number" 
                        defaultValue="50" 
                        min="1" 
                        max="2000"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-all font-bold" 
                      />
                    </div>
                    <p className="text-[9px] text-zinc-400 mt-1 ml-1 leading-relaxed">
                      Limits help protect your sender reputation. Start low and increase gradually.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setStep("select")} className="flex-1 py-3 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-50 transition-all">Back</button>
                    <button type="submit" disabled={connecting} className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/20">
                      {connecting ? <><Loader2 className="h-4 w-4 animate-spin" />Verifying...</> : "Connect Account"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
