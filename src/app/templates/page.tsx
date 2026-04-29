"use client";

import { useState, useEffect } from "react";
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
  Star,
  X,
  Loader2,
  AlertCircle,
  Type
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  getTemplates, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate, 
  type Template 
} from "@/lib/actions/templates";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "Outreach",
    subject: "",
    body: ""
  });

  const categories = ["All", "Outreach", "Follow-up", "Personalized", "Social Proof"];

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    setIsLoading(true);
    const { data, error } = await getTemplates();
    if (data) setTemplates(data);
    if (error) console.error("Error fetching templates:", error);
    setIsLoading(false);
  }

  const handleOpenModal = (template: Template | null = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        category: template.category,
        subject: template.subject,
        body: template.body
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: "",
        category: "Outreach",
        subject: "",
        body: ""
      });
    }
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = editingTemplate 
      ? await updateTemplate(editingTemplate.id, formData)
      : await createTemplate(formData);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      await fetchTemplates();
      setIsModalOpen(false);
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this template?")) return;

    const { error } = await deleteTemplate(id);
    if (error) {
      alert("Error deleting template: " + error);
    } else {
      setTemplates(templates.filter(t => t.id !== id));
    }
  };

  const filteredTemplates = templates.filter(t => 
    selectedCategory === "All" || t.category === selectedCategory
  );

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50">
      <PageHeader
        title="Templates"
        subtitle="Create and manage high-converting email sequences"
        actions={
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
          >
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
                ? "bg-blue-600 text-white" 
                : "bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="font-medium text-lg">Loading templates...</p>
        </div>
      ) : filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="group p-6 rounded-3xl border border-zinc-200 bg-white hover:shadow-xl hover:border-blue-500/20 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900">{template.name}</h3>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-black">{template.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-2 py-1 rounded-lg text-[10px] font-black uppercase">
                  <Star className="h-3 w-3 fill-current" />
                  New
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">Subject</p>
                  <p className="text-sm font-bold text-zinc-900 truncate">{template.subject}</p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">Body Preview</p>
                  <p className="text-sm text-zinc-500 line-clamp-2 italic leading-relaxed">{template.body}</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-bold uppercase tracking-wide">
                  <Zap className="h-3.5 w-3.5 text-blue-500" />
                  Ready to use
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleOpenModal(template)}
                    className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-500" 
                    title="Edit"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={(e) => handleDelete(e, template.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500" 
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-100 transition-all ml-2">
                    <Eye className="h-4 w-4" />
                    Preview
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="col-span-full py-20 text-center bg-white border border-zinc-200 border-dashed rounded-[2.5rem]">
           <div className="h-16 w-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-zinc-300" />
           </div>
           <h3 className="text-lg font-bold text-zinc-900">No templates yet</h3>
           <p className="text-sm text-zinc-400 max-w-xs mx-auto mt-1 mb-6">
             {selectedCategory === "All" ? "Click Create Template to get started." : `No templates found in the ${selectedCategory} category.`}
           </p>
           {selectedCategory === "All" && (
             <button 
               onClick={() => handleOpenModal()}
               className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
             >
               Create Template
             </button>
           )}
        </div>
      )}
      </div>

      {/* Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => !isSubmitting && setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-100">
              <h2 className="text-xl font-black text-zinc-900 tracking-tight">
                {editingTemplate ? "Edit Template" : "Create New Template"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 transition-colors"
                disabled={isSubmitting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3">
                  <AlertCircle className="h-5 w-5" /> {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Template Name</label>
                  <input 
                    required 
                    placeholder="e.g. Initial Outreach" 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Category</label>
                  <select 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    disabled={isSubmitting}
                  >
                    {categories.filter(c => c !== "All").map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Email Subject</label>
                <input 
                  required 
                  placeholder="e.g. Quick question for {{first_name}}" 
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                  value={formData.subject} 
                  onChange={e => setFormData({ ...formData, subject: e.target.value })} 
                  disabled={isSubmitting}
                />
                <p className="text-[10px] text-zinc-400 font-bold ml-1 flex items-center gap-1.5 uppercase tracking-wide">
                   <Type className="h-3 w-3" />
                   Tip: Use {"{{first_name}}"}, {"{{company}}"}, {"{{job_title}}"} as variables
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Email Body</label>
                <textarea 
                  required 
                  rows={8}
                  placeholder="Write your email content here..." 
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all leading-relaxed" 
                  value={formData.body} 
                  onChange={e => setFormData({ ...formData, body: e.target.value })} 
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-6 py-3 text-sm font-bold text-zinc-500 rounded-2xl hover:bg-zinc-100 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-8 py-3 text-sm font-black bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 transition-all uppercase tracking-widest"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingTemplate ? "Update Template" : "Save Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
