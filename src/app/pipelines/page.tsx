"use client";

import React from "react";
import { PageHeader } from "@/components/page-header";
import { 
  Plus, 
  ChevronDown, 
  Filter, 
  MoreHorizontal, 
  Sparkles, 
  MessageCircle, 
  TrendingUp,
  Circle,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadCard {
  id: string;
  name: string;
  company: string;
  tag: string;
  tagColor: string;
  time: string;
  status: string;
  statusIcon: LucideIcon;
  statusColor: string;
  intent?: string;
  avatar?: string;
}

interface Column {
  id: string;
  title: string;
  count: number;
  dotColor: string;
  isAI?: boolean;
  cards: LeadCard[];
}

const columns: Column[] = [
  {
    id: "contacted",
    title: "CONTACTED",
    count: 12,
    dotColor: "bg-zinc-400",
    cards: [
      {
        id: "1",
        name: "Alex Rivera",
        company: "TechFlow Inc.",
        tag: "OUTREACH",
        tagColor: "bg-zinc-100 text-zinc-500",
        time: "2d ago",
        status: "Neutral",
        statusIcon: MessageCircle,
        statusColor: "text-blue-500",
      },
      {
        id: "2",
        name: "Taylor Smith",
        company: "Starlight Data",
        tag: "COLD CALL",
        tagColor: "bg-blue-50 text-blue-500",
        time: "5h ago",
        status: "Analyzing...",
        statusIcon: Sparkles,
        statusColor: "text-amber-500",
      },
    ],
  },
  {
    id: "replied",
    title: "REPLIED",
    count: 8,
    dotColor: "bg-blue-500",
    cards: [
      {
        id: "3",
        name: "Jordan Chen",
        company: "GreenGrid Co.",
        tag: "RESPONDED",
        tagColor: "bg-emerald-50 text-emerald-600",
        time: "1h ago",
        status: "Positive Reply",
        statusIcon: MessageCircle,
        statusColor: "text-indigo-500",
      },
    ],
  },
  {
    id: "interested",
    title: "INTERESTED (AI)",
    count: 4,
    dotColor: "bg-indigo-500",
    isAI: true,
    cards: [
      {
        id: "4",
        name: "Morgan Lee",
        company: "Nexus Systems",
        tag: "HIGH PRIORITY",
        tagColor: "bg-purple-100 text-purple-600",
        time: "30m ago",
        status: "Intent: High",
        statusIcon: TrendingUp,
        statusColor: "text-emerald-500",
      },
      {
        id: "5",
        name: "Casey Wright",
        company: "Orbit Logistics",
        tag: "WARM LEAD",
        tagColor: "bg-zinc-100 text-zinc-500",
        time: "1d ago",
        status: "Positive Signal",
        statusIcon: MessageCircle,
        statusColor: "text-blue-500",
      },
    ],
  },
];

export default function PipelinesPage() {
  return (
    <div className="flex flex-col h-screen bg-zinc-50/30 overflow-hidden">
      {/* Shared Top Header */}
      <PageHeader
        title="Pipeline"
        subtitle="Track and manage your lead progression"
        actions={
          <button className="flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] text-sm">
            <Plus className="h-4 w-4 stroke-[2.5px]" />
            New Lead
          </button>
        }
      />

      {/* Filter Bar */}
      <div className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-zinc-200/80 rounded-[14px] text-[13px] font-bold text-zinc-800 hover:bg-zinc-50 transition-colors shadow-sm">
            <div className="h-4 w-4 rounded-full bg-zinc-900 border-2 border-zinc-100 flex items-center justify-center">
               <div className="h-1.5 w-1.5 bg-white rounded-full" />
            </div>
            <span>Assigned To: All</span>
            <ChevronDown className="h-4 w-4 text-zinc-400 ml-1" />
          </button>
          <button className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-zinc-200/80 rounded-[14px] text-[13px] font-bold text-zinc-800 hover:bg-zinc-50 transition-colors shadow-sm">
            <Circle className="h-4 w-4 text-zinc-400" />
            <span>Date: Last 30 Days</span>
            <ChevronDown className="h-4 w-4 text-zinc-400 ml-1" />
          </button>
          <button className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-zinc-200/80 rounded-[14px] text-[13px] font-bold text-zinc-800 hover:bg-zinc-50 transition-colors shadow-sm">
            <Filter className="h-[18px] w-[18px] text-zinc-500" />
            <span>Filters</span>
          </button>
        </div>
        <div className="flex items-center gap-2.5 text-[13px]">
          <span className="text-zinc-400 font-bold uppercase tracking-wider text-[11px]">Pipeline Status:</span>
          <span className="text-blue-600 font-extrabold">Standard Sales</span>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto px-8 pb-10">
        <div className="flex h-full gap-7 min-w-max">
          {columns.map((column) => (
            <div 
              key={column.id} 
              className={cn(
                "flex flex-col w-[360px] h-full bg-[#edf1f5]/60 rounded-[32px] border border-transparent transition-all overflow-hidden",
                column.isAI && "border-[#cbd5e1] border-dashed border-2 bg-blue-50/10"
              )}
            >
              <div className="flex items-center justify-between p-6 pb-5">
                <div className="flex items-center gap-3">
                  <div className={cn("h-2 w-2 rounded-full", column.dotColor)} />
                  <h3 className="text-[13px] font-black tracking-[0.05em] text-zinc-500/80 uppercase">{column.title}</h3>
                  <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-lg text-[12px] font-black">
                    {column.count}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {column.isAI && <Sparkles className="h-[18px] w-[18px] text-blue-600 stroke-[2.5px]" />}
                  <button className="p-1 hover:bg-zinc-200/50 rounded-lg transition-colors">
                    <MoreHorizontal className="h-5 w-5 text-zinc-400" />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-4 pt-0 space-y-4 overflow-y-auto no-scrollbar pb-10">
                {column.cards.map((card) => (
                  <div 
                    key={card.id} 
                    className="bg-white p-5 rounded-[24px] border border-zinc-200/50 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] transition-all duration-300 group cursor-pointer"
                  >
                    <div className="flex justify-between items-center mb-5">
                      <span className={cn("text-[10px] font-black px-2.5 py-1.5 rounded-[8px] tracking-[0.05em] uppercase", card.tagColor)}>
                        {card.tag}
                      </span>
                      <span className="text-[12px] font-bold text-zinc-400/80">{card.time}</span>
                    </div>
                    
                    <div className="mb-5">
                      <h4 className="text-[17px] font-black text-[#1e293b] group-hover:text-blue-600 transition-colors uppercase leading-[1.2] tracking-normal mb-1">{card.name}</h4>
                      <p className="text-[13px] text-zinc-400 font-bold">{card.company}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                      <div className="flex items-center gap-2.5">
                        <card.statusIcon className={cn("h-[18px] w-[18px] fill-current opacity-80", card.statusColor)} />
                        <span className={cn("text-[12px] font-black tracking-tight", card.statusColor)}>
                          {card.status}
                        </span>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-zinc-100 overflow-hidden flex items-center justify-center border-2 border-white ring-1 ring-zinc-200/50 shadow-sm relative">
                        <img 
                          src={`https://ui-avatars.com/api/?name=${card.name}&background=random&color=fff&bold=true`} 
                          alt={card.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <div className="w-[360px] flex items-center justify-center h-full rounded-[32px] border-2 border-dashed border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100/50 transition-all cursor-pointer group">
            <div className="flex flex-col items-center gap-3 text-zinc-400 group-hover:text-zinc-500">
               <Plus className="h-8 w-8 stroke-[3px]" />
               <span className="text-[11px] font-black uppercase tracking-[0.1em]">Add Column</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
