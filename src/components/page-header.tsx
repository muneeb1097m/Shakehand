"use client";

import { Bell, Users, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between px-8 py-4 bg-white border-b border-zinc-200 sticky top-0 z-10",
        className
      )}
    >
      {/* Left: Page Title */}
      <div className="flex flex-col">
        <h1 className="text-xl font-bold text-zinc-900 tracking-tight leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs text-zinc-400 font-medium mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Right: Actions + User */}
      <div className="flex items-center gap-4">
        {/* Custom actions slot */}
        {actions && <div className="flex items-center gap-3">{actions}</div>}

        {/* Divider */}
        <div className="h-6 w-px bg-zinc-200" />

        {/* Notification bell */}
        <button className="relative p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-xl transition-all">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 border-2 border-white" />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-3 pl-2">
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-zinc-900">Alex Johnson</span>
            <span className="text-[10px] font-medium text-zinc-400">Admin Account</span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-black shadow-md shadow-blue-500/20 cursor-pointer hover:scale-105 active:scale-95 transition-transform">
            AJ
          </div>
        </div>
      </div>
    </header>
  );
}
