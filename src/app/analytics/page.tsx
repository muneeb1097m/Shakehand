"use client";

import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  Zap,
  Calendar,
  Download
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";

const performanceData = [
  { name: "Week 1", sent: 1200, opened: 800, replied: 120 },
  { name: "Week 2", sent: 1500, opened: 950, replied: 180 },
  { name: "Week 3", sent: 1100, opened: 700, replied: 90 },
  { name: "Week 4", sent: 2000, opened: 1400, replied: 310 },
];

const sourceData = [
  { name: "LinkedIn", value: 4500 },
  { name: "Direct Import", value: 3000 },
  { name: "Web Scraping", value: 2000 },
  { name: "Referrals", value: 500 },
];

const COLORS = ["#6366f1", "#a855f7", "#ec4899", "#f59e0b"];

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50">
      <PageHeader
        title="Analytics"
        subtitle="Deep dive into your outreach performance and conversion data"
        actions={
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all font-semibold text-sm text-zinc-700 shadow-sm">
              <Calendar className="h-4 w-4 text-zinc-400" />
              Last 30 Days
            </button>
            <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20">
              <Download className="h-4 w-4" />
              Export Report
            </button>
          </div>
        }
      />

      <div className="p-8 space-y-8">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-8 rounded-3xl border border-border bg-card/50 backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-8">Performance Trends</h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#71717a", fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#71717a", fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#09090b", 
                    border: "1px solid #27272a",
                    borderRadius: "12px",
                  }}
                />
                <Line type="monotone" dataKey="sent" stroke="#6366f1" strokeWidth={3} dot={{ r: 6, fill: "#6366f1" }} />
                <Line type="monotone" dataKey="opened" stroke="#a855f7" strokeWidth={3} dot={{ r: 6, fill: "#a855f7" }} />
                <Line type="monotone" dataKey="replied" stroke="#ec4899" strokeWidth={3} dot={{ r: 6, fill: "#ec4899" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-8 rounded-3xl border border-border bg-card/50 backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-8">Lead Sources</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 space-y-4">
            {sourceData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <Target className="h-5 w-5" />
            </div>
            <h4 className="font-bold">Conversion Rate</h4>
          </div>
          <p className="text-3xl font-bold">12.4%</p>
          <div className="flex items-center gap-2 mt-2 text-emerald-500 text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            +2.1% from last month
          </div>
        </div>
        <div className="p-6 rounded-3xl border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Users className="h-5 w-5" />
            </div>
            <h4 className="font-bold">Active Sequences</h4>
          </div>
          <p className="text-3xl font-bold">24</p>
          <div className="flex items-center gap-2 mt-2 text-rose-500 text-sm font-medium">
            <TrendingDown className="h-4 w-4" />
            -4 from last month
          </div>
        </div>
        <div className="p-6 rounded-3xl border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Zap className="h-5 w-5" />
            </div>
            <h4 className="font-bold">Response Time</h4>
          </div>
          <p className="text-3xl font-bold">4.2h</p>
          <div className="flex items-center gap-2 mt-2 text-emerald-500 text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            -30m from last month
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
