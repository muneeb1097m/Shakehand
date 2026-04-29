"use client";

import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { 
  ArrowUpRight, 
  Users, 
  Mail, 
  MousePointer2, 
  ChevronDown,
  ArrowLeftRight,
  Send,
  MailOpen,
  RotateCcw,
  MoreVertical,
  Plus,
  Info
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

const performanceData = [
  { name: "Day 1", value: 10 },
  { name: "Day 7", value: 25 },
  { name: "Day 14", value: 45 },
  { name: "Day 21", value: 35 },
  { name: "Today", value: 65 },
];

const miniChartData = [
  { name: "1", value: 40 },
  { name: "2", value: 30 },
  { name: "3", value: 45 },
  { name: "4", value: 35 },
  { name: "5", value: 55 },
];

const stats = [
  { 
    label: "Total Sent", 
    value: "12,450", 
    change: "+12.4%", 
    trend: "up", 
    icon: Send,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50"
  },
  { 
    label: "Open Rate", 
    value: "68.2%", 
    change: "+2.1%", 
    trend: "up", 
    icon: MailOpen,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50"
  },
  { 
    label: "Click Rate", 
    value: "12.5%", 
    change: "-0.5%", 
    trend: "down", 
    icon: MousePointer2,
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-50"
  },
  { 
    label: "Reply Rate", 
    value: "4.8%", 
    change: "+1.1%", 
    trend: "up", 
    icon: RotateCcw,
    iconColor: "text-orange-600",
    iconBg: "bg-orange-50"
  },
];

const sequences = [
  {
    name: "Outbound Q3 - SaaS Founders",
    updated: "Last updated 2h ago",
    status: "Active",
    leads: "1,240",
    openRate: "72%",
    icon: "bg-blue-100 text-blue-600",
    performance: [
      { v: 10 }, { v: 15 }, { v: 12 }, { v: 25 }, { v: 22 }, { v: 30 }, { v: 28 }
    ]
  },
  {
    name: "Webinar Follow-up - Series A",
    updated: "Last updated 5h ago",
    status: "Paused",
    leads: "456",
    openRate: "54%",
    icon: "bg-orange-100 text-orange-600",
    performance: [
      { v: 20 }, { v: 18 }, { v: 15 }, { v: 12 }, { v: 14 }, { v: 10 }, { v: 8 }
    ]
  },
  {
    name: "Cold Reach - HR Leaders",
    updated: "Last updated 2 days ago",
    status: "Active",
    leads: "2,118",
    openRate: "61%",
    icon: "bg-emerald-100 text-emerald-600",
    performance: [
      { v: 5 }, { v: 12 }, { v: 18 }, { v: 15 }, { v: 25 }, { v: 35 }, { v: 45 }
    ]
  }
];

const CircularProgress = ({ percent, label, status, colorClass }: any) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-24 w-24 flex items-center justify-center">
        <svg className="h-24 w-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-zinc-100 dark:text-zinc-800"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={colorClass}
          />
        </svg>
        <span className="absolute text-lg font-bold text-zinc-900 dark:text-white">{percent}%</span>
      </div>
      <span className="text-[10px] font-bold text-zinc-400 mt-2 uppercase tracking-widest">{label}</span>
      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md mt-1", 
        status === "Healthy" ? "bg-emerald-100 text-emerald-600" : 
        status === "Verified" ? "bg-blue-100 text-blue-600" : 
        "bg-orange-100 text-orange-600"
      )}>
        {status}
      </span>
    </div>
  )
}

export default function DashboardPage() {
  const headerActions = (
    <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 bg-white shadow-sm hover:bg-zinc-50 transition-all">
      <ArrowLeftRight className="h-4 w-4 text-blue-600" />
      <span className="text-sm font-semibold text-zinc-700">Agency/Client Switcher</span>
      <ChevronDown className="h-4 w-4 text-zinc-400" />
    </button>
  );

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50 dark:bg-zinc-950">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your outreach performance"
        actions={headerActions}
      />

      <main className="p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Sequence Health */}
          <div className="lg:col-span-2 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Sequence Health</h3>
              <Info className="h-5 w-5 text-zinc-300 hover:text-zinc-400 cursor-pointer" />
            </div>
            <div className="flex justify-between items-center px-4">
              <CircularProgress percent={90} label="SPF" status="Healthy" colorClass="text-emerald-500" />
              <CircularProgress percent={100} label="DKIM" status="Verified" colorClass="text-blue-500" />
              <CircularProgress percent={75} label="DMARC" status="Active" colorClass="text-orange-500" />
            </div>
          </div>

          {/* Warm-up Activity */}
          <div className="lg:col-span-3 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Warm-up Activity</h3>
                <p className="text-xs text-zinc-400 font-medium">Reputation building progress across all domains</p>
              </div>
              <div className="flex gap-2 bg-zinc-50 dark:bg-zinc-800 p-1 rounded-xl">
                <button className="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white">Last 7d</button>
                <button className="px-3 py-1.5 text-[10px] font-bold rounded-lg text-zinc-400 hover:text-zinc-600 transition-colors">Last 30d</button>
              </div>
            </div>
            <div className="h-[180px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "#a1a1aa", fontSize: 10, fontWeight: 600 }}
                    dy={10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      fontSize: "12px"
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2.5 rounded-xl", stat.iconBg)}>
                  <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
                </div>
                <div className={cn(
                  "flex items-center text-[10px] font-bold px-2 py-1 rounded-lg",
                  stat.trend === "up" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}>
                  {stat.change}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white mt-1">{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Active Sequences */}
        <div className="p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Active Sequences</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all">
              <Plus className="h-4 w-4" />
              New Sequence
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800">
                  <th className="pb-4 font-bold">Sequence Name</th>
                  <th className="pb-4 font-bold text-center">Status</th>
                  <th className="pb-4 font-bold text-center">Total Leads</th>
                  <th className="pb-4 font-bold text-center">Performance</th>
                  <th className="pb-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                {sequences.map((seq) => (
                  <tr key={seq.name} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-5">
                      <div className="flex items-center gap-4">
                        <div className={cn("h-10 w-10 flex items-center justify-center rounded-xl", seq.icon)}>
                          {seq.name.includes("Outbound") ? <ArrowUpRight className="h-5 w-5" /> : 
                           seq.name.includes("Webinar") ? <Mail className="h-5 w-5" /> : 
                           <Users className="h-5 w-5" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-900 dark:text-white">{seq.name}</span>
                          <span className="text-[10px] font-medium text-zinc-400">{seq.updated}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-5">
                      <div className="flex items-center justify-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full", seq.status === "Active" ? "bg-emerald-500" : "bg-zinc-300")} />
                        <span className={cn("text-xs font-bold", seq.status === "Active" ? "text-emerald-500" : "text-zinc-400")}>
                          {seq.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-5 text-center font-bold text-zinc-700 dark:text-zinc-300">
                      {seq.leads}
                    </td>
                    <td className="py-5">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1">
                           <span className="text-[10px] font-bold text-zinc-400 uppercase">Open</span>
                           <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">{seq.openRate}</span>
                        </div>
                        <div className="h-8 w-16">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={seq.performance}>
                              <Line 
                                type="monotone" 
                                dataKey="v" 
                                stroke={seq.status === "Active" ? "#3b82f6" : "#a1a1aa"} 
                                strokeWidth={2} 
                                dot={false} 
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 text-right">
                      <button className="p-2 text-zinc-300 hover:text-zinc-600 transition-colors">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
