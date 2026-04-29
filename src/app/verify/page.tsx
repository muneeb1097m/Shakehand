"use client";

import { useState, useRef } from "react";
import { PageHeader } from "@/components/page-header";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  Mail, 
  Info, 
  X, 
  Zap, 
  Diamond,
  CloudIcon,
  ArrowRight,
  AlertCircle,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  ShieldX
} from "lucide-react";
import { cn } from "@/lib/utils";
import { verifyEmailsAction, VerificationResult } from "@/lib/actions/verify";

export default function VerifyPage() {
  const [manualEmails, setManualEmails] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [results, setResults] = useState<VerificationResult[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVerify = async () => {
    if (!manualEmails.trim()) return;
    
    setIsVerifying(true);
    setResults(null);
    try {
      const data = await verifyEmailsAction(manualEmails);
      setResults(data);
    } catch (error) {
      console.error("Verification failed:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      console.log("Dropped file:", files[0].name);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50">
      
      {/* Shared Top Header */}
      <PageHeader
        title="Email Verifier"
        subtitle="Validate and clean your email lists"
        actions={
          <div className="flex items-center gap-2 bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-rose-100 shadow-sm">
            <AlertCircle className="h-3.5 w-3.5" />
            Your plan has expired.{" "}
            <button className="underline hover:text-rose-900 transition-colors">Resume Email Sending</button>
          </div>
        }
      />

      <div className="p-10 max-w-7xl mx-auto w-full">
        {/* Credits Badge Overlay-like */}
        <div className="flex justify-end mb-4">
          <div className="bg-white text-zinc-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-zinc-200 shadow-sm hover:border-blue-400 transition-all cursor-pointer group">
            <Diamond className="h-4 w-4 text-blue-500 fill-blue-500 group-hover:scale-110 transition-transform" />
            50 Credits
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          {/* Manual Entry Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-zinc-800">Enter an email or upload a file to verify</h2>
            <div className="relative group">
              <textarea 
                className="w-full h-48 bg-zinc-50/50 border border-zinc-200 rounded-2xl p-6 text-sm placeholder:text-zinc-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none shadow-sm group-hover:border-zinc-300"
                placeholder="Add entries with comma, semicolon, space or line breaks"
                value={manualEmails}
                onChange={(e) => setManualEmails(e.target.value)}
                disabled={isVerifying}
              />
              <div className="absolute bottom-4 right-6 text-[10px] font-bold text-zinc-400 bg-white/80 px-2 py-1 rounded shadow-sm backdrop-blur-sm">
                {manualEmails.length}/5000
              </div>
            </div>
            <button 
              onClick={handleVerify}
              disabled={isVerifying || !manualEmails.trim()}
              className={cn(
                "w-full py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2",
                manualEmails.trim() && !isVerifying
                  ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-500/20 active:scale-[0.99]" 
                  : "bg-blue-100/50 text-blue-300 cursor-not-allowed"
              )}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </button>
          </div>

          {/* CSV Upload Section */}
          <div className="space-y-4 flex flex-col justify-end">
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex-1 border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer group relative overflow-hidden",
                isDragging 
                  ? "border-blue-500 bg-blue-50/50" 
                  : "border-zinc-200 bg-zinc-50/30 hover:border-blue-400 hover:bg-zinc-50/80"
              )}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept=".csv" />
              <div className="h-20 w-20 bg-blue-100/50 text-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm ring-8 ring-blue-50/50">
                <CloudIcon className="h-10 w-10 animate-bounce group-hover:animate-none" />
              </div>
              <p className="text-sm font-bold text-zinc-800 mb-2">
                <span className="text-blue-600 hover:underline">Choose a file</span> or Drag & Drop your CSV with Prospect Details
              </p>
              <p className="text-xs font-semibold text-zinc-400">Supported format: .CSV (Max 10MB)</p>
              
              {isDragging && (
                <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="bg-white px-6 py-3 rounded-2xl shadow-xl border border-blue-100 flex items-center gap-3">
                    <ArrowRight className="h-5 w-5 text-blue-600 animate-pulse" />
                    <span className="text-sm font-bold text-zinc-900 tracking-tight">Drop your file here</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <button className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50/50 px-4 py-2 rounded-xl border border-blue-100/50">
                <FileText className="h-4 w-4" />
                Try sample file
              </button>
              <button className="bg-blue-100/50 text-blue-300 px-8 py-2.5 rounded-xl font-bold text-sm cursor-not-allowed shadow-sm border border-blue-50/50">
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {results && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-sm font-bold text-zinc-800 mb-4 flex items-center gap-2">
              Verification Results 
              <span className="text-xs font-normal text-zinc-400">({results.length} entries)</span>
            </h2>
            <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-xl shadow-zinc-200/50">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/80 border-b border-zinc-200">
                      <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-400">Email</th>
                      <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-400 text-center">Status</th>
                      <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-400">Details</th>
                      <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-400 text-center">Role-based</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {results.map((result, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold shadow-sm",
                              result.isValid ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                            )}>
                              {result.email.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-zinc-700">{result.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {result.isValid ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/50 text-[11px] font-bold">
                              <ShieldCheck className="h-3 w-3" />
                              Deliverable
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100/50 text-[11px] font-bold">
                              <ShieldX className="h-3 w-3" />
                              Invalid
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Badge checked={result.formatValid}>Format</Badge>
                            <Badge checked={result.domainValid}>Domain</Badge>
                            <Badge checked={result.mxValid}>MX Record</Badge>
                            {result.error && (
                              <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1 ml-1">
                                <AlertTriangle className="h-3 w-3" />
                                {result.error}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {result.isRoleBased ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-black uppercase">
                              Role
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-zinc-300">Personal</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function Badge({ children, checked }: { children: React.ReactNode, checked: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all",
      checked 
        ? "bg-emerald-50/50 text-emerald-600 border-emerald-100" 
        : "bg-zinc-50 text-zinc-300 border-zinc-100 line-through decoration-zinc-200"
    )}>
      {checked ? <CheckCircle2 className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {children}
    </div>
  );
}
