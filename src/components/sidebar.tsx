"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Layers, Users, FileText, BarChart3, 
  Settings, Sparkles, CheckCircle, Inbox, Server, Flame,
  UserRound, Kanban, GitBranch, LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";

const navSections = [
  {
    label: "MAIN",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Inbox", href: "/inbox", icon: Inbox, badge: 3 },
    ]
  },
  {
    label: "OUTREACH",
    items: [
      { name: "Sequences", href: "/campaigns", icon: Layers },
      { name: "Contacts", href: "/contacts", icon: Users },
      { name: "Leads", href: "/leads", icon: UserRound },
      { name: "Templates", href: "/templates", icon: FileText },
      { name: "Pipeline", href: "/pipelines", icon: Kanban },
    ]
  },
  {
    label: "TOOLS",
    items: [
      { name: "Email Verifier", href: "/verify", icon: CheckCircle },
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
    ]
  },
  {
    label: "INFRASTRUCTURE",
    items: [
      { name: "Email Accounts", href: "/accounts", icon: Server },
      { name: "Warm-up", href: "/warmup", icon: Flame },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-screen w-60 border-r border-zinc-200 bg-white sticky top-0 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-zinc-100">
        <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-zinc-900 leading-none">Shakehand</span>
          <span className="text-[10px] font-medium text-zinc-400 mt-0.5">Cold Outreach Suite</span>
        </div>
      </div>

      {/* Workspace */}
      <div className="px-5 pt-4 pb-2">
        <span className="text-[9px] font-black tracking-widest text-zinc-300 uppercase block">Workspace</span>
        <span className="text-sm font-bold text-zinc-700 mt-0.5 block">Sales Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="text-[9px] font-black tracking-widest text-zinc-300 uppercase px-2 mb-1.5">{section.label}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center justify-between gap-2 px-3 py-2 text-sm font-semibold rounded-xl transition-all duration-150",
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className={cn(
                        "h-4 w-4 shrink-0",
                        isActive ? "text-blue-600" : "text-zinc-400 group-hover:text-zinc-700"
                      )} />
                      <span className="text-[13px]">{item.name}</span>
                    </div>
                    {"badge" in item && item.badge ? (
                      <span className="h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                        {item.badge}
                      </span>
                    ) : null}
                    {isActive && (
                      <div className="absolute right-0 top-1/4 bottom-1/4 w-0.5 bg-blue-600 rounded-l-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-zinc-100 space-y-0.5">
        <Link
          href="/settings"
          className={cn(
            "group flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold rounded-xl transition-all text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900",
            pathname.startsWith("/settings") && "bg-zinc-50 text-zinc-900"
          )}
        >
          <Settings className="h-4 w-4 text-zinc-400 group-hover:text-zinc-700" />
          Settings
        </Link>
        
        <button
          onClick={() => signOut()}
          className="w-full group flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold rounded-xl transition-all text-zinc-500 hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut className="h-4 w-4 text-zinc-400 group-hover:text-rose-600 transition-colors" />
          Log Out
        </button>

        <div className="flex items-center gap-3 px-3 py-2 mt-1">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-black shadow-sm shrink-0">
            AJ
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] font-bold text-zinc-900 truncate">Alex Johnson</span>
            <span className="text-[10px] font-medium text-zinc-400">Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
