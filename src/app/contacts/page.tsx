"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { 
  Plus, Search, Filter, Download, MoreVertical, LayoutList, LayoutGrid, 
  ChevronDown, X, UploadCloud, CheckCircle2, Circle, Search as SearchIcon, AlertCircle, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

type Contact = {
  id: string;
  name: string;
  email: string;
  company: string;
  jobTitle: string;
  phone: string;
  verificationStatus: "Verified" | "Unverified";
  dateAdded: string;
  customFields?: Record<string, string>;
};

// System fields for mapping
const SYSTEM_FIELDS: { key: string; label: string; required: boolean }[] = [
  { key: "name", label: "Full Name", required: true },
  { key: "email", label: "Email Address", required: true },
  { key: "jobTitle", label: "Job Title", required: false },
  { key: "company", label: "Company Name", required: false },
  { key: "phone", label: "Phone Number", required: false },
];

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: "1",
      name: "Anil Salvi",
      email: "anil@saleshandy.com",
      company: "Saleshandy",
      jobTitle: "Product Owner",
      phone: "+1 555-0100",
      verificationStatus: "Verified",
      dateAdded: "2h ago"
    },
    {
      id: "2",
      name: "Piyush Patel",
      email: "piyush@saleshandy.com",
      company: "Saleshandy",
      jobTitle: "Product Owner",
      phone: "+1 555-0101",
      verificationStatus: "Unverified",
      dateAdded: "1d ago"
    }
  ]);

  const [activeTab, setActiveTab] = useState("All Contacts");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  
  // Dropdown for Add Contact
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  
  // Modals state
  const [addModalType, setAddModalType] = useState<"Manual" | "CSV" | null>(null);
  
  // Manual Contact State
  const [manualForm, setManualForm] = useState({ name: "", email: "", company: "", jobTitle: "", phone: "" });

  // CSV Flow State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({}); // { systemKey: csvHeader }
  const [customFields, setCustomFields] = useState<{ key: string, label: string }[]>([]);
  const [isAddingCustomField, setIsAddingCustomField] = useState(false);
  const [newCustomFieldName, setNewCustomFieldName] = useState("");
  const [csvStep, setCsvStep] = useState<"Upload" | "Mapping" | "Importing">("Upload");

  // Filter contacts based on tab
  let displayedContacts = contacts;
  if (activeTab === "Unverified") {
    displayedContacts = contacts.filter(c => c.verificationStatus === "Unverified");
  }

  // Handle Manual Add
  const handleAddManualContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.name || !manualForm.email) return;

    const newContact: Contact = {
      id: Date.now().toString(),
      name: manualForm.name,
      email: manualForm.email,
      company: manualForm.company,
      jobTitle: manualForm.jobTitle,
      phone: manualForm.phone,
      verificationStatus: "Verified",
      dateAdded: "Just now"
    };

    setContacts([newContact, ...contacts]);
    setAddModalType(null);
    setManualForm({ name: "", email: "", company: "", jobTitle: "", phone: "" });
  };

  // Basic CSV Parser (Simplified for commas within quotes manually doing simple split for now, real use case would use papa parse)
  const parseCSVLine = (text: string) => {
    // simplified split by comma, ignoring quotes for a basic implementation
    return text.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
          const headers = parseCSVLine(lines[0]);
          const rows = lines.slice(1).map(parseCSVLine);
          setCsvHeaders(headers);
          setCsvRows(rows);
          
          // Auto-map where possible
          const initialMapping: Record<string, string> = {};
          SYSTEM_FIELDS.forEach(field => {
            const match = headers.find(h => h.toLowerCase().includes(field.key.toLowerCase()) || h.toLowerCase() === field.label.toLowerCase());
            if (match) initialMapping[field.key] = match;
          });
          setFieldMapping(initialMapping);
          setCsvStep("Mapping");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImportCsv = () => {
    setCsvStep("Importing");
    
    // Simulate import delay
    setTimeout(() => {
      const newContacts: Contact[] = csvRows.map((row, index) => {
        // Extract based on mapping
        const extractField = (systemKey: string) => {
          const mappedHeader = fieldMapping[systemKey];
          if (!mappedHeader) return "";
          const headerIndex = csvHeaders.indexOf(mappedHeader);
          return headerIndex >= 0 ? row[headerIndex] : "";
        };

        const contactCustomFields: Record<string, string> = {};
        customFields.forEach(cf => {
          const val = extractField(cf.key);
          if (val) contactCustomFields[cf.label] = val;
        });

        return {
          id: `csv-${Date.now()}-${index}`,
          name: extractField("name") || "(No Name)",
          email: extractField("email"),
          company: extractField("company"),
          jobTitle: extractField("jobTitle"),
          phone: extractField("phone"),
          verificationStatus: "Unverified" as const,
          dateAdded: "Just now",
          customFields: Object.keys(contactCustomFields).length > 0 ? contactCustomFields : undefined
        };
      }).filter(c => c.email); // Only import if they have an email at least, or maybe name

      setContacts([...newContacts, ...contacts]);
      setAddModalType(null);
      setCsvStep("Upload");
      setCsvFile(null);
      setCustomFields([]); // Reset custom fields after import
    }, 1500);
  };

  const addCustomField = () => {
    if (!newCustomFieldName.trim()) return;
    const key = `custom_${newCustomFieldName.toLowerCase().replace(/\s+/g, '_')}`;
    if (customFields.some(f => f.key === key) || SYSTEM_FIELDS.some(f => f.key === key)) {
      alert("Field already exists");
      return;
    }
    setCustomFields([...customFields, { key, label: newCustomFieldName }]);
    setNewCustomFieldName("");
    setIsAddingCustomField(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50">
      
      {/* Shared Top Header */}
      <PageHeader
        title="Contacts"
        subtitle="Manage your prospect list"
        actions={
          <div className="relative">
            <button 
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
            >
              <Plus className="h-4 w-4" /> Add Contact <ChevronDown className="h-4 w-4" />
            </button>
            {isAddMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 overflow-hidden text-sm">
                <button 
                  onClick={() => { setAddModalType("Manual"); setIsAddMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-zinc-50 text-zinc-900 border-b border-zinc-100 font-medium"
                >
                  Add Manually
                </button>
                <button 
                  onClick={() => { setAddModalType("CSV"); setIsAddMenuOpen(false); setCsvStep("Upload"); }}
                  className="w-full text-left px-4 py-3 hover:bg-zinc-50 text-blue-600 font-medium flex justify-between items-center"
                >
                  Upload CSV <UploadCloud className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="bg-white px-8 border-b border-zinc-200">
        <div className="flex items-center gap-8 -mb-px">
          {["All Contacts", "Unverified", "Created by You"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "py-3 border-b-2 text-sm font-semibold transition-colors",
                activeTab === tab 
                  ? "border-blue-600 text-blue-600" 
                  : "border-transparent text-zinc-500 hover:text-zinc-700"
              )}
            >
              {tab} {tab === "All Contacts" && <span className="ml-1.5 bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full text-xs">{contacts.length}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8">
        
        {/* Sub Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 bg-white border border-zinc-200 p-1 rounded-lg shadow-sm">
            <button 
              onClick={() => setViewMode("list")}
              className={cn("flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors", viewMode === "list" ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-700")}
            >
              <LayoutList className="h-4 w-4" /> List
            </button>
            <button 
              onClick={() => setViewMode("kanban")}
              className={cn("flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors", viewMode === "kanban" ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-700")}
            >
              <LayoutGrid className="h-4 w-4" /> Kanban
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search Name or Email"
                className="w-64 bg-white border border-zinc-200 rounded-lg pl-9 pr-4 py-2 text-sm font-medium placeholder:text-zinc-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-700 font-semibold text-sm hover:bg-zinc-50 transition-all shadow-sm">
              <Filter className="h-4 w-4 text-zinc-400" /> Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-700 font-semibold text-sm hover:bg-zinc-50 transition-all shadow-sm">
              <Download className="h-4 w-4 text-zinc-400" /> Export
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm flex flex-col h-[calc(100vh-280px)]">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="sticky top-0 bg-white shadow-[0_1px_0_var(--color-zinc-200)] z-10">
                <tr className="text-xs font-bold text-zinc-500 uppercase tracking-wide">
                  <th className="px-4 py-3.5 w-12"><input type="checkbox" className="rounded border-zinc-300" /></th>
                  <th className="px-4 py-3.5 font-bold">Name</th>
                  <th className="px-4 py-3.5 font-bold">Email</th>
                  <th className="px-4 py-3.5 font-bold">Job Title</th>
                  <th className="px-4 py-3.5 font-bold">Company</th>
                  <th className="px-4 py-3.5 font-bold">Verification Status</th>
                  <th className="px-4 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {displayedContacts.map((contact, i) => (
                  <tr key={contact.id} className="hover:bg-zinc-50/80 transition-colors group">
                    <td className="px-4 py-3.5"><input type="checkbox" className="rounded border-zinc-300" /></td>
                    <td className="px-4 py-3.5">
                      <Link href={`/contacts/${contact.id}`} className="font-semibold text-zinc-900 hover:text-blue-600 transition-colors">{contact.name}</Link>
                    </td>
                    <td className="px-4 py-3.5 text-zinc-600 flex items-center gap-2">
                      {contact.verificationStatus === "Verified" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-zinc-300" />
                      )}
                      {contact.email}
                    </td>
                    <td className="px-4 py-3.5 text-zinc-600">{contact.jobTitle || "-"}</td>
                    <td className="px-4 py-3.5 text-zinc-600">{contact.company || "-"}</td>
                    <td className="px-4 py-3.5">
                      <span className={cn(
                        "px-2.5 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1.5 uppercase tracking-wider",
                        contact.verificationStatus === "Verified" 
                          ? "bg-emerald-50 text-emerald-700" 
                          : "bg-amber-50 text-amber-700"
                      )}>
                        {contact.verificationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button className="text-zinc-400 hover:text-zinc-900 transition-colors opacity-0 group-hover:opacity-100 p-1">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-zinc-50 border-t border-zinc-200 px-6 py-3 flex items-center justify-between text-sm text-zinc-500 rounded-b-xl">
            <div>Showing {displayedContacts.length} out of {contacts.length}</div>
            <div className="flex items-center gap-4">
              <span>Go to page: <input type="number" defaultValue={1} className="w-12 border border-zinc-200 rounded px-2 py-1 text-center bg-white ml-2 appearance-none" /> / 1</span>
              <div className="flex items-center gap-1">
                <button className="px-2 py-1 hover:bg-zinc-200 rounded text-zinc-400">&lt;</button>
                <button className="px-3 py-1 bg-blue-100 text-blue-600 rounded font-semibold">1</button>
                <button className="px-2 py-1 hover:bg-zinc-200 rounded text-zinc-400">&gt;</button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Manual Add Contact Modal */}
      {addModalType === "Manual" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setAddModalType(null)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal content for Manual Add similar to original (abbreviated for size) */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <h2 className="text-lg font-bold">Add Manual Contact</h2>
              <button onClick={() => setAddModalType(null)} className="p-2 hover:bg-zinc-100 rounded-full"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleAddManualContact} className="p-6 space-y-4 bg-zinc-50/50">
              <input required placeholder="Name" className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-sm" value={manualForm.name} onChange={e => setManualForm({...manualForm, name: e.target.value})} />
              <input required type="email" placeholder="Email" className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-sm" value={manualForm.email} onChange={e => setManualForm({...manualForm, email: e.target.value})} />
              <input placeholder="Job Title" className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-sm" value={manualForm.jobTitle} onChange={e => setManualForm({...manualForm, jobTitle: e.target.value})} />
              <input placeholder="Company" className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-sm" value={manualForm.company} onChange={e => setManualForm({...manualForm, company: e.target.value})} />
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
                <button type="button" onClick={() => setAddModalType(null)} className="px-4 py-2 text-sm font-semibold rounded-lg hover:bg-zinc-100">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md">Add Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Upload Flow Modal */}
      {addModalType === "CSV" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setAddModalType(null)} />
          <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <h2 className="text-lg font-bold">Upload Contacts list (CSV)</h2>
              <button onClick={() => setAddModalType(null)} className="p-2 hover:bg-zinc-100 rounded-full"><X className="h-4 w-4" /></button>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-zinc-50/50">
              
              {csvStep === "Upload" && (
                <div 
                  className="border-2 border-dashed border-zinc-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-white hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                    <UploadCloud className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 mb-1">Click to upload CSV</h3>
                  <p className="text-zinc-500 text-sm">Drag and drop your file here, or click to browse.</p>
                  <div className="mt-6 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm">
                    Select File
                  </div>
                </div>
              )}

              {csvStep === "Mapping" && (
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3 border border-blue-100">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-bold text-blue-900 text-sm">Map your CSV fields</h4>
                      <p className="text-blue-700 text-sm mt-0.5">We found {csvHeaders.length} columns in your file. Match them to the system fields below so we know how to import them.</p>
                    </div>
                  </div>

                  {/* Raw File Preview */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                      <SearchIcon className="h-3 w-3" /> Raw File Preview (First 3 rows)
                    </h4>
                    <div className="border border-zinc-200 bg-white rounded-xl shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead className="bg-zinc-50 border-b border-zinc-200">
                            <tr>
                              {csvHeaders.map((h: string, i: number) => (
                                <th key={i} className="px-3 py-2 font-bold text-zinc-600 border-r border-zinc-200 last:border-0 truncate max-w-[150px]">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {csvRows.slice(0, 3).map((row: string[], ri: number) => (
                              <tr key={ri} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50">
                                {row.map((val: string, ci: number) => (
                                  <td key={ci} className="px-3 py-2 text-zinc-500 border-r border-zinc-200 last:border-0 truncate max-w-[150px]">{val || "-"}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border border-zinc-200 bg-white rounded-xl shadow-sm overflow-hidden">
                      <div className="grid grid-cols-3 bg-zinc-50 border-b border-zinc-200 px-6 py-3 font-semibold text-xs uppercase tracking-wider text-zinc-500">
                        <div>System Field</div>
                        <div>Your CSV Column</div>
                        <div>Sample Data</div>
                      </div>
                      <div className="divide-y divide-zinc-100">
                        {([...SYSTEM_FIELDS, ...customFields] as { key: string; label: string; required?: boolean }[]).map((sysField) => {
                          const mappedHeader = fieldMapping[sysField.key];
                          const headerIndex = csvHeaders.indexOf(mappedHeader);
                          const sampleValue = (headerIndex >= 0 && csvRows.length > 0) ? csvRows[0][headerIndex] : "-";

                          return (
                            <div key={sysField.key} className="grid grid-cols-3 px-6 py-4 items-center gap-4">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-zinc-900">{sysField.label}</span>
                                {sysField.required && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded tracking-wide uppercase">Required</span>}
                                {sysField.key.startsWith('custom_') && <span className="text-[10px] font-bold bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded tracking-wide uppercase">Custom</span>}
                              </div>
                              <div>
                                <select 
                                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium appearance-none"
                                  value={fieldMapping[sysField.key] || ""}
                                  onChange={(e) => setFieldMapping({ ...fieldMapping, [sysField.key]: e.target.value })}
                                >
                                  <option value="">-- Do not map --</option>
                                  {csvHeaders.map(h => (
                                    <option key={h} value={h}>{h}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="text-xs text-zinc-500 font-medium truncate italic" title={sampleValue}>
                                {sampleValue}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Add Custom Field UI */}
                    <div className="flex items-center justify-start">
                      {isAddingCustomField ? (
                        <div className="flex items-center gap-2 w-full max-w-md">
                          <input 
                            type="text" 
                            placeholder="Field Name (e.g. LinkedIn)" 
                            className="flex-1 bg-white border border-zinc-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                            value={newCustomFieldName}
                            onChange={(e) => setNewCustomFieldName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addCustomField()}
                            autoFocus
                          />
                          <button 
                            onClick={addCustomField}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
                          >
                            Add
                          </button>
                          <button 
                            onClick={() => {setIsAddingCustomField(false); setNewCustomFieldName("");}}
                            className="text-zinc-500 hover:text-zinc-900 px-2"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setIsAddingCustomField(true)}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-bold transition-colors bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 active:scale-95 duration-150"
                        >
                          <Plus className="h-4 w-4" /> Add Custom Field
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {csvStep === "Importing" && (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                  <h3 className="text-xl font-bold text-zinc-900 mb-2">Importing Contacts...</h3>
                  <p className="text-zinc-500">Please wait while we process {csvRows.length} records. They will be added to the Unverified list.</p>
                </div>
              )}

            </div>

            {csvStep === "Mapping" && (
              <div className="px-6 py-4 border-t border-zinc-100 bg-white flex items-center justify-between">
                <div className="text-sm font-medium text-zinc-500">
                  Ready to import <strong className="text-zinc-900">{csvRows.length}</strong> contacts
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setCsvStep("Upload")} className="px-5 py-2.5 text-sm font-semibold rounded-lg hover:bg-zinc-100 text-zinc-600 border border-zinc-200">Go Back</button>
                  <button onClick={handleImportCsv} disabled={!fieldMapping.email} className="px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    Import Contacts
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
