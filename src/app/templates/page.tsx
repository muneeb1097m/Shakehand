"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { 
  Plus, 
  Search, 
  Copy, 
  Trash2, 
  Edit3, 
  Eye,
  Mail,
  Zap,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";

const templates = [
  {
    id: 1,
    name: "SaaS Problem/Solution",
    subject: "Hate {{problem}}? We solved it for {{company}}",
    preview: "Hey {{firstName}}, I noticed that {{company}} is currently dealing with...",
    category: "Outreach",
    rating: 4.8,
    usage: 1240
  },
  {
    id: 2,
    name: "AI Personalization",
    subject: "Quick question about {{jobTitle}} at {{company}}",
    preview: "Hi {{firstName}}, I saw your recent post about AI in {{industry}} and...",
    category: "Personalized",
    rating: 4.9,
    usage: 856
  },
  {
    id: 3,
    name: "Follow-up: Gentle Nudge",
    subject: "Re: Quick question about {{jobTitle}}",
    preview: "Hi {{firstName}}, just wanted to bubble this up in case it got buried...",
    category: "Follow-up",
    rating: 4.5,
    usage: 3200
  },
  {
    id: 4,
    name: "Case Study Drop",
    subject: "How we helped {{similarCompany}} reach {{metric}}",
    preview: "Hey {{firstName}}, I follow your work at {{company}} and thought you might...",
    category: "Social Proof",
    rating: 4.7,
    usage: 540
  }
];

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Outreach", "Follow-up", "Personalized", "Social Proof"];

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50">
      <PageHeader
        title="Templates"
        subtitle="Create and manage high-converting email sequences"
        actions={
          <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20">
            <Plus className="h-4 w-4" />
            Create Template
          </button>
        }
      />

      <div className="p-8 space-y-8">

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
              selectedCategory === category 
                ? "bg-primary text-primary-foreground" 
                : "bg-card/50 border border-border hover:bg-muted"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="group p-6 rounded-3xl border border-border bg-card/50 backdrop-blur-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{template.name}</h3>
                  <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">{template.category}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg text-xs font-bold">
                <Star className="h-3 w-3 fill-current" />
                {template.rating}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="p-3 rounded-xl bg-zinc-900/50 border border-border/50">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Subject</p>
                <p className="text-sm font-medium">{template.subject}</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/50 border border-border/50">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Preview</p>
                <p className="text-sm text-muted-foreground line-clamp-2 italic">{template.preview}</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <Zap className="h-3 w-3 text-indigo-500" />
                Used {template.usage} times
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Duplicate">
                  <Copy className="h-4 w-4" />
                </button>
                <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Edit">
                  <Edit3 className="h-4 w-4" />
                </button>
                <button className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/20 transition-all ml-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
